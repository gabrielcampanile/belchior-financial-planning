import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CurrencyCode } from "@/domain/currency";
import type {
  Account,
  AccountBalance,
  Category,
  CategorizationRule,
  Closure,
  IncomeEntry,
  Transaction,
} from "@/domain/types";

export interface Profile {
  id: string;
  display_name: string;
  currency: string;
  display_currency: CurrencyCode;
  theme: string;
  first_day_of_month: number;
  onboarded: boolean;
}

export interface Settings {
  user_id: string;
  expected_monthly_return: number;
  emergency_months: number;
  surplus_invest_percent: number;
}

function unwrap<T>(result: { data: unknown; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return (result.data ?? []) as T;
}

/** Cliente sem tipagem estrita para escritas genéricas por nome de tabela. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;


export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
      if (error) throw new Error(error.message);
      return data as Profile | null;
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async (): Promise<Settings | null> => {
      const { data, error } = await supabase.from("settings").select("*").maybeSingle();
      if (error) throw new Error(error.message);
      return data as Settings | null;
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> =>
      unwrap(await supabase.from("categories").select("*").order("sort_order")),
  });
}

export function useRules() {
  return useQuery({
    queryKey: ["rules"],
    queryFn: async (): Promise<CategorizationRule[]> =>
      unwrap(await supabase.from("categorization_rules").select("*").order("priority")),
  });
}

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async (): Promise<Account[]> =>
      unwrap(await supabase.from("accounts").select("*").order("sort_order")),
  });
}

export function useBalances() {
  return useQuery({
    queryKey: ["balances"],
    queryFn: async (): Promise<AccountBalance[]> =>
      unwrap(await supabase.from("account_balances").select("*").order("month")),
  });
}

export function useTransactions(range?: { from: string; to: string }) {
  return useQuery({
    queryKey: ["transactions", range?.from ?? null, range?.to ?? null],
    queryFn: async (): Promise<Transaction[]> => {
      let query = supabase.from("transactions").select("*").order("occurred_on", { ascending: false });
      if (range) query = query.gte("occurred_on", range.from).lt("occurred_on", range.to);
      return unwrap(await query.limit(2000));
    },
  });
}

export function useIncomeEntries(month?: string) {
  return useQuery({
    queryKey: ["income", month ?? "all"],
    queryFn: async (): Promise<IncomeEntry[]> => {
      let query = supabase.from("income_entries").select("*").order("month", { ascending: false });
      if (month) query = query.eq("month", month);
      return unwrap(await query.limit(2000));
    },
  });
}

export function useClosures() {
  return useQuery({
    queryKey: ["closures"],
    queryFn: async (): Promise<Closure[]> =>
      unwrap(await supabase.from("closures").select("*").order("month", { ascending: false })),
  });
}

/** Invalida todos os dados financeiros após uma escrita. */
export function useInvalidateFinance() {
  const qc = useQueryClient();
  return () => {
    for (const key of [
      "profile",
      "settings",
      "categories",
      "rules",
      "accounts",
      "balances",
      "transactions",
      "income",
      "closures",
    ]) {
      void qc.invalidateQueries({ queryKey: [key] });
    }
  };
}

type TableName =
  | "profiles"
  | "settings"
  | "categories"
  | "categorization_rules"
  | "accounts"
  | "account_balances"
  | "transactions"
  | "income_entries"
  | "closures";

const UPSERT_CHUNK = 400;

/** Remove duplicatas dentro do mesmo lote (Postgres recusa 2 linhas com a mesma chave de conflito). */
function dedupeByConflict(
  rows: Record<string, unknown>[],
  onConflict?: string,
): Record<string, unknown>[] {
  if (!onConflict) return rows;
  const keys = onConflict.split(",").map((k) => k.trim());
  const seen = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    seen.set(keys.map((k) => String(row[k] ?? "")).join("|"), row);
  }
  return [...seen.values()];
}

export function useUpsert(table: TableName, onConflict?: string) {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: async (rows: Record<string, unknown> | Record<string, unknown>[]) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Sessão expirada.");
      const list = (Array.isArray(rows) ? rows : [rows]).map((row) =>
        table === "profiles" ? { ...row, id: userId } : { ...row, user_id: userId },
      );
      const unique = dedupeByConflict(list, onConflict);
      for (let i = 0; i < unique.length; i += UPSERT_CHUNK) {
        const { error } = await db
          .from(table)
          .upsert(unique.slice(i, i + UPSERT_CHUNK), onConflict ? { onConflict } : undefined);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: invalidate,
  });
}


export function useUpdateRow(table: TableName) {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { error } = await db.from(table).update(values).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

export function useDeleteRow(table: TableName) {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from(table).delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}
