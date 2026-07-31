import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState, PageHeader, Panel } from "@/components/finance/primitives";
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
  useCategories,
  useDeleteRow,
  useTransactions,
  useUpdateRow,
  useUpsert,
} from "@/hooks/useFinanceData";
import {
  INCOME_NATURE_LABEL,
  INCOME_TYPE_LABEL,
  TRANSACTION_TYPE_LABEL,
  type Category,
  type IncomeNature,
  type IncomeType,
  type TransactionType,
} from "@/domain/types";
import { dedupeHash } from "@/domain/csv";
import { formatApprox, formatCents, parseCurrencyToCents } from "@/lib/format";
import { useCurrency } from "@/hooks/useCurrency";
import { CurrencyField } from "@/components/finance/CurrencySelect";
import { DEFAULT_CURRENCY, money, toCurrencyCode, type CurrencyCode } from "@/domain/currency";
import { currentMonthKey, formatDateBR, monthEndISO, monthLabel, monthStartISO, shiftMonth } from "@/lib/months";

export const Route = createFileRoute("/transacoes")({
  head: () => ({
    meta: [
      { title: "Transações · Belchior" },
      {
        name: "description",
        content: "Filtre, categorize e edite todas as suas transações mensais em um só lugar.",
      },
      { property: "og:title", content: "Transações · Belchior" },
      { property: "og:description", content: "Lista completa de transações com filtros e categorização." },
    ],
  }),
  component: TransactionsPage,
});

const TYPES: TransactionType[] = ["EXPENSE", "INCOME", "TRANSFER", "INVESTMENT_CONTRIBUTION"];

const TABS = [
  { key: "ALL", label: "Todas" },
  { key: "INCOME", label: "Receitas" },
  { key: "EXPENSE", label: "Despesas" },
  { key: "OTHER", label: "Transferências e aportes" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/** Categorias de receita e de despesa são conjuntos distintos. */
function categoriesFor(categories: Category[], type: TransactionType): Category[] {
  if (type === "INCOME") return categories.filter((c) => c.kind === "INCOME");
  if (type === "INVESTMENT_CONTRIBUTION") return categories.filter((c) => c.kind !== "INCOME");
  return categories.filter((c) => c.kind !== "INCOME");
}

function TransactionsPage() {
  const [month, setMonth] = useState(currentMonthKey());
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabKey>("ALL");
  const [open, setOpen] = useState(false);

  const { data: transactions = [], isLoading } = useTransactions({
    from: monthStartISO(month),
    to: monthEndISO(month),
  });
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const upsert = useUpsert("transactions");
  const update = useUpdateRow("transactions");
  const remove = useDeleteRow("transactions");
  const { convert, displayCurrency } = useCurrency();

  const filtered = useMemo(
    () =>
      transactions.filter((t) => {
        if (tab === "INCOME" && t.type !== "INCOME") return false;
        if (tab === "EXPENSE" && t.type !== "EXPENSE") return false;
        if (tab === "OTHER" && t.type !== "TRANSFER" && t.type !== "INVESTMENT_CONTRIBUTION") return false;
        if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [transactions, tab, search],
  );

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of transactions) {
      const value = Math.abs(convert(money(tx.amount_cents, toCurrencyCode(tx.currency)), tx.occurred_on));
      if (tx.type === "INCOME") income += value;
      if (tx.type === "EXPENSE") expense += value;
    }
    return { income, expense, balance: income - expense };
  }, [transactions, convert]);

  const [form, setForm] = useState({
    occurred_on: new Date().toISOString().slice(0, 10),
    description: "",
    amount: "",
    type: "EXPENSE" as TransactionType,
    income_type: "SALARY" as IncomeType,
    income_nature: "RECURRING" as IncomeNature,
    category_id: "none",
    account_id: "none",
    currency: DEFAULT_CURRENCY as CurrencyCode,
  });

  async function createTransaction() {
    const cents = parseCurrencyToCents(form.amount);
    if (!cents || !form.description.trim()) {
      toast.error("Informe descrição e valor.");
      return;
    }
    const amount = Math.abs(cents);
    await upsert.mutateAsync({
      occurred_on: form.occurred_on,
      description: form.description.trim(),
      amount_cents: amount,
      currency: form.currency,
      type: form.type,
      income_type: form.type === "INCOME" ? form.income_type : null,
      income_nature: form.type === "INCOME" ? form.income_nature : null,
      category_id: form.category_id === "none" ? null : form.category_id,
      account_id: form.account_id === "none" ? null : form.account_id,
      source: "MANUAL",
      dedupe_hash: dedupeHash(form.occurred_on, amount, form.description, form.currency),
    });
    toast.success("Transação criada.");
    setOpen(false);
    setForm({ ...form, description: "", amount: "" });
  }

  /** Mover uma linha entre receita e despesa limpa os campos que não se aplicam. */
  function changeType(id: string, current: TransactionType, next: TransactionType) {
    if (current === next) return;
    update.mutate({
      id,
      values: {
        type: next,
        category_id: null,
        income_type: next === "INCOME" ? "OTHER" : null,
        income_nature: next === "INCOME" ? "RECURRING" : null,
      },
    });
  }

  return (
    <AppLayout>
      <PageHeader
        title="Transações"
        description={`Movimentações de ${monthLabel(month)}. Receitas e despesas daqui alimentam o fechamento mensal.`}
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/importar">Importar CSV</Link>
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-1 h-4 w-4" /> Nova
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nova transação</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={form.occurred_on}
                      onChange={(e) => setForm({ ...form, occurred_on: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Descrição</Label>
                    <Input
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Valor</Label>
                    <Input
                      value={form.amount}
                      placeholder="1.234,56"
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Moeda</Label>
                    <CurrencyField
                      value={form.currency}
                      onChange={(currency) => setForm({ ...form, currency })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select
                      value={form.type}
                      onValueChange={(v) =>
                        setForm({ ...form, type: v as TransactionType, category_id: "none" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {TRANSACTION_TYPE_LABEL[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {form.type === "INCOME" ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>Tipo de renda</Label>
                        <Select
                          value={form.income_type}
                          onValueChange={(v) => setForm({ ...form, income_type: v as IncomeType })}
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
                          value={form.income_nature}
                          onValueChange={(v) => setForm({ ...form, income_nature: v as IncomeNature })}
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
                  ) : null}
                  <div className="grid gap-2">
                    <Label>Categoria</Label>
                    <Select
                      value={form.category_id}
                      onValueChange={(v) => setForm({ ...form, category_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sem categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem categoria</SelectItem>
                        {categoriesFor(categories, form.type).map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Conta</Label>
                    <Select
                      value={form.account_id}
                      onValueChange={(v) => setForm({ ...form, account_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sem conta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem conta</SelectItem>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={createTransaction} disabled={upsert.isPending}>
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Panel className="grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Receitas do mês</p>
          <p className="text-lg tabular-nums text-positive">{formatCents(totals.income, displayCurrency)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Despesas do mês</p>
          <p className="text-lg tabular-nums">{formatCents(totals.expense, displayCurrency)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Saldo</p>
          <p className={`text-lg tabular-nums ${totals.balance >= 0 ? "text-positive" : "text-negative"}`}>
            {formatCents(totals.balance, displayCurrency)}
          </p>
        </div>
      </Panel>

      <Panel className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setMonth(shiftMonth(month, -1))}>
              ←
            </Button>
            <span className="min-w-36 text-center text-sm capitalize">{monthLabel(month)}</span>
            <Button variant="outline" size="sm" onClick={() => setMonth(shiftMonth(month, 1))}>
              →
            </Button>
          </div>
          <Input
            placeholder="Buscar descrição…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Button
              key={t.key}
              size="sm"
              variant={tab === t.key ? "default" : "outline"}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nenhuma transação"
            description="Importe um extrato ou uma fatura de cartão, ou crie uma transação manual."
          />
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((tx) => (
              <li key={tx.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateBR(tx.occurred_on)}
                    {tx.type === "INCOME" && tx.income_type
                      ? ` · ${INCOME_TYPE_LABEL[tx.income_type]} · ${INCOME_NATURE_LABEL[tx.income_nature ?? "RECURRING"]}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={tx.type}
                    onValueChange={(v) => changeType(tx.id, tx.type, v as TransactionType)}
                  >
                    <SelectTrigger className="h-8 w-36 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TRANSACTION_TYPE_LABEL[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {tx.type === "INCOME" ? (
                    <Select
                      value={tx.income_type ?? "OTHER"}
                      onValueChange={(v) => update.mutate({ id: tx.id, values: { income_type: v } })}
                    >
                      <SelectTrigger className="h-8 w-36 text-xs">
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
                  ) : null}
                  <Select
                    value={tx.category_id ?? "none"}
                    onValueChange={(v) =>
                      update.mutate({ id: tx.id, values: { category_id: v === "none" ? null : v } })
                    }
                  >
                    <SelectTrigger className="h-8 w-40 text-xs">
                      <SelectValue placeholder="Sem categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem categoria</SelectItem>
                      {categoriesFor(categories, tx.type).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span
                    className={`w-32 text-right text-sm tabular-nums ${
                      tx.type === "INCOME" ? "text-positive" : "text-foreground"
                    }`}
                  >
                    {formatCents(tx.amount_cents, toCurrencyCode(tx.currency))}
                    {toCurrencyCode(tx.currency) !== displayCurrency ? (
                      <span className="block text-xs text-muted-foreground">
                        {formatApprox(
                          convert(money(tx.amount_cents, toCurrencyCode(tx.currency)), tx.occurred_on),
                          displayCurrency,
                        )}
                      </span>
                    ) : null}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Excluir"
                    onClick={() => remove.mutate(tx.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AppLayout>
  );
}
