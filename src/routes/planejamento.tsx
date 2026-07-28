import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  AssumptionNote,
  DataBadge,
  EmptyState,
  MetricValue,
  PageHeader,
  Panel,
  SectionHeader,
} from "@/components/finance/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CurrencyField } from "@/components/finance/CurrencySelect";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/domain/currency";
import {
  FREQUENCY_LABEL,
  amountForMonth,
  occursInMonth,
  type ExpensePlan,
  type IncomePlan,
  type PlanFrequency,
} from "@/domain/planning";
import { runProjection, summarizeProjection, budgetLine } from "@/domain/projectionEngine";
import { monthMetrics, netWorthForMonth } from "@/domain/financialMetrics";
import {
  INCOME_NATURE_LABEL,
  INCOME_TYPE_LABEL,
  type IncomeNature,
  type IncomeType,
} from "@/domain/types";
import {
  useAccounts,
  useBalances,
  useCategories,
  useIncomeEntries,
  useTransactions,
} from "@/hooks/useFinanceData";
import {
  useExpensePlans,
  useIncomePlans,
  usePlanningDelete,
  usePlanningInsert,
  usePlanningUpdate,
  useScenarios,

} from "@/hooks/usePlanning";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCents, formatPercent, formatSignedCents, parseCurrencyToCents } from "@/lib/format";
import { currentMonthKey, monthEndISO, monthLabel, monthLabelShort, monthStartISO } from "@/lib/months";

export const Route = createFileRoute("/planejamento")({
  validateSearch: (search: Record<string, unknown>) => ({
    scenario: typeof search.scenario === "string" ? search.scenario : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Planejamento · Belchior" },
      {
        name: "description",
        content: "Planeje receitas e despesas futuras e projete a evolução do seu patrimônio mês a mês.",
      },
      { property: "og:title", content: "Planejamento · Belchior" },
      {
        property: "og:description",
        content: "Orçamento planejado versus real e projeção determinística de patrimônio.",
      },
    ],
  }),
  component: PlanejamentoPage,
});

const FREQUENCIES = Object.keys(FREQUENCY_LABEL) as PlanFrequency[];
const INCOME_TYPES = Object.keys(INCOME_TYPE_LABEL) as IncomeType[];
const NATURES = Object.keys(INCOME_NATURE_LABEL) as IncomeNature[];

function PlanejamentoPage() {
  const { scenario: scenarioParam } = Route.useSearch();
  const navigate = useNavigate({ from: "/planejamento" });
  const { convert, displayCurrency } = useCurrency();
  const month = currentMonthKey();

  const { data: scenarios = [], isLoading: loadingScenarios } = useScenarios();
  const scenario = scenarios.find((s) => s.id === scenarioParam) ?? scenarios.find((s) => s.is_default) ?? scenarios[0];

  const { data: incomePlans = [] } = useIncomePlans(scenario?.id);
  const { data: expensePlans = [] } = useExpensePlans(scenario?.id);
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: balances = [] } = useBalances();
  const { data: incomes = [] } = useIncomeEntries(month);
  const { data: transactions = [] } = useTransactions({
    from: monthStartISO(month),
    to: monthEndISO(month),
  });

  const addIncomePlan = usePlanningInsert("income_plans");
  const addExpensePlan = usePlanningInsert("expense_plans");
  const updateIncomePlan = usePlanningUpdate("income_plans");
  const updateExpensePlan = usePlanningUpdate("expense_plans");
  const removeIncomePlan = usePlanningDelete("income_plans");
  const removeExpensePlan = usePlanningDelete("expense_plans");


  const startingNetWorth = netWorthForMonth(month, accounts, balances, convert).netWorth;

  const projection = useMemo(() => {
    if (!scenario) return [];
    return runProjection({
      startMonth: scenario.start_month,
      horizonMonths: scenario.horizon_months,
      startingNetWorthCents: startingNetWorth,
      incomePlans,
      expensePlans,
      expectedMonthlyReturn: scenario.expected_monthly_return,
      convert,
      displayCurrency,
    });
  }, [scenario, startingNetWorth, incomePlans, expensePlans, convert, displayCurrency]);

  const summary = useMemo(() => summarizeProjection(projection), [projection]);

  const actual = monthMetrics(month, transactions, incomes, categories, convert);
  const plannedMonth = projection.find((p) => p.month === month);

  const budget = [
    budgetLine("income", "Receitas", plannedMonth?.totalIncome ?? 0, actual.income.total),
    budgetLine("essential", "Despesas essenciais", plannedMonth?.essentialExpenses ?? 0, actual.expenses.essential),
    budgetLine(
      "discretionary",
      "Despesas discricionárias",
      plannedMonth?.discretionaryExpenses ?? 0,
      actual.expenses.discretionary,
    ),
    budgetLine("balance", "Saldo do mês", plannedMonth?.cashFlow ?? 0, actual.balance),
  ];

  const chartData = projection.map((p) => ({
    month: monthLabelShort(p.month),
    patrimonio: p.netWorthEnd / 100,
    fluxo: p.cashFlow / 100,
  }));

  if (!scenario) {
    return (
      <AppLayout>
        <PageHeader title="Planejamento" description="Orçamento planejado e projeção de patrimônio." />
        {loadingScenarios ? null : (
          <EmptyState
            title="Crie um cenário para começar"
            description="O planejamento vive dentro de um cenário. Crie o cenário Base e volte aqui."
            action={
              <Button asChild size="sm">
                <Link to="/cenarios">Ir para cenários</Link>
              </Button>
            }
          />
        )}
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Planejamento"
        description={`Cenário ${scenario.name} · ${scenario.horizon_months} meses a partir de ${monthLabel(scenario.start_month)}`}
        action={
          <Select
            value={scenario.id}
            onValueChange={(id) => void navigate({ search: { scenario: id } })}
          >
            <SelectTrigger className="h-9 w-[200px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scenarios.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricValue
          label="Patrimônio projetado"
          value={formatCents(summary.finalNetWorth, displayCurrency)}
          hint={`Ao fim de ${scenario.horizon_months} meses`}
          badge="PROJETADO"
          tone="accent"
        />
        <MetricValue
          label="Fluxo médio mensal"
          value={formatSignedCents(summary.averageMonthlyCashFlow, displayCurrency)}
          badge="PROJETADO"
          tone={summary.averageMonthlyCashFlow >= 0 ? "positive" : "negative"}
        />
        <MetricValue
          label="Taxa de poupança média"
          value={formatPercent(summary.averageSavingsRate)}
          badge="PROJETADO"
        />
        <MetricValue
          label="Meses no vermelho"
          value={String(summary.negativeMonths)}
          hint={summary.firstNegativeMonth ? `Primeiro em ${monthLabel(summary.firstNegativeMonth)}` : "Nenhum"}
          badge="PROJETADO"
          tone={summary.negativeMonths > 0 ? "negative" : "positive"}
        />
      </div>

      <Panel className="mt-4">
        <SectionHeader
          title="Projeção de patrimônio"
          description="Patrimônio inicial real + fluxo planejado + retorno esperado."
          action={<DataBadge kind="PROJETADO" />}
        />
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} minTickGap={24} />
              <YAxis tick={{ fontSize: 11 }} width={70} />
              <ChartTooltip
                formatter={(value: number) => formatCents(Math.round(value * 100), displayCurrency)}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
              <Area
                type="monotone"
                dataKey="patrimonio"
                stroke="hsl(var(--primary))"
                fill="url(#netWorthFill)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <AssumptionNote>
          Premissas: retorno de {formatPercent(scenario.expected_monthly_return, 2)} ao mês sobre o patrimônio,
          reajuste anual aplicado no aniversário de cada plano e conversão cambial pela cotação vigente na data.
          Nenhum valor projetado é misturado com dados reais.
        </AssumptionNote>
      </Panel>

      <Tabs defaultValue="orcamento" className="mt-6">
        <TabsList>
          <TabsTrigger value="orcamento">Orçamento do mês</TabsTrigger>
          <TabsTrigger value="receitas">Receitas planejadas</TabsTrigger>
          <TabsTrigger value="despesas">Despesas planejadas</TabsTrigger>
        </TabsList>

        <TabsContent value="orcamento" className="mt-4">
          <Panel>
            <SectionHeader title={`Planejado × real · ${monthLabel(month)}`} />
            <div className="mt-4 grid gap-2">
              {budget.map((line) => (
                <div
                  key={line.key}
                  className="grid grid-cols-2 items-center gap-2 rounded-xl border border-border bg-surface/40 px-4 py-3 sm:grid-cols-4"
                >
                  <span className="text-sm text-foreground">{line.label}</span>
                  <span className="text-right text-sm tabular-nums text-muted-foreground sm:text-left">
                    {formatCents(line.planned, displayCurrency)}
                  </span>
                  <span className="text-sm tabular-nums text-foreground">
                    {formatCents(line.actual, displayCurrency)}
                  </span>
                  <span
                    className={`text-right text-sm tabular-nums ${line.diff >= 0 ? "text-positive" : "text-negative"}`}
                  >
                    {formatSignedCents(line.diff, displayCurrency)}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Colunas: rótulo · planejado · real · diferença.
            </p>
          </Panel>
        </TabsContent>

        <TabsContent value="receitas" className="mt-4">
          <Panel>
            <SectionHeader
              title="Receitas planejadas"
              description="Salários, benefícios e entradas previstas deste cenário."
              action={
                <PlanDialog
                  kind="income"
                  scenarioId={scenario.id}
                  categories={[]}
                  onSubmit={(values) => addIncomePlan.mutateAsync(values)}
                />
              }
            />
            <PlanList
              plans={incomePlans}
              month={month}
              displayCurrency={displayCurrency}
              onDelete={(id) => removeIncomePlan.mutateAsync(id)}
              renderEdit={(plan) => (
                <PlanDialog
                  kind="income"
                  scenarioId={scenario.id}
                  categories={[]}
                  plan={plan}
                  onSubmit={(values) => updateIncomePlan.mutateAsync({ id: plan.id, values })}
                />
              )}
              describe={(p) =>
                `${INCOME_TYPE_LABEL[(p as IncomePlan).type]} · ${INCOME_NATURE_LABEL[(p as IncomePlan).nature]}`
              }
            />
          </Panel>
        </TabsContent>

        <TabsContent value="despesas" className="mt-4">
          <Panel>
            <SectionHeader
              title="Despesas planejadas"
              description="Custos fixos e variáveis previstos deste cenário."
              action={
                <PlanDialog
                  kind="expense"
                  scenarioId={scenario.id}
                  categories={categories.map((c) => ({ id: c.id, name: c.name }))}
                  onSubmit={(values) => addExpensePlan.mutateAsync(values)}
                />
              }
            />
            <PlanList
              plans={expensePlans}
              month={month}
              displayCurrency={displayCurrency}
              onDelete={(id) => removeExpensePlan.mutateAsync(id)}
              renderEdit={(plan) => (
                <PlanDialog
                  kind="expense"
                  scenarioId={scenario.id}
                  categories={categories.map((c) => ({ id: c.id, name: c.name }))}
                  plan={plan}
                  onSubmit={(values) => updateExpensePlan.mutateAsync({ id: plan.id, values })}
                />
              )}
              describe={(p) => ((p as ExpensePlan).essential ? "Essencial" : "Discricionária")}
            />
          </Panel>
        </TabsContent>

      </Tabs>
    </AppLayout>
  );
}

function PlanList({
  plans,
  month,
  displayCurrency,
  onDelete,
  describe,
}: {
  plans: Array<IncomePlan | ExpensePlan>;
  month: string;
  displayCurrency: CurrencyCode;
  onDelete: (id: string) => Promise<unknown>;
  describe: (plan: IncomePlan | ExpensePlan) => string;
}) {
  if (plans.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState title="Nenhum plano cadastrado" description="Adicione o primeiro plano para alimentar a projeção." />
      </div>
    );
  }
  return (
    <ul className="mt-4 grid gap-2">
      {plans.map((plan) => (
        <li
          key={plan.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/40 px-4 py-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{plan.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {describe(plan)} · {FREQUENCY_LABEL[plan.frequency]}
              {plan.annual_adjustment_percent ? ` · +${plan.annual_adjustment_percent}% a.a.` : ""}
              {occursInMonth(plan, month) ? " · ocorre neste mês" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm tabular-nums text-foreground">
              {formatCents(amountForMonth(plan, month), plan.currency)}
            </span>
            <Button size="sm" variant="ghost" className="text-negative" onClick={() => void onDelete(plan.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function PlanDialog({
  kind,
  scenarioId,
  categories,
  onSubmit,
}: {
  kind: "income" | "expense";
  scenarioId: string;
  categories: Array<{ id: string; name: string }>;
  onSubmit: (values: Record<string, unknown>) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    currency: DEFAULT_CURRENCY as CurrencyCode,
    frequency: "MONTHLY" as PlanFrequency,
    startDate: currentMonthKey(),
    endDate: "",
    adjustment: "0",
    type: "SALARY" as IncomeType,
    nature: "RECURRING" as IncomeNature,
    essential: true,
    categoryId: "",
  });

  async function submit() {
    const cents = parseCurrencyToCents(form.amount);
    if (!form.name.trim() || cents === null || cents <= 0) {
      toast.error("Informe nome e valor válidos.");
      return;
    }
    const base = {
      scenario_id: scenarioId,
      name: form.name.trim(),
      amount_cents: cents,
      currency: form.currency,
      frequency: form.frequency,
      months_of_year: [],
      start_date: form.startDate,
      end_date: form.endDate || null,
      annual_adjustment_percent: Number(form.adjustment.replace(",", ".")) || 0,
      enabled: true,
    };
    try {
      await onSubmit(
        kind === "income"
          ? { ...base, type: form.type, nature: form.nature }
          : { ...base, essential: form.essential, category_id: form.categoryId || null },
      );
      toast.success("Plano adicionado.");
      setOpen(false);
      setForm({ ...form, name: "", amount: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o plano.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" /> Novo plano
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{kind === "income" ? "Nova receita planejada" : "Nova despesa planejada"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="plan-name">Nome</Label>
            <Input id="plan-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="plan-amount">Valor</Label>
              <Input
                id="plan-amount"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Moeda</Label>
              <CurrencyField value={form.currency} onChange={(c) => setForm({ ...form, currency: c })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Frequência</Label>
              <Select
                value={form.frequency}
                onValueChange={(v) => setForm({ ...form, frequency: v as PlanFrequency })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {FREQUENCY_LABEL[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan-adjust">Reajuste anual (%)</Label>
              <Input
                id="plan-adjust"
                inputMode="decimal"
                value={form.adjustment}
                onChange={(e) => setForm({ ...form, adjustment: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="plan-start">Início</Label>
              <Input
                id="plan-start"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan-end">Fim (opcional)</Label>
              <Input
                id="plan-end"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>

          {kind === "income" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as IncomeType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {INCOME_TYPE_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Natureza</Label>
                <Select value={form.nature} onValueChange={(v) => setForm({ ...form, nature: v as IncomeNature })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NATURES.map((n) => (
                      <SelectItem key={n} value={n}>
                        {INCOME_NATURE_LABEL[n]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select
                  value={form.categoryId || "none"}
                  onValueChange={(v) => setForm({ ...form, categoryId: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
                <Label htmlFor="plan-essential" className="text-sm">
                  Despesa essencial
                </Label>
                <Switch
                  id="plan-essential"
                  checked={form.essential}
                  onCheckedChange={(v) => setForm({ ...form, essential: v })}
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={submit}>Salvar plano</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
