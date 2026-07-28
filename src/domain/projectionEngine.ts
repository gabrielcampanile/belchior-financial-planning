/**
 * Motor de projeção (Fase 2).
 * Determinístico: mesmas entradas → mesma saída. Sem LLM, sem aleatoriedade, sem Date.now().
 *
 * Regra de evolução do patrimônio, mês a mês:
 *   netWorthEnd = netWorthStart + cashFlow + investmentReturn
 * onde cashFlow = receitas planejadas − despesas planejadas
 * e investmentReturn = netWorthStart × expectedMonthlyReturn (apenas sobre saldo positivo).
 */

import { money, type CurrencyCode } from "./currency";
import { identityConverter, type MoneyConverter } from "./exchange";
import { amountForMonth, isRecurringIncome, occursInMonth, type ExpensePlan, type IncomePlan } from "./planning";
import { monthRange, type MonthKey } from "@/lib/months";

export interface ProjectionInput {
  startMonth: MonthKey;
  horizonMonths: number;
  startingNetWorthCents: number;
  incomePlans: IncomePlan[];
  expensePlans: ExpensePlan[];
  /** Retorno mensal esperado sobre o patrimônio (0.008 = 0,8% a.m.). */
  expectedMonthlyReturn: number;
  /** Percentual do superávit destinado a investimento (0–100). Informativo. */
  surplusInvestPercent?: number;
  convert?: MoneyConverter;
  displayCurrency?: CurrencyCode;
}

export interface ProjectionMonth {
  month: MonthKey;
  recurringIncome: number;
  extraordinaryIncome: number;
  totalIncome: number;
  essentialExpenses: number;
  discretionaryExpenses: number;
  totalExpenses: number;
  cashFlow: number;
  plannedInvestment: number;
  investmentReturn: number;
  netWorthStart: number;
  netWorthEnd: number;
  savingsRate: number;
}

/** Total planejado de um conjunto de planos em um mês, já convertido para a moeda de exibição. */
function planTotal(
  plans: Array<IncomePlan | ExpensePlan>,
  month: MonthKey,
  convert: MoneyConverter,
): number {
  let total = 0;
  for (const plan of plans) {
    if (!occursInMonth(plan, month)) continue;
    total += convert(money(amountForMonth(plan, month), plan.currency), month);
  }
  return Math.round(total);
}

export function runProjection(input: ProjectionInput): ProjectionMonth[] {
  const convert = input.convert ?? identityConverter;
  const surplusPercent = input.surplusInvestPercent ?? 0;
  const months = monthRange(input.startMonth, Math.max(1, input.horizonMonths));

  const out: ProjectionMonth[] = [];
  let netWorth = input.startingNetWorthCents;

  for (const month of months) {
    const activeIncome = input.incomePlans.filter((p) => occursInMonth(p, month));
    const recurringIncome = planTotal(activeIncome.filter(isRecurringIncome), month, convert);
    const extraordinaryIncome = planTotal(
      activeIncome.filter((p) => !isRecurringIncome(p)),
      month,
      convert,
    );
    const totalIncome = recurringIncome + extraordinaryIncome;

    const activeExpenses = input.expensePlans.filter((p) => occursInMonth(p, month));
    const essentialExpenses = planTotal(
      activeExpenses.filter((p) => p.essential),
      month,
      convert,
    );
    const discretionaryExpenses = planTotal(
      activeExpenses.filter((p) => !p.essential),
      month,
      convert,
    );
    const totalExpenses = essentialExpenses + discretionaryExpenses;

    const cashFlow = totalIncome - totalExpenses;
    const plannedInvestment = cashFlow > 0 ? Math.round((cashFlow * surplusPercent) / 100) : 0;
    const investmentReturn = netWorth > 0 ? Math.round(netWorth * input.expectedMonthlyReturn) : 0;

    const netWorthStart = netWorth;
    const netWorthEnd = netWorthStart + cashFlow + investmentReturn;
    netWorth = netWorthEnd;

    out.push({
      month,
      recurringIncome,
      extraordinaryIncome,
      totalIncome,
      essentialExpenses,
      discretionaryExpenses,
      totalExpenses,
      cashFlow,
      plannedInvestment,
      investmentReturn,
      netWorthStart,
      netWorthEnd,
      savingsRate: totalIncome > 0 ? cashFlow / totalIncome : 0,
    });
  }

  return out;
}

export interface ProjectionSummary {
  finalNetWorth: number;
  totalCashFlow: number;
  averageMonthlyCashFlow: number;
  averageSavingsRate: number;
  negativeMonths: number;
  firstNegativeMonth: MonthKey | null;
}

export function summarizeProjection(months: ProjectionMonth[]): ProjectionSummary {
  if (months.length === 0) {
    return {
      finalNetWorth: 0,
      totalCashFlow: 0,
      averageMonthlyCashFlow: 0,
      averageSavingsRate: 0,
      negativeMonths: 0,
      firstNegativeMonth: null,
    };
  }
  const totalCashFlow = months.reduce((s, m) => s + m.cashFlow, 0);
  const negatives = months.filter((m) => m.cashFlow < 0);
  return {
    finalNetWorth: months[months.length - 1].netWorthEnd,
    totalCashFlow,
    averageMonthlyCashFlow: Math.round(totalCashFlow / months.length),
    averageSavingsRate:
      months.reduce((s, m) => s + m.savingsRate, 0) / months.length,
    negativeMonths: negatives.length,
    firstNegativeMonth: negatives[0]?.month ?? null,
  };
}

/** Comparação planejado × real de um mês, para a tela de orçamento. */
export interface BudgetLine {
  key: string;
  label: string;
  planned: number;
  actual: number;
  diff: number;
}

export function budgetLine(key: string, label: string, planned: number, actual: number): BudgetLine {
  return { key, label, planned, actual, diff: actual - planned };
}
