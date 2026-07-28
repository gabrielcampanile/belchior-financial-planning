import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataBadge, EmptyState, PageHeader, Panel } from "@/components/finance/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CurrencyField } from "@/components/finance/CurrencySelect";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/domain/currency";
import type { Scenario } from "@/domain/planning";
import { currentMonthKey, monthLabel, toMonthKey } from "@/lib/months";
import { formatPercent } from "@/lib/format";
import {
  useDuplicateScenario,
  usePlanningDelete,
  usePlanningInsert,
  usePlanningUpdate,
  useScenarios,
  useSetDefaultScenario,
} from "@/hooks/usePlanning";

export const Route = createFileRoute("/cenarios")({
  head: () => ({
    meta: [
      { title: "Cenários · Belchior" },
      {
        name: "description",
        content: "Crie, duplique e compare cenários financeiros para decidir com números, não com intuição.",
      },
      { property: "og:title", content: "Cenários · Belchior" },
      { property: "og:description", content: "Simulações what-if determinísticas do seu futuro financeiro." },
    ],
  }),
  component: CenariosPage,
});

type ScenarioForm = {
  name: string;
  description: string;
  baseCurrency: CurrencyCode;
  startMonth: string;
  horizon: string;
  monthlyReturn: string;
};

function emptyForm(): ScenarioForm {
  return {
    name: "",
    description: "",
    baseCurrency: DEFAULT_CURRENCY as CurrencyCode,
    startMonth: currentMonthKey(),
    horizon: "60",
    monthlyReturn: "0.8",
  };
}

function formFromScenario(s: Scenario, overrides?: Partial<ScenarioForm>): ScenarioForm {
  return {
    name: s.name,
    description: s.description ?? "",
    baseCurrency: s.base_currency,
    startMonth: toMonthKey(s.start_month),
    horizon: String(s.horizon_months),
    monthlyReturn: String(Number((s.expected_monthly_return * 100).toFixed(4))),
    ...overrides,
  };
}

function formToValues(form: ScenarioForm) {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    base_currency: form.baseCurrency,
    start_month: toMonthKey(form.startMonth),
    horizon_months: Math.max(1, Math.min(600, Number(form.horizon) || 60)),
    expected_monthly_return: (Number(form.monthlyReturn.replace(",", ".")) || 0) / 100,
  };
}

function CenariosPage() {
  const { data: scenarios = [], isLoading } = useScenarios();
  const createScenario = usePlanningInsert("scenarios");
  const updateScenario = usePlanningUpdate("scenarios");
  const removeScenario = usePlanningDelete("scenarios");
  const duplicate = useDuplicateScenario();
  const setDefault = useSetDefaultScenario();

  const [dialog, setDialog] = useState<
    | { mode: "create" }
    | { mode: "edit"; scenario: Scenario }
    | { mode: "duplicate"; scenario: Scenario }
    | null
  >(null);

  async function handleSubmit(form: ScenarioForm) {
    if (!form.name.trim()) {
      toast.error("Dê um nome ao cenário.");
      return;
    }
    const values = formToValues(form);
    try {
      if (dialog?.mode === "edit") {
        await updateScenario.mutateAsync({ id: dialog.scenario.id, values });
        toast.success("Premissas atualizadas.");
      } else if (dialog?.mode === "duplicate") {
        const newId = await duplicate.mutateAsync({ id: dialog.scenario.id, name: values.name });
        await updateScenario.mutateAsync({ id: newId, values });
        toast.success("Cenário duplicado com as novas premissas.");
      } else {
        await createScenario.mutateAsync({ ...values, is_default: scenarios.length === 0 });
        toast.success("Cenário criado.");
      }
      setDialog(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o cenário.");
    }
  }

  const busy = createScenario.isPending || updateScenario.isPending || duplicate.isPending;

  return (
    <AppLayout>
      <PageHeader
        title="Cenários"
        description="Cada cenário guarda seu próprio conjunto de planos de receita e despesa."
        action={
          <Button size="sm" onClick={() => setDialog({ mode: "create" })}>
            <Plus className="mr-1.5 h-4 w-4" /> Novo cenário
          </Button>
        }
      />

      {scenarios.length === 0 && !isLoading ? (
        <EmptyState
          title="Nenhum cenário ainda"
          description="Crie o cenário Base com suas receitas e despesas planejadas. Depois duplique para simular alternativas."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {scenarios.map((s) => (
            <Panel key={s.id} className="grid gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-foreground">{s.name}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Início {monthLabel(s.start_month)} · {s.horizon_months} meses ·{" "}
                    {formatPercent(s.expected_monthly_return, 2)} a.m. · {s.base_currency}
                  </p>
                </div>
                {s.is_default ? <DataBadge kind="PLANEJADO" /> : null}
              </div>
              {s.description ? <p className="text-sm text-muted-foreground">{s.description}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="secondary">
                  <Link to="/planejamento" search={{ scenario: s.id }}>
                    Abrir planejamento
                  </Link>
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDialog({ mode: "edit", scenario: s })}>
                  <Pencil className="mr-1.5 h-4 w-4" /> Editar premissas
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDialog({ mode: "duplicate", scenario: s })}>
                  <Copy className="mr-1.5 h-4 w-4" /> Duplicar
                </Button>
                {!s.is_default ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      void setDefault.mutateAsync(s.id).then(() => toast.success("Cenário padrão atualizado."));
                    }}
                  >
                    <Star className="mr-1.5 h-4 w-4" /> Tornar padrão
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-negative"
                  onClick={() => {
                    void removeScenario
                      .mutateAsync(s.id)
                      .then(() => toast.success("Cenário removido."))
                      .catch((e: Error) => toast.error(e.message));
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {dialog ? (
        <ScenarioDialog
          key={dialog.mode + ("scenario" in dialog ? dialog.scenario.id : "new")}
          mode={dialog.mode}
          initial={
            dialog.mode === "create"
              ? emptyForm()
              : formFromScenario(
                  dialog.scenario,
                  dialog.mode === "duplicate" ? { name: `${dialog.scenario.name} (cópia)` } : undefined,
                )
          }
          busy={busy}
          onClose={() => setDialog(null)}
          onSubmit={handleSubmit}
        />
      ) : null}
    </AppLayout>
  );
}

function ScenarioDialog({
  mode,
  initial,
  busy,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit" | "duplicate";
  initial: ScenarioForm;
  busy: boolean;
  onClose: () => void;
  onSubmit: (form: ScenarioForm) => void | Promise<void>;
}) {
  const [form, setForm] = useState<ScenarioForm>(initial);

  const title =
    mode === "create" ? "Novo cenário" : mode === "edit" ? "Editar premissas" : "Duplicar cenário";
  const description =
    mode === "duplicate"
      ? "Ajuste as premissas antes de copiar: o novo cenário nasce com todos os planos do original."
      : "Horizonte e retorno esperado recalculam a projeção imediatamente.";

  return (
    <Dialog open onOpenChange={(o) => (o ? null : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="scenario-name">Nome</Label>
            <Input
              id="scenario-name"
              value={form.name}
              placeholder="Base, Otimista, Mudança para o Canadá…"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="scenario-desc">Descrição</Label>
            <Textarea
              id="scenario-desc"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Moeda base</Label>
              <CurrencyField value={form.baseCurrency} onChange={(c) => setForm({ ...form, baseCurrency: c })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="scenario-start">Mês inicial</Label>
              <Input
                id="scenario-start"
                type="date"
                value={form.startMonth}
                onChange={(e) => setForm({ ...form, startMonth: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="scenario-horizon">Horizonte (meses)</Label>
              <Input
                id="scenario-horizon"
                inputMode="numeric"
                value={form.horizon}
                onChange={(e) => setForm({ ...form, horizon: e.target.value })}
              />
              <div className="flex flex-wrap gap-1.5">
                {[12, 24, 60, 120].map((m) => (
                  <Button
                    key={m}
                    type="button"
                    size="sm"
                    variant={Number(form.horizon) === m ? "secondary" : "ghost"}
                    className="h-7 px-2 text-xs"
                    onClick={() => setForm({ ...form, horizon: String(m) })}
                  >
                    {m / 12} {m === 12 ? "ano" : "anos"}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="scenario-return">Retorno % a.m.</Label>
              <Input
                id="scenario-return"
                inputMode="decimal"
                value={form.monthlyReturn}
                onChange={(e) => setForm({ ...form, monthlyReturn: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                ≈ {formatPercent(Math.pow(1 + (Number(form.monthlyReturn.replace(",", ".")) || 0) / 100, 12) - 1, 2)} ao
                ano
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => void onSubmit(form)} disabled={busy}>
            {mode === "edit" ? "Salvar premissas" : mode === "duplicate" ? "Duplicar cenário" : "Criar cenário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
