import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useInvalidateFinance, useUpsert } from "@/hooks/useFinanceData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/layout/AppLayout";
import { parseCurrencyToCents } from "@/lib/format";
import { currentMonthKey } from "@/lib/months";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Primeiros passos · Belchior" },
      {
        name: "description",
        content: "Seis perguntas rápidas para configurar patrimônio, renda, reserva e sua primeira meta.",
      },
      { property: "og:title", content: "Primeiros passos · Belchior" },
      { property: "og:description", content: "Configure sua base financeira em menos de dois minutos." },
    ],
  }),
  component: OnboardingPage,
});

const STEPS = [
  { key: "name", label: "Como podemos te chamar?", placeholder: "Seu nome", type: "text" },
  { key: "netWorth", label: "Qual seu patrimônio atual aproximado?", placeholder: "150.000,00", type: "money" },
  { key: "income", label: "Qual sua renda mensal recorrente?", placeholder: "12.000,00", type: "money" },
  { key: "expenses", label: "Quanto gasta por mês, em média?", placeholder: "7.500,00", type: "money" },
  { key: "reserve", label: "Quantos meses de reserva você quer ter?", placeholder: "6", type: "number" },
  { key: "goal", label: "Qual sua principal meta financeira?", placeholder: "Comprar um imóvel", type: "text" },
] as const;

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateFinance();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const upsertProfile = useUpsert("profiles", "id");
  const upsertSettings = useUpsert("settings", "user_id");
  const upsertBalance = useUpsert("account_balances", "user_id,account_id,month");
  const upsertIncome = useUpsert("income_entries");


  const current = STEPS[step];

  async function finish(skip = false) {
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sessão expirada.");

      await upsertProfile.mutateAsync({
        display_name: values.name?.trim() || auth.user.email?.split("@")[0] || "",
        onboarded: true,
      });

      if (!skip) {
        const reserve = Number(values.reserve) || 6;
        await upsertSettings.mutateAsync({ emergency_months: reserve });

        const netWorth = parseCurrencyToCents(values.netWorth ?? "");
        if (netWorth && netWorth > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const db = supabase as any;
          const { data: account, error } = await db
            .from("accounts")
            .insert({
              user_id: auth.user.id,
              name: "Patrimônio inicial",
              type: "INVESTMENT",
              side: "ASSET",
              liquid: true,
              sort_order: 0,
            })
            .select("id")
            .single();
          if (error) throw new Error(error.message);
          await upsertBalance.mutateAsync({
            account_id: (account as { id: string }).id,
            month: currentMonthKey(),
            balance_cents: netWorth,
          });
        }


        const income = parseCurrencyToCents(values.income ?? "");
        if (income && income > 0) {
          await upsertIncome.mutateAsync({
            month: currentMonthKey(),
            name: "Renda recorrente",
            type: "SALARY",
            nature: "RECURRING",
            amount_cents: income,
          });
        }
      }

      invalidate();
      // garante que o perfil já esteja atualizado antes de sair do onboarding
      await queryClient.refetchQueries({ queryKey: ["profile"] });
      toast.success("Tudo pronto.");
      navigate({ to: "/", replace: true });

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <BrandMark />
        </div>

        <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <span
                key={s.key}
                className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-border"}`}
              />
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Passo {step + 1} de {STEPS.length}
            </p>
            <Label className="text-base font-medium">{current.label}</Label>
            <Input
              autoFocus
              inputMode={current.type === "text" ? "text" : "decimal"}
              placeholder={current.placeholder}
              value={values[current.key] ?? ""}
              onChange={(e) => setValues({ ...values, [current.key]: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              onClick={() => (step === 0 ? finish(true) : setStep(step - 1))}
              disabled={busy}
            >
              {step === 0 ? "Pular" : "Voltar"}
            </Button>
            <Button
              onClick={() => (step === STEPS.length - 1 ? finish() : setStep(step + 1))}
              disabled={busy}
            >
              {step === STEPS.length - 1 ? "Concluir" : "Continuar"}
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Você pode reeditar tudo depois em Configurações.
        </p>
      </div>
    </div>
  );
}
