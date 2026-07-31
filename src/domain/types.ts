/** Tipos do domínio financeiro. Independentes de React e de persistência. */

import type { CurrencyCode } from "./currency";

export type TransactionType = "EXPENSE" | "INCOME" | "TRANSFER" | "INVESTMENT_CONTRIBUTION";
export type MatchType = "CONTAINS" | "STARTS_WITH" | "EQUALS" | "REGEX";
export type IncomeNature = "RECURRING" | "TEMPORARY" | "EXTRAORDINARY";
export type IncomeType =
  | "SALARY"
  | "VR"
  | "BENEFIT"
  | "SCHOLARSHIP"
  | "BONUS"
  | "PLR"
  | "FREELANCE"
  | "INVESTMENT_INCOME"
  | "OTHER";
export type AccountSide = "ASSET" | "LIABILITY";
export type AccountType =
  | "CHECKING"
  | "SAVINGS"
  | "INVESTMENT"
  | "FIXED_INCOME"
  | "STOCKS"
  | "FUNDS"
  | "PENSION"
  | "PROPERTY"
  | "OTHER_ASSET"
  | "DEBT";

export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  kind: "EXPENSE" | "INCOME" | "INVESTMENT" | "TRANSFER";
  essential: boolean;
  sort_order: number;
  is_demo: boolean;
}

export interface CategorizationRule {
  id: string;
  pattern: string;
  match_type: MatchType;
  priority: number;
  category_id: string | null;
  target_type: TransactionType;
  enabled: boolean;
  is_demo: boolean;
}

export interface Transaction {
  currency: CurrencyCode;
  id: string;
  occurred_on: string;
  description: string;
  amount_cents: number;
  type: TransactionType;
  category_id: string | null;
  account_id: string | null;
  closure_id: string | null;
  source: "MANUAL" | "IMPORT" | "DEMO";
  dedupe_hash: string;
  notes: string | null;
  is_demo: boolean;
  /** Só relevante quando type === "INCOME". */
  income_type: IncomeType;
  /** Só relevante quando type === "INCOME". */
  income_nature: IncomeNature;
}

export interface Account {
  currency: CurrencyCode;
  id: string;
  name: string;
  type: AccountType;
  side: AccountSide;
  liquid: boolean;
  archived: boolean;
  sort_order: number;
  is_demo: boolean;
}

export interface AccountBalance {
  currency: CurrencyCode;
  id: string;
  account_id: string;
  month: string;
  balance_cents: number;
  is_demo: boolean;
}

export interface Closure {
  id: string;
  month: string;
  status: "OPEN" | "CLOSED";
  totals: ClosureTotals | Record<string, never>;
  notes: string | null;
  closed_at: string | null;
  is_demo: boolean;
}

export interface ClosureTotals {
  recurringIncome: number;
  temporaryIncome: number;
  extraordinaryIncome: number;
  totalIncome: number;
  essentialExpenses: number;
  discretionaryExpenses: number;
  totalExpenses: number;
  investments: number;
  balance: number;
  netWorth: number;
}

export const TRANSACTION_TYPE_LABEL: Record<TransactionType, string> = {
  EXPENSE: "Despesa",
  INCOME: "Receita",
  TRANSFER: "Transferência",
  INVESTMENT_CONTRIBUTION: "Aporte",
};

export const INCOME_TYPE_LABEL: Record<IncomeType, string> = {
  SALARY: "Salário",
  VR: "VR/VA",
  BENEFIT: "Benefício",
  SCHOLARSHIP: "Bolsa",
  BONUS: "Bônus",
  PLR: "PLR",
  FREELANCE: "Freelance",
  INVESTMENT_INCOME: "Rendimentos",
  OTHER: "Outras",
};

export const INCOME_NATURE_LABEL: Record<IncomeNature, string> = {
  RECURRING: "Recorrente",
  TEMPORARY: "Temporária",
  EXTRAORDINARY: "Extraordinária",
};

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  CHECKING: "Conta corrente",
  SAVINGS: "Poupança",
  INVESTMENT: "Investimentos",
  FIXED_INCOME: "Renda fixa",
  STOCKS: "Ações",
  FUNDS: "Fundos",
  PENSION: "Previdência",
  PROPERTY: "Bens",
  OTHER_ASSET: "Outros ativos",
  DEBT: "Dívidas",
};

export const LIQUID_BY_DEFAULT: AccountType[] = ["CHECKING", "SAVINGS", "INVESTMENT", "FIXED_INCOME"];
