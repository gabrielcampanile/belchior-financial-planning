import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState, MetricValue, PageHeader, Panel, SectionHeader } from "@/components/finance/primitives";
import { Button } from "@/components/ui/button";
import {
  useAccounts,
  useBalances,
  useCategories,
  useIncomeEntries,
  useProfile,
  useSettings,
  useTransactions,
} from "@/hooks/useFinanceData";
import {
  emergencyFundTarget,
  monthMetrics,
  netWorthForMonth,
  netWorthSeries,
  reserveMonths,
} from "@/domain/financialMetrics";
import { dashboardPhrase } from "@/domain/summaryPhrases";
import { formatCents, formatCentsShort, formatPercent } from "@/lib/format";
import {
  currentMonthKey,
  greetingForHour,
  lastMonths,
  monthEndISO,
  monthLabel,
  monthLabelShort,
  monthStartISO,
  shiftMonth,
} from "@/lib/months";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visão geral · Belchior" },
      {
        name: "description",
        content:
          "Patrimônio líquido, receitas, despesas e reserva financeira do mês em um painel único e determinístico.",
      },
      { property: "og:title", content: "Visão geral · Belchior" },
      {
        property: "og:description",
        content: "Acompanhe patrimônio, taxa de investimento e reserva financeira do mês.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const month = currentMonthKey();
  const { data: profile } = useProfile();
  const { data: settings } = useSettings();
  const { data: accounts = [] } = useAccounts();
  const { data: balances = [] } = useBalances();
  const { data: categories = [] } = useCategories();
  const { data: incomes = [] } = useIncomeEntries(month);
  const { data: transactions = [] } = useTransactions({
    from: monthStartISO(month),
    to: monthEndISO(month),
  });

  const metrics = useMemo(
    () => monthMetrics(month, transactions, incomes, categories),
    [month, transactions, incomes, categories],
  );
  const series = useMemo(
    () => netWorthSeries(lastMonths(month, 12), accounts, balances),
    [month, accounts, balances],
  );
  const now = netWorthForMonth(month, accounts, balances);
  const previous = netWorthForMonth(shiftMonth(month, -1), accounts, balances);
  const essentialMonthly = metrics.expenses.essential || metrics.expenses.total;
  const months = reserveMonths(now.liquid, essentialMonthly);
  const targetMonths = settings?.emergency_months ?? 6;
  const hasData = accounts.length > 0 || transactions.length > 0 || incomes.length > 0;

  const phrase = dashboardPhrase({
    netWorthNow: now.netWorth,
    netWorthPrevious: balances.length ? previous.netWorth : null,
    metrics,
    hasData,
    reserveMonths: months,
    emergencyMonthsTarget: targetMonths,
  });

  const chartData = series.map((s) => ({ month: monthLabelShort(s.month), value: s.netWorth / 100 }));

  return (
    <AppLayout>
      <PageHeader
        title={`${greetingForHour(new Date().getHours())}${profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}`}
        description={phrase}
        action={
          <Button asChild variant="outline">
            <Link to="/fechamentos">Fechar {monthLabel(month)}</Link>
          </Button>
        }
      />

      {!hasData ? (
        <EmptyState
          title="Comece pelo essencial"
          description="Cadastre suas contas de patrimônio, registre as receitas do mês ou importe um extrato em CSV para ver seus indicadores."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link to="/patrimonio">Cadastrar patrimônio</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/importar">Importar CSV</Link>
              </Button>
            </div>
          }
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricValue
          label="Patrimônio líquido"
          value={formatCents(now.netWorth)}
          hint={`Ativos ${formatCents(now.assets)} · Passivos ${formatCents(now.liabilities)}`}
          badge="REAL"
          tone="accent"
        />
        <MetricValue
          label="Receita recorrente"
          value={formatCents(metrics.income.recurring)}
          hint={`Total do mês ${formatCents(metrics.income.total)}`}
          badge="REAL"
        />
        <MetricValue
          label="Despesas do mês"
          value={formatCents(metrics.expenses.total)}
          hint={`Essenciais ${formatCents(metrics.expenses.essential)}`}
          badge="REAL"
        />
        <MetricValue
          label="Saldo do mês"
          value={formatCents(metrics.balance)}
          tone={metrics.balance >= 0 ? "positive" : "negative"}
          hint={`Taxa de poupança ${formatPercent(metrics.savingsRate)}`}
          badge="REAL"
        />
        <MetricValue
          label="Taxa de investimento"
          value={formatPercent(metrics.investmentRate)}
          hint={`Aportes ${formatCents(metrics.investments)}`}
          badge="REAL"
        />
        <MetricValue
          label="Reserva financeira"
          value={`${months.toFixed(1)} meses`}
          hint={`Líquido ${formatCents(now.liquid)} · meta ${formatCents(emergencyFundTarget(essentialMonthly, targetMonths))}`}
          tone={months >= targetMonths ? "positive" : "neutral"}
          badge="REAL"
        />
      </div>

      <Panel className="space-y-4">
        <SectionHeader title="Patrimônio histórico" description="Últimos 12 meses, apenas dados reais." />
        {balances.length === 0 ? (
          <EmptyState
            title="Sem saldos registrados"
            description="Registre o saldo mensal das suas contas em Patrimônio para desenhar a linha histórica."
          />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  width={70}
                  tickFormatter={(v: number) => formatCentsShort(v * 100)}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--popover-foreground)",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [formatCents(v * 100), "Patrimônio"]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <Panel className="space-y-4">
        <SectionHeader
          title={`Resumo de ${monthLabel(month)}`}
          description="Maiores categorias de despesa do mês corrente."
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/transacoes">Ver transações</Link>
            </Button>
          }
        />
        {metrics.expenses.byCategory.length === 0 ? (
          <EmptyState
            title="Nenhuma despesa neste mês"
            description="Importe um extrato ou lance transações manualmente para ver a distribuição por categoria."
          />
        ) : (
          <ul className="divide-y divide-border">
            {metrics.expenses.byCategory.slice(0, 6).map((row) => (
              <li key={row.categoryId ?? "none"} className="flex items-center justify-between gap-4 py-3">
                <span className="min-w-0 truncate text-sm text-foreground">{row.name}</span>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  {formatCents(row.total)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AppLayout>
  );
}
