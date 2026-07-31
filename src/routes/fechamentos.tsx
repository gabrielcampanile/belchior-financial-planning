import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState, MetricValue, PageHeader, Panel, SectionHeader } from "@/components/finance/primitives";
import { Button } from "@/components/ui/button";
import { CategoryDonut } from "@/components/finance/CategoryDonut";
import { toast } from "sonner";
import {
  useAccounts,
  useBalances,
  useCategories,
  useClosures,
  useTransactions,
  useUpsert,
} from "@/hooks/useFinanceData";
import { INCOME_TYPE_LABEL, type IncomeType } from "@/domain/types";
import { buildClosureTotals, monthMetrics, netWorthForMonth } from "@/domain/financialMetrics";
import { closureHighlights } from "@/domain/summaryPhrases";
import { formatCents, formatPercent } from "@/lib/format";
import { useCurrency } from "@/hooks/useCurrency";
import { currentMonthKey, monthEndISO, monthLabel, monthStartISO, shiftMonth } from "@/lib/months";

export const Route = createFileRoute("/fechamentos")({
  head: () => ({
    meta: [
      { title: "Fechamentos · Belchior" },
      {
        name: "description",
        content: "Revise receitas, despesas e patrimônio do mês e congele o fechamento mensal.",
      },
      { property: "og:title", content: "Fechamentos · Belchior" },
      { property: "og:description", content: "Fechamento mensal com totais congelados e reabertura." },
    ],
  }),
  component: ClosuresPage,
});

function ClosuresPage() {
  const [month, setMonth] = useState(currentMonthKey());

  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: balances = [] } = useBalances();
  const { data: closures = [] } = useClosures();
  const { data: transactions = [] } = useTransactions({
    from: monthStartISO(month),
    to: monthEndISO(month),
  });

  const upsertClosure = useUpsert("closures", "user_id,month");
  const { convert, displayCurrency } = useCurrency();

  const metrics = useMemo(
    () => monthMetrics(month, transactions, categories, convert),
    [month, transactions, categories, convert],
  );
  const netWorth = netWorthForMonth(month, accounts, balances, convert).netWorth;
  const closure = closures.find((c) => c.month === month);
  const uncategorized = transactions.filter((t) => t.type === "EXPENSE" && !t.category_id).length;
  const incomeCount = transactions.filter((t) => t.type === "INCOME").length;
  const highlights = closureHighlights(month, metrics, displayCurrency);

  async function toggleClosure() {
    const closing = closure?.status !== "CLOSED";
    await upsertClosure.mutateAsync({
      month,
      status: closing ? "CLOSED" : "OPEN",
      totals: closing ? buildClosureTotals(metrics, netWorth) : {},
      closed_at: closing ? new Date().toISOString() : null,
    });
    toast.success(closing ? "Mês fechado." : "Mês reaberto.");
  }

  return (
    <AppLayout>
      <PageHeader
        title="Fechamento mensal"
        description="Receitas e despesas vêm 100% das transações — nada é lançado manualmente aqui."
        action={
          <Button onClick={toggleClosure} variant={closure?.status === "CLOSED" ? "outline" : "default"}>
            {closure?.status === "CLOSED" ? "Reabrir mês" : "Fechar mês"}
          </Button>
        }
      />

      <Panel className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setMonth(shiftMonth(month, -1))}>
            ←
          </Button>
          <span className="min-w-40 text-center text-sm capitalize">{monthLabel(month)}</span>
          <Button variant="outline" size="sm" onClick={() => setMonth(shiftMonth(month, 1))}>
            →
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {uncategorized > 0
            ? `${uncategorized} despesa(s) sem categoria`
            : "Todas as despesas estão categorizadas"}
          {closure?.status === "CLOSED" ? " · mês fechado" : ""}
        </p>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricValue label="Receita total" value={formatCents(metrics.income.total, displayCurrency)} badge="REAL" />
        <MetricValue label="Despesas" value={formatCents(metrics.expenses.total, displayCurrency)} badge="REAL" />
        <MetricValue
          label="Saldo do mês"
          value={formatCents(metrics.balance, displayCurrency)}
          tone={metrics.balance >= 0 ? "positive" : "negative"}
          badge="REAL"
        />
        <MetricValue
          label="Aportes"
          value={formatCents(metrics.investments, displayCurrency)}
          hint={`Taxa ${formatPercent(metrics.investmentRate)}`}
          badge="REAL"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="space-y-4">
          <SectionHeader
            title="Receitas por categoria"
            description={`${incomeCount} transação(ões) de entrada em ${monthLabel(month)}.`}
          />
          <CategoryDonut
            slices={metrics.income.byCategory}
            currency={displayCurrency}
            emptyLabel="Nenhuma receita neste mês"
          />
          {metrics.income.byType.length ? (
            <ul className="space-y-1.5">
              {metrics.income.byType.map((item) => (
                <li key={item.type} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {INCOME_TYPE_LABEL[item.type as IncomeType] ?? item.type}
                  </span>
                  <span className="tabular-nums text-positive">
                    {formatCents(item.total, displayCurrency)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </Panel>

        <Panel className="space-y-4">
          <SectionHeader
            title="Despesas por categoria"
            description={`Essenciais ${formatCents(metrics.expenses.essential, displayCurrency)} · discricionárias ${formatCents(metrics.expenses.discretionary, displayCurrency)}.`}
          />
          <CategoryDonut
            slices={metrics.expenses.byCategory}
            currency={displayCurrency}
            emptyLabel="Nenhuma despesa neste mês"
          />
        </Panel>
      </div>

      {transactions.length === 0 ? (
        <Panel>
          <EmptyState
            title="Nenhuma transação neste mês"
            description="Importe um extrato ou uma fatura de cartão para que receitas e despesas apareçam aqui."
            action={
              <Button asChild size="sm">
                <Link to="/importar">Importar arquivo</Link>
              </Button>
            }
          />
        </Panel>
      ) : null}

      <Panel className="space-y-4">
        <SectionHeader title="Destaques do mês" description="Regras determinísticas sobre dados reais." />
        <ul className="space-y-3">
          {highlights.map((h) => (
            <li key={h.label} className="rounded-xl border border-border bg-surface/50 px-4 py-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{h.label}</p>
              <p
                className={`mt-1 text-sm ${
                  h.tone === "positive" ? "text-positive" : h.tone === "negative" ? "text-negative" : "text-foreground"
                }`}
              >
                {h.value}
              </p>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="space-y-4">
        <SectionHeader title="Histórico de fechamentos" />
        {closures.length === 0 ? (
          <EmptyState title="Nenhum mês fechado" description="Feche um mês para congelar os totais." />
        ) : (
          <ul className="divide-y divide-border">
            {closures.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                <span className="text-sm capitalize">{monthLabel(c.month)}</span>
                <span className="text-xs uppercase tracking-widest text-muted-foreground">{c.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AppLayout>
  );
}
