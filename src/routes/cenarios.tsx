import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, Plus, Star, Trash2 } from "lucide-react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CurrencyField } from "@/components/finance/CurrencySelect";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/domain/currency";
import { currentMonthKey, monthLabel } from "@/lib/months";
import { formatPercent } from "@/lib/format";
import {
  useDuplicateScenario,
  usePlanningDelete,
  usePlanningInsert,
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

function CenariosPage() {
  const { data: scenarios = [], isLoading } = useScenarios();
  const createScenario = usePlanningInsert("scenarios");
  const removeScenario = usePlanningDelete("scenarios");
  const duplicate = useDuplicateScenario();
  const setDefault = useSetDefaultScenario();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    baseCurrency: DEFAULT_CURRENCY as CurrencyCode,
    horizon: "60",
    monthlyReturn: "0.8",
  });

  async function submit() {
    if (!form.name.trim()) {
      toast.error("Dê um nome ao cenário.");
      return;
    }
    try {
      await createScenario.mutateAsync({
        name: form.name.trim(),
        description: form.description.trim() || null,
        base_currency: form.baseCurrency,
        start_month: currentMonthKey(),
        horizon_months: Math.max(1, Math.min(600, Number(form.horizon) || 60)),
        expected_monthly_return: (Number(form.monthlyReturn.replace(",", ".")) || 0) / 100,
        is_default: scenarios.length === 0,
      });
      toast.success("Cenário criado.");
      setOpen(false);
      setForm({ ...form, name: "", description: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o cenário.");
    }
  }

  return (
    <AppLayout>
      <PageHeader
        title="Cenários"
        description="Cada cenário guarda seu próprio conjunto de planos de receita e despesa."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" /> Novo cenário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo cenário</DialogTitle>
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
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label>Moeda base</Label>
                    <CurrencyField
                      value={form.baseCurrency}
                      onChange={(c) => setForm({ ...form, baseCurrency: c })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="scenario-horizon">Horizonte (meses)</Label>
                    <Input
                      id="scenario-horizon"
                      inputMode="numeric"
                      value={form.horizon}
                      onChange={(e) => setForm({ ...form, horizon: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="scenario-return">Retorno % a.m.</Label>
                    <Input
                      id="scenario-return"
                      inputMode="decimal"
                      value={form.monthlyReturn}
                      onChange={(e) => setForm({ ...form, monthlyReturn: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={submit} disabled={createScenario.isPending}>
                  Criar cenário
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
              {s.description ? (
                <p className="text-sm text-muted-foreground">{s.description}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="secondary">
                  <Link to="/planejamento" search={{ scenario: s.id }}>
                    Abrir planejamento
                  </Link>
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
                  onClick={() => {
                    void duplicate
                      .mutateAsync({ id: s.id, name: `${s.name} (cópia)` })
                      .then(() => toast.success("Cenário duplicado."))
                      .catch((e: Error) => toast.error(e.message));
                  }}
                >
                  <Copy className="mr-1.5 h-4 w-4" /> Duplicar
                </Button>
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
    </AppLayout>
  );
}
