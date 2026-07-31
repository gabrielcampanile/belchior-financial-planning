import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { AssumptionNote, EmptyState, PageHeader, Panel, SectionHeader } from "@/components/finance/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  useCategories,
  useDeleteRow,
  useInvalidateFinance,
  useProfile,
  useRules,
  useSettings,
  useTransactions,
  useUpdateRow,
  useUpsert,
} from "@/hooks/useFinanceData";
import { applyRules } from "@/domain/categorizationEngine";
import { buildDemoData, DEMO_ACCOUNTS } from "@/lib/demoData";
import type { MatchType } from "@/domain/types";
import { useCurrency, useExchangeRates } from "@/hooks/useCurrency";
import { CurrencySelect } from "@/components/finance/CurrencySelect";
import { refreshExchangeRates } from "@/lib/exchangeRates.functions";
import { useServerFn } from "@tanstack/react-start";
import { formatNumber } from "@/lib/format";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações · Belchior" },
      {
        name: "description",
        content: "Perfil, premissas financeiras, regras de categorização e dados de demonstração.",
      },
      { property: "og:title", content: "Configurações · Belchior" },
      { property: "og:description", content: "Ajuste premissas, regras de categorização e dados demo." },
    ],
  }),
  component: SettingsPage,
});

const MATCH_LABEL: Record<MatchType, string> = {
  CONTAINS: "Contém",
  STARTS_WITH: "Começa com",
  EQUALS: "Igual a",
  REGEX: "Regex",
};

function SettingsPage() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateFinance();
  const { data: profile } = useProfile();
  const { data: settings } = useSettings();
  const { data: categories = [] } = useCategories();
  const { data: rules = [] } = useRules();
  const { data: transactions = [] } = useTransactions();
  const { rates, displayCurrency } = useCurrency();
  const { refetch: refetchRates, isFetching: ratesLoading } = useExchangeRates();
  const runRefreshRates = useServerFn(refreshExchangeRates);

  async function updateRates() {
    setBusy(true);
    try {
      const result = await runRefreshRates({});
      await refetchRates();
      toast.success(
        result.updated
          ? `Cotações de ${result.effectiveOn} atualizadas (${result.pairs} pares).`
          : "As cotações de hoje já estavam atualizadas.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar cotações.");
    } finally {
      setBusy(false);
    }
  }

  const upsertProfile = useUpsert("profiles", "id");
  const upsertSettings = useUpsert("settings", "user_id");
  const upsertRule = useUpsert("categorization_rules");
  const updateRule = useUpdateRow("categorization_rules");
  const removeRule = useDeleteRow("categorization_rules");
  const updateTransaction = useUpdateRow("transactions");

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rule, setRule] = useState({
    pattern: "",
    match_type: "CONTAINS" as MatchType,
    category_id: "none",
    priority: 100,
  });

  const hasDemo = transactions.some((t) => t.is_demo);

  async function saveProfile() {
    await upsertProfile.mutateAsync({ display_name: displayName ?? profile?.display_name ?? "" });
    toast.success("Perfil salvo.");
  }

  async function saveSettings(values: Record<string, unknown>) {
    await upsertSettings.mutateAsync(values);
    toast.success("Premissas atualizadas.");
  }

  async function addRule() {
    if (!rule.pattern.trim()) {
      toast.error("Informe o padrão de texto.");
      return;
    }
    await upsertRule.mutateAsync({
      pattern: rule.pattern.trim(),
      match_type: rule.match_type,
      priority: rule.priority,
      category_id: rule.category_id === "none" ? null : rule.category_id,
      target_type: "EXPENSE",
      enabled: true,
    });
    setRule({ ...rule, pattern: "" });
    toast.success("Regra criada.");
  }

  async function reapplyRules() {
    setBusy(true);
    try {
      let changed = 0;
      for (const tx of transactions) {
        if (tx.category_id) continue;
        const match = applyRules(tx.description, rules);
        if (match?.categoryId) {
          await updateTransaction.mutateAsync({ id: tx.id, values: { category_id: match.categoryId } });
          changed += 1;
        }
      }
      toast.success(`${changed} transações recategorizadas.`);
    } finally {
      setBusy(false);
    }
  }

  async function loadDemo() {
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Sessão expirada.");
      const demo = buildDemoData();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const { data: accountRows, error: accountError } = await db
        .from("accounts")
        .insert(demo.accounts.map((a) => ({ ...a, user_id: userId })))
        .select("id,name");
      if (accountError) throw new Error(accountError.message);

      const idByKey: Record<string, string> = {};
      for (const seed of DEMO_ACCOUNTS) {
        const found = (accountRows as { id: string; name: string }[]).find((r) => r.name === seed.name);
        if (found) idByKey[seed.key] = found.id;
      }

      const categoryIdByName: Record<string, string> = {};
      for (const category of categories) categoryIdByName[category.name] = category.id;

      const balances = demo.balancesFor(idByKey).map((r) => ({ ...r, user_id: userId }));
      const txs = demo.transactionsFor(categoryIdByName).map((r) => ({ ...r, user_id: userId }));

      for (const [table, rows, conflict] of [
        ["account_balances", balances, "user_id,account_id,month"],
        ["transactions", txs, "user_id,dedupe_hash"],
      ] as const) {
        if (!rows.length) continue;
        const { error } = await db.from(table).upsert(rows, conflict ? { onConflict: conflict } : undefined);
        if (error) throw new Error(error.message);
      }

      invalidate();
      void queryClient.invalidateQueries();
      toast.success("Cenário de demonstração carregado (Ago/2026 – Ago/2027).");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao carregar demonstração.");
    } finally {
      setBusy(false);
    }
  }

  async function clearDemo() {
    setBusy(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      for (const table of ["transactions", "account_balances", "accounts", "closures"]) {
        const { error } = await db.from(table).delete().eq("is_demo", true);
        if (error) throw new Error(error.message);
      }
      invalidate();
      toast.success("Dados de demonstração removidos.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao remover demonstração.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppLayout>
      <PageHeader title="Configurações" description="Perfil, premissas do motor financeiro e automações." />

      <Panel className="space-y-4">
        <SectionHeader title="Perfil" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Nome de exibição</Label>
            <Input
              value={displayName ?? profile?.display_name ?? ""}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={saveProfile} disabled={upsertProfile.isPending}>
              Salvar perfil
            </Button>
          </div>
        </div>
      </Panel>

      <Panel className="space-y-4">
        <SectionHeader
          title="Moeda e câmbio"
          description="A moeda de visualização só muda a exibição — os lançamentos permanecem na moeda original."
          action={
            <Button variant="outline" onClick={updateRates} disabled={busy || ratesLoading}>
              Atualizar cotações
            </Button>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Moeda de visualização</Label>
            <CurrencySelect className="h-10 w-full text-sm" />
          </div>
          <div className="grid gap-2">
            <Label>Cotações conhecidas</Label>
            <p className="text-sm text-muted-foreground">
              {rates.length === 0
                ? "Nenhuma cotação carregada ainda."
                : `${rates.length} cotações · última em ${rates[rates.length - 1]?.effectiveOn}`}
            </p>
          </div>
        </div>
        <ul className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
          {[...rates]
            .filter((r) => r.effectiveOn === rates[rates.length - 1]?.effectiveOn)
            .map((r) => (
              <li key={`${r.base}-${r.quote}-${r.effectiveOn}`}>
                1 {r.base} = {formatNumber(r.rate, 4)} {r.quote}
              </li>
            ))}
        </ul>
        <AssumptionNote>
          Conversões usam a cotação vigente na data do lançamento. Valores convertidos aparecem com “≈”.
          Moeda atual: {displayCurrency}.
        </AssumptionNote>
      </Panel>

      <Panel className="space-y-4">
        <SectionHeader
          title="Premissas financeiras"
          description="Usadas nos cálculos determinísticos. Nenhuma projeção usa IA."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label>Meses de reserva desejados</Label>
            <Input
              type="number"
              min={1}
              defaultValue={settings?.emergency_months ?? 6}
              onBlur={(e) => saveSettings({ emergency_months: Number(e.target.value) || 6 })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Rentabilidade mensal esperada (%)</Label>
            <Input
              type="number"
              step="0.01"
              defaultValue={((settings?.expected_monthly_return ?? 0.008) * 100).toFixed(2)}
              onBlur={(e) =>
                saveSettings({ expected_monthly_return: (Number(e.target.value) || 0.8) / 100 })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>% do excedente investido</Label>
            <Input
              type="number"
              min={0}
              max={100}
              defaultValue={settings?.surplus_invest_percent ?? 80}
              onBlur={(e) => saveSettings({ surplus_invest_percent: Number(e.target.value) || 0 })}
            />
          </div>
        </div>
      </Panel>

      <Panel className="space-y-4">
        <SectionHeader
          title="Regras de categorização"
          description="Aplicadas por prioridade, sem diferenciar maiúsculas ou acentos."
          action={
            <Button variant="outline" size="sm" onClick={reapplyRules} disabled={busy}>
              Reaplicar regras
            </Button>
          }
        />
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_auto]">
          <Input
            placeholder="Padrão (ex.: IFOOD)"
            value={rule.pattern}
            onChange={(e) => setRule({ ...rule, pattern: e.target.value })}
          />
          <Select
            value={rule.match_type}
            onValueChange={(v) => setRule({ ...rule, match_type: v as MatchType })}
          >
            <SelectTrigger className="sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(MATCH_LABEL) as MatchType[]).map((m) => (
                <SelectItem key={m} value={m}>
                  {MATCH_LABEL[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={rule.category_id} onValueChange={(v) => setRule({ ...rule, category_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
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
          <Input
            type="number"
            className="sm:w-24"
            value={rule.priority}
            onChange={(e) => setRule({ ...rule, priority: Number(e.target.value) || 100 })}
          />
          <Button onClick={addRule} disabled={upsertRule.isPending}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {rules.length === 0 ? (
          <EmptyState title="Nenhuma regra" description="Crie regras para categorizar importações automaticamente." />
        ) : (
          <ul className="divide-y divide-border">
            {rules.map((r) => (
              <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm">{r.pattern}</p>
                  <p className="text-xs text-muted-foreground">
                    {MATCH_LABEL[r.match_type]} · prioridade {r.priority} ·{" "}
                    {categories.find((c) => c.id === r.category_id)?.name ?? "Sem categoria"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Switch
                    checked={r.enabled}
                    onCheckedChange={(v) => updateRule.mutate({ id: r.id, values: { enabled: v } })}
                  />
                  <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => removeRule.mutate(r.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel className="space-y-4">
        <SectionHeader
          title="Dados de demonstração"
          description="Cenário da família Gabriel, Luana e Sofia entre Ago/2026 e Ago/2027."
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={loadDemo} disabled={busy || hasDemo}>
            Carregar cenário de demonstração
          </Button>
          <Button variant="outline" onClick={clearDemo} disabled={busy || !hasDemo}>
            Remover dados de demonstração
          </Button>
        </div>
        <AssumptionNote>
          Os dados demo são linhas normais no banco marcadas com <code>is_demo</code>: nenhuma lógica do
          produto é alterada e a remoção é completa.
        </AssumptionNote>
      </Panel>
    </AppLayout>
  );
}
