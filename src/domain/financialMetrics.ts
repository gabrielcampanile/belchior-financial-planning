import type {
  Account,
  AccountBalance,
  Category,
  ClosureTotals,
  IncomeEntry,
  Transaction,
} from "./types";

/**
 * Métricas financeiras determinísticas sobre DADOS REAIS.
 * Funções puras: mesmo input, mesmo output. Sem IA, sem aleatoriedade.
 */

export interface NetWorthSnapshot {
  month: string;
  assets: number;
  liabilities: number;
  netWorth: number;
  liquid: number;
}

/** Patrimônio líquido = ativos − passivos, usando o último saldo conhecido de cada conta até o mês. */
export function netWorthForMonth(
  month: string,
  accounts: Account[],
  balances: AccountBalance[],
): NetWorthSnapshot {
  let assets = 0;
  let liabilities = 0;
  let liquid = 0;

  for (const account of accounts) {
    if (account.archived) continue;
    const known = balances
      .filter((b) => b.account_id === account.id && b.month <= month)
      .sort((a, b) => a.month.localeCompare(b.month));
    const last = known[known.length - 1];
    if (!last) continue;
    const value = Math.abs(last.balance_cents);
    if (account.side === "ASSET") {
      assets += value;
      if (account.liquid) liquid += value;
    } else {
      liabilities += value;
    }
  }

  return { month, assets, liabilities, netWorth: assets - liabilities, liquid };
}

export function netWorthSeries(
  months: string[],
  accounts: Account[],
  balances: AccountBalance[],
): NetWorthSnapshot[] {
  return months.map((m) => netWorthForMonth(m, accounts, balances));
}

function essentialCategoryIds(categories: Category[]): Set<string> {
  return new Set(categories.filter((c) => c.essential).map((c) => c.id));
}

export interface ExpenseBreakdown {
  total: number;
  essential: number;
  discretionary: number;
  byCategory: { categoryId: string | null; name: string; total: number }[];
}

/**
 * Despesas do mês. Transferências e aportes NUNCA entram como despesa:
 * eles só mudam a alocação do patrimônio.
 */
export function expenseBreakdown(
  transactions: Transaction[],
  categories: Category[],
): ExpenseBreakdown {
  const essentials = essentialCategoryIds(categories);
  const nameById = new Map(categories.map((c) => [c.id, c.name] as const));
  const parentById = new Map(categories.map((c) => [c.id, c.parent_id] as const));
  const totals = new Map<string, number>();
  let total = 0;
  let essential = 0;

  for (const tx of transactions) {
    if (tx.type !== "EXPENSE") continue;
    const value = Math.abs(tx.amount_cents);
    total += value;
    if (tx.category_id && essentials.has(tx.category_id)) essential += value;
    const rootId = tx.category_id ? (parentById.get(tx.category_id) ?? tx.category_id) : "__none__";
    totals.set(rootId, (totals.get(rootId) ?? 0) + value);
  }

  const byCategory = [...totals.entries()]
    .map(([categoryId, value]) => ({
      categoryId: categoryId === "__none__" ? null : categoryId,
      name: categoryId === "__none__" ? "Sem categoria" : (nameById.get(categoryId) ?? "Sem categoria"),
      total: value,
    }))
    .sort((a, b) => b.total - a.total);

  return { total, essential, discretionary: total - essential, byCategory };
}

/** Aportes do mês (investimento não é despesa). */
export function investmentTotal(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === "INVESTMENT_CONTRIBUTION")
    .reduce((sum, t) => sum + Math.abs(t.amount_cents), 0);
}

export interface IncomeBreakdown {
  recurring: number;
  temporary: number;
  extraordinary: number;
  total: number;
}

export function incomeBreakdown(entries: IncomeEntry[]): IncomeBreakdown {
  const recurring = sumBy(entries, "RECURRING");
  const temporary = sumBy(entries, "TEMPORARY");
  const extraordinary = sumBy(entries, "EXTRAORDINARY");
  return { recurring, temporary, extraordinary, total: recurring + temporary + extraordinary };
}

function sumBy(entries: IncomeEntry[], nature: IncomeEntry["nature"]): number {
  return entries.filter((e) => e.nature === nature).reduce((s, e) => s + e.amount_cents, 0);
}

/** (receita total − despesa total) / receita total */
export function savingsRate(totalIncome: number, totalExpenses: number): number {
  if (totalIncome <= 0) return 0;
  return (totalIncome - totalExpenses) / totalIncome;
}

/** novos investimentos / receita total — não confundir com taxa de poupança */
export function investmentRate(newInvestments: number, totalIncome: number): number {
  if (totalIncome <= 0) return 0;
  return newInvestments / totalIncome;
}

/** temporária / total */
export function temporaryIncomeDependency(income: IncomeBreakdown): number {
  if (income.total <= 0) return 0;
  return income.temporary / income.total;
}

/** Quantos meses de custo essencial a reserva líquida cobre. */
export function reserveMonths(liquidCents: number, essentialMonthlyCost: number): number {
  if (essentialMonthlyCost <= 0) return 0;
  return liquidCents / essentialMonthlyCost;
}

export function emergencyFundTarget(essentialMonthlyCost: number, months: number): number {
  return Math.max(0, Math.round(essentialMonthlyCost * months));
}

export function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export interface MonthMetrics {
  month: string;
  income: IncomeBreakdown;
  expenses: ExpenseBreakdown;
  investments: number;
  balance: number;
  savingsRate: number;
  investmentRate: number;
  temporaryDependency: number;
}

export function monthMetrics(
  month: string,
  transactions: Transaction[],
  incomes: IncomeEntry[],
  categories: Category[],
): MonthMetrics {
  const income = incomeBreakdown(incomes);
  const expenses = expenseBreakdown(transactions, categories);
  const investments = investmentTotal(transactions);
  return {
    month,
    income,
    expenses,
    investments,
    balance: income.total - expenses.total,
    savingsRate: savingsRate(income.total, expenses.total),
    investmentRate: investmentRate(investments, income.total),
    temporaryDependency: temporaryIncomeDependency(income),
  };
}

export function buildClosureTotals(metrics: MonthMetrics, netWorth: number): ClosureTotals {
  return {
    recurringIncome: metrics.income.recurring,
    temporaryIncome: metrics.income.temporary,
    extraordinaryIncome: metrics.income.extraordinary,
    totalIncome: metrics.income.total,
    essentialExpenses: metrics.expenses.essential,
    discretionaryExpenses: metrics.expenses.discretionary,
    totalExpenses: metrics.expenses.total,
    investments: metrics.investments,
    balance: metrics.balance,
    netWorth,
  };
}
