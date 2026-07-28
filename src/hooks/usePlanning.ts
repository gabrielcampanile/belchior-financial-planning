import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ExpensePlan, IncomePlan, Scenario } from "@/domain/planning";

/** Cliente sem tipagem estrita para escritas genéricas. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const KEYS = ["scenarios", "income_plans", "expense_plans"] as const;

export function useInvalidatePlanning() {
  const qc = useQueryClient();
  return () => {
    for (const key of KEYS) void qc.invalidateQueries({ queryKey: [key] });
  };
}

export function useScenarios() {
  return useQuery({
    queryKey: ["scenarios"],
    queryFn: async (): Promise<Scenario[]> => {
      const { data, error } = await supabase
        .from("scenarios")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as Scenario[];
    },
  });
}

export function useIncomePlans(scenarioId?: string) {
  return useQuery({
    queryKey: ["income_plans", scenarioId ?? null],
    enabled: Boolean(scenarioId),
    queryFn: async (): Promise<IncomePlan[]> => {
      const { data, error } = await supabase
        .from("income_plans")
        .select("*")
        .eq("scenario_id", scenarioId!)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as IncomePlan[];
    },
  });
}

export function useExpensePlans(scenarioId?: string) {
  return useQuery({
    queryKey: ["expense_plans", scenarioId ?? null],
    enabled: Boolean(scenarioId),
    queryFn: async (): Promise<ExpensePlan[]> => {
      const { data, error } = await supabase
        .from("expense_plans")
        .select("*")
        .eq("scenario_id", scenarioId!)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as ExpensePlan[];
    },
  });
}

type PlanningTable = "scenarios" | "income_plans" | "expense_plans";

export function usePlanningInsert(table: PlanningTable) {
  const invalidate = useInvalidatePlanning();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Sessão expirada.");
      const { data, error } = await db
        .from(table)
        .insert({ ...values, user_id: userId })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return data as { id: string };
    },
    onSuccess: invalidate,
  });
}

export function usePlanningUpdate(table: PlanningTable) {
  const invalidate = useInvalidatePlanning();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { error } = await db.from(table).update(values).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

export function usePlanningDelete(table: PlanningTable) {
  const invalidate = useInvalidatePlanning();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from(table).delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

/** Define um cenário como padrão, desmarcando os demais. */
export function useSetDefaultScenario() {
  const invalidate = useInvalidatePlanning();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Sessão expirada.");
      const off = await db.from("scenarios").update({ is_default: false }).eq("user_id", userId);
      if (off.error) throw new Error(off.error.message);
      const on = await db.from("scenarios").update({ is_default: true }).eq("id", id);
      if (on.error) throw new Error(on.error.message);
    },
    onSuccess: invalidate,
  });
}

/** Duplica um cenário e todos os seus planos via função no banco. */
export function useDuplicateScenario() {
  const invalidate = useInvalidatePlanning();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await db.rpc("duplicate_scenario", {
        _scenario_id: id,
        _new_name: name,
      });
      if (error) throw new Error(error.message);
      return data as string;
    },
    onSuccess: invalidate,
  });
}
