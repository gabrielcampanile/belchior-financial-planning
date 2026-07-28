import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState, MetricValue, PageHeader, Panel, SectionHeader } from "@/components/finance/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccounts, useBalances, useDeleteRow, useUpsert } from "@/hooks/useFinanceData";
import {
  ACCOUNT_TYPE_LABEL,
  LIQUID_BY_DEFAULT,
  type AccountSide,
  type AccountType,
} from "@/domain/types";
import { netWorthForMonth } from "@/domain/financialMetrics";
import { centsToInput, formatApprox, formatCents, parseCurrencyToCents } from "@/lib/format";
import { useCurrency } from "@/hooks/useCurrency";
import { CurrencyField } from "@/components/finance/CurrencySelect";
import { DEFAULT_CURRENCY, money, toCurrencyCode, type CurrencyCode } from "@/domain/currency";
import { currentMonthKey, monthLabel, shiftMonth } from "@/lib/months";

export const Route = createFileRoute("/patrimonio")({
  head: () => ({
    meta: [
      { title: "Patrimônio · Belchior" },
      {
        name: "description",
        content: "Cadastre contas, ativos e dívidas e registre o saldo mensal para acompanhar seu patrimônio.",
      },
      { property: "og:title", content: "Patrimônio · Belchior" },
      { property: "og:description", content: "Ativos, passivos e patrimônio líquido mês a mês." },
    ],
  }),
  component: PatrimonioPage,
});

const TYPES = Object.keys(ACCOUNT_TYPE_LABEL) as AccountType[];

function PatrimonioPage() {
  const [month, setMonth] = useState(currentMonthKey());
  const [open, setOpen] = useState(false);
  const { data: accounts = [] } = useAccounts();
  const { data: balances = [] } = useBalances();
  const upsertAccount = useUpsert("accounts");
  const upsertBalance = useUpsert("account_balances", "user_id,account_id,month");
  const removeAccount = useDeleteRow("accounts");
  const { convert, displayCurrency } = useCurrency();

  const snapshot = netWorthForMonth(month, accounts, balances, convert);
  const [form, setForm] = useState({
    name: "",
    type: "CHECKING" as AccountType,
    side: "ASSET" as AccountSide,
    liquid: true,
    currency: DEFAULT_CURRENCY as CurrencyCode,
  });

  /** Saldo registrado exatamente neste mês (0 se não houver). */
  function exactBalanceOf(accountId: string) {
    return balances.find((b) => b.account_id === accountId && b.month === month)?.balance_cents ?? 0;
  }

  /** Saldo vigente: último saldo conhecido até o mês — é o valor que conta no patrimônio. */
  function balanceOf(accountId: string) {
    const known = balances
      .filter((b) => b.account_id === accountId && b.month <= month)
      .sort((a, b) => a.month.localeCompare(b.month));
    return known[known.length - 1]?.balance_cents ?? 0;
  }

  function isCarried(accountId: string) {
    return !balances.some((b) => b.account_id === accountId && b.month === month) && balanceOf(accountId) !== 0;
  }

  function currencyOf(accountId: string): CurrencyCode {
    return toCurrencyCode(accounts.find((a) => a.id === accountId)?.currency);
  }


  async function createAccount() {
    if (!form.name.trim()) {
      toast.error("Informe o nome da conta.");
      return;
    }
    await upsertAccount.mutateAsync({
      name: form.name.trim(),
      type: form.type,
      side: form.side,
      liquid: form.liquid,
      currency: form.currency,
      sort_order: accounts.length,
    });
    toast.success("Conta criada.");
    setOpen(false);
    setForm({ ...form, name: "" });
  }

  async function saveBalance(accountId: string, raw: string) {
    const cents = parseCurrencyToCents(raw) ?? 0;
    const hasRow = balances.some((b) => b.account_id === accountId && b.month === month);
    if (hasRow && cents === exactBalanceOf(accountId)) return;

    try {
      await upsertBalance.mutateAsync({
        account_id: accountId,
        month,
        balance_cents: cents,
        currency: currencyOf(accountId),
      });
      toast.success("Saldo salvo.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o saldo.");
    }
  }


  return (
    <AppLayout>
      <PageHeader
        title="Patrimônio"
        description="Ativos menos passivos, com base no último saldo conhecido de cada conta."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" /> Nova conta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova conta</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Nome</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        type: v as AccountType,
                        side: v === "DEBT" ? "LIABILITY" : "ASSET",
                        liquid: LIQUID_BY_DEFAULT.includes(v as AccountType),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {ACCOUNT_TYPE_LABEL[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Moeda da conta</Label>
                  <CurrencyField
                    value={form.currency}
                    onChange={(currency) => setForm({ ...form, currency })}
                  />
                  <p className="text-xs text-muted-foreground">
                    O saldo é sempre guardado na moeda original da conta.
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <div>
                    <p className="text-sm">Ativo líquido</p>
                    <p className="text-xs text-muted-foreground">Conta usada como reserva de emergência.</p>
                  </div>
                  <Switch
                    checked={form.liquid}
                    onCheckedChange={(v) => setForm({ ...form, liquid: v })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createAccount} disabled={upsertAccount.isPending}>
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricValue label="Patrimônio líquido" value={formatCents(snapshot.netWorth, displayCurrency)} badge="REAL" tone="accent" />
        <MetricValue label="Ativos" value={formatCents(snapshot.assets, displayCurrency)} badge="REAL" tone="positive" />
        <MetricValue label="Passivos" value={formatCents(snapshot.liabilities, displayCurrency)} badge="REAL" tone="negative" />
      </div>

      <Panel className="space-y-4">
        <SectionHeader
          title="Saldos do mês"
          description="Informe o saldo de cada conta no fim do mês selecionado."
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setMonth(shiftMonth(month, -1))}>
                ←
              </Button>
              <span className="min-w-36 text-center text-sm capitalize">{monthLabel(month)}</span>
              <Button variant="outline" size="sm" onClick={() => setMonth(shiftMonth(month, 1))}>
                →
              </Button>
            </div>
          }
        />
        {accounts.length === 0 ? (
          <EmptyState
            title="Nenhuma conta cadastrada"
            description="Crie contas de conta corrente, investimentos, bens e dívidas para montar seu patrimônio."
          />
        ) : (
          <ul className="divide-y divide-border">
            {accounts.map((account) => (
              <li key={account.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{account.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ACCOUNT_TYPE_LABEL[account.type]} · {account.side === "ASSET" ? "Ativo" : "Passivo"}
                    {account.liquid ? " · líquido" : ""} · {toCurrencyCode(account.currency)}
                  </p>
                  {toCurrencyCode(account.currency) !== displayCurrency ? (
                    <p className="text-xs text-muted-foreground">
                      {formatApprox(
                        convert(money(balanceOf(account.id), toCurrencyCode(account.currency)), `${month}`),
                        displayCurrency,
                      )}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted-foreground">{toCurrencyCode(account.currency)}</span>
                  <BalanceInput
                    key={`${account.id}-${month}`}
                    initial={centsToInput(balanceOf(account.id))}
                    pending={upsertBalance.isPending}
                    onSave={(value) => saveBalance(account.id, value)}
                  />
                  <Button variant="ghost" size="sm" onClick={() => removeAccount.mutate(account.id)}>
                    Excluir
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

function BalanceInput({
  initial,
  pending,
  onSave,
}: {
  initial: string;
  pending: boolean;
  onSave: (value: string) => void | Promise<void>;
}) {
  const [value, setValue] = useState(initial);
  const dirty = value !== initial;

  return (
    <div className="flex items-center gap-2">
      <Input
        className="h-9 w-36 text-right tabular-nums"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => dirty && void onSave(value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void onSave(value);
        }}
      />
      <Button size="sm" variant={dirty ? "default" : "outline"} disabled={!dirty || pending} onClick={() => void onSave(value)}>
        Salvar
      </Button>
    </div>
  );
}
