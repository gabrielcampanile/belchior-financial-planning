import { addMonths, format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Mês é sempre representado como o primeiro dia do mês, "YYYY-MM-01". */
export type MonthKey = string;

export function toMonthKey(date: Date | string): MonthKey {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(startOfMonth(d), "yyyy-MM-01");
}

export function currentMonthKey(): MonthKey {
  return toMonthKey(new Date());
}

export function monthLabel(month: MonthKey): string {
  return format(parseISO(month), "MMMM 'de' yyyy", { locale: ptBR });
}

export function monthLabelShort(month: MonthKey): string {
  return format(parseISO(month), "MMM/yy", { locale: ptBR }).toUpperCase();
}

export function shiftMonth(month: MonthKey, delta: number): MonthKey {
  return toMonthKey(addMonths(parseISO(month), delta));
}

export function monthRange(from: MonthKey, count: number): MonthKey[] {
  return Array.from({ length: count }, (_, i) => shiftMonth(from, i));
}

/** Últimos `count` meses terminando em `end` (inclusive). */
export function lastMonths(end: MonthKey, count: number): MonthKey[] {
  return monthRange(shiftMonth(end, -(count - 1)), count);
}

export function monthStartISO(month: MonthKey): string {
  return month;
}

export function monthEndISO(month: MonthKey): string {
  return format(addMonths(parseISO(month), 1), "yyyy-MM-dd");
}

export function formatDateBR(iso: string): string {
  return format(parseISO(iso), "dd/MM/yyyy");
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}
