/**
 * Domínio de planejamento (Fase 2).
 * Funções puras: dado um plano e um mês, dizem se ele ocorre e por quanto.
 * Nenhuma dependência de React ou de persistência.
 */

import { differenceInCalendarMonths, parseISO } from "date-fns";
import type { CurrencyCode } from "./currency";
import type { IncomeNature, IncomeType } from "./types";
import { toMonthKey, type MonthKey } from "@/lib/months";

export type PlanFrequency =
  | "MONTHLY"
  | "BIMONTHLY"
  | "QUARTERLY"
  | "SEMIANNUAL"
  | "YEARLY"
  | "ONCE";

export const FREQUENCY_LABEL: Record<PlanFrequency, string> = {
  MONTHLY: "Mensal",
  BIMONTHLY: "Bimestral",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  YEARLY: "Anual",
  ONCE: "Única",
};

/** Passo em meses de cada frequência. ONCE é tratado à parte. */
export const FREQUENCY_STEP: Record<PlanFrequency, number> = {
  MONTHLY: 1,
  BIMONTHLY: 2,
  QUARTERLY: 3,
  SEMIANNUAL: 6,
  YEARLY: 12,
  ONCE: 0,
};

export interface Scenario {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  base_currency: CurrencyCode;
  start_month: string;
  horizon_months: number;
  expected_monthly_return: number;
  is_demo: boolean;
}

interface PlanBase {
  id: string;
  scenario_id: string;
  name: string;
  amount_cents: number;
  currency: CurrencyCode;
  frequency: PlanFrequency;
  /** Meses do ano (1–12) em que o plano ocorre. Vazio = usa a frequência. */
  months_of_year: number[];
  start_date: string;
  end_date: string | null;
  annual_adjustment_percent: number;
  enabled: boolean;
  notes: string | null;
}

export interface IncomePlan extends PlanBase {
  type: IncomeType;
  nature: IncomeNature;
}

export interface ExpensePlan extends PlanBase {
  category_id: string | null;
  essential: boolean;
}

export type AnyPlan = IncomePlan | ExpensePlan;

/** Quantos meses inteiros separam o início do plano do mês avaliado. Negativo = ainda não começou. */
export function monthsSinceStart(plan: Pick<PlanBase, "start_date">, month: MonthKey): number {
  return differenceInCalendarMonths(parseISO(month), parseISO(toMonthKey(plan.start_date)));
}

/** O plano gera lançamento neste mês? */
export function occursInMonth(plan: PlanBase, month: MonthKey): boolean {
  if (!plan.enabled) return false;
  const offset = monthsSinceStart(plan, month);
  if (offset < 0) return false;
  if (plan.end_date && month > toMonthKey(plan.end_date)) return false;

  if (plan.frequency === "ONCE") return offset === 0;

  const monthsOfYear = plan.months_of_year ?? [];
  if (monthsOfYear.length > 0) {
    return monthsOfYear.includes(parseISO(month).getUTCMonth() + 1);
  }

  const step = FREQUENCY_STEP[plan.frequency] || 1;
  return offset % step === 0;
}

/**
 * Valor do plano no mês, com reajuste anual aplicado apenas nos aniversários da data de início.
 * Nunca mês a mês: 5% ao ano só sobe no 12º, 24º, 36º mês…
 */
export function amountForMonth(plan: PlanBase, month: MonthKey): number {
  const offset = monthsSinceStart(plan, month);
  if (offset <= 0) return plan.amount_cents;
  const years = Math.floor(offset / 12);
  if (years === 0 || !plan.annual_adjustment_percent) return plan.amount_cents;
  const factor = Math.pow(1 + plan.annual_adjustment_percent / 100, years);
  return Math.round(plan.amount_cents * factor);
}

/** Receita recorrente cobre RECURRING e TEMPORARY; EXTRAORDINARY é tratada à parte. */
export function isRecurringIncome(plan: IncomePlan): boolean {
  return plan.nature !== "EXTRAORDINARY";
}
