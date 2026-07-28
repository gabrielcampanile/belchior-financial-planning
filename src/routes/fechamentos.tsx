import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState, MetricValue, PageHeader, Panel, SectionHeader } from "@/components/finance/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useAccounts,
  useBalances,
  useCategories,
  useClosures,
  useDeleteRow,
  useIncomeEntries,
  useTransactions,
  useUpsert,
} from "@/hooks/useFinanceData";
import {
  INCOME_NATURE_LABEL,
  INCOME_TYPE_LABEL,
  type IncomeNature,
  type IncomeType,
} from "@/domain/types";
import { buildClosureTotals, monthMetrics, netWorthForMonth } from "@/domain/financialMetrics";
import { closureHighlights } from "@/domain/summaryPhrases";
import { formatCents, formatPercent, parseCurrencyToCents } from "@/lib/format";
import { useCurrency } from "@/hooks/useCurrency";
import { toCurrencyCode } from "@/domain/currency";
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
  const [open, setOpen] = useState(false);

  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: balances = [] } = useBalances();
  const { data: closures = [] } = useClosures();
  const { data: incomes = [] } = useIncomeEntries(month);
  const { data: transactions = [] } = useTransactions({
    from: monthStartISO(month),
    to: monthEndISO(month),
  });

  const upsertIncome = useUpsert("income_entries");
  const removeIncome = useDeleteRow("income_entries");
  const upsertClosure = useUpsert("closures", "user_id,month");

  const metrics = useMemo(
    () => monthMetrics(month, transactions, incomes, categories, convert),
    [month, transactions, incomes, categories],
  );
  const netWorth = netWorthForMonth(month, accounts, balances, convert).netWorth;
  const closure = closures.find((c) => c.month === month);
  const uncategorized = transactions.filter((t) => t.type === "EXPENSE" && !t.category_id).length;
  const highlights = closureHighlights(month, metrics);

  const [form, setForm] = useState({
    name: "",
    amount: "",
    type: "SALARY" as IncomeType,
    nature: "RECURRING" as IncomeNature,
  });

  async function addIncome() {
    const cents = parseCurrencyToCents(form.amount);
    if (!form.name.trim() || !cents) {
      toast.error("Informe nome e valor da receita.");
      return;
    }
    await upsertIncome.mutateAsync({
      month,
      name: form.name.trim(),
      type: form.type,
      nature: form.nature,
      amount_cents: Math.abs(cents),
    });
    toast.success("Receita registrada.");
    setOpen(false);
    setForm({ ...form, name: "", amount: "" });
  }

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
        description="Importe, categorize, revise receitas, atualize saldos e feche o mês."
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

      <Panel className="space-y-4">
        <SectionHeader
          title="Receitas do mês"
          description="Recorrentes, temporárias e extraordinárias são separadas nos cálculos."
          action={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1 h-4 w-4" /> Receita
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova receita de {monthLabel(month)}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Nome</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Valor</Label>
                    <Input
                      value={form.amount}
                      placeholder="8.500,00"
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select
                      value={form.type}
                      onValueChange={(v) => setForm({ ...form, type: v as IncomeType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(INCOME_TYPE_LABEL) as IncomeType[]).map((t) => (
                          <SelectItem key={t} value={t}>
                            {INCOME_TYPE_LABEL[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Natureza</Label>
                    <Select
                      value={form.nature}
                      onValueChange={(v) => setForm({ ...form, nature: v as IncomeNature })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(INCOME_NATURE_LABEL) as IncomeNature[]).map((n) => (
                          <SelectItem key={n} value={n}>
                            {INCOME_NATURE_LABEL[n]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={addIncome} disabled={upsertIncome.isPending}>
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />
        {incomes.length === 0 ? (
          <EmptyState
            title="Nenhuma receita registrada"
            description="Registre salário, benefícios, bolsa, PLR ou freelances deste mês."
          />
        ) : (
          <ul className="divide-y divide-border">
            {incomes.map((income) => (
              <li key={income.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm">{income.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {INCOME_TYPE_LABEL[income.type]} · {INCOME_NATURE_LABEL[income.nature]}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm tabular-nums text-positive">
                    {formatCents(income.amount_cents, toCurrencyCode(income.currency))}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => removeIncome.mutate(income.id)}>
                    Excluir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

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
