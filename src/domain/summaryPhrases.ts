import { formatCents, formatPercent } from "@/lib/format";
import { monthLabel } from "@/lib/months";
import type { MonthMetrics } from "./financialMetrics";
import { DEFAULT_CURRENCY, type CurrencyCode } from "./currency";

/**
 * Frases contextuais determinísticas para o dashboard.
 * Regras explícitas em código — nenhuma IA envolvida.
 */

export interface ContextPhraseInput {
  netWorthNow: number;
  netWorthPrevious: number | null;
  metrics: MonthMetrics;
  hasData: boolean;
  reserveMonths: number;
  emergencyMonthsTarget: number;
  /** Moeda de visualização — os valores já chegam convertidos. */
  currency?: CurrencyCode;
}

export function dashboardPhrase(input: ContextPhraseInput): string {
  const currency = input.currency ?? DEFAULT_CURRENCY;
  if (!input.hasData) {
    return "Ainda não há dados suficientes. Comece registrando seu patrimônio ou importando transações.";
  }

  if (input.netWorthPrevious != null && input.netWorthPrevious !== input.netWorthNow) {
    const delta = input.netWorthNow - input.netWorthPrevious;
    if (delta > 0) return `Seu patrimônio cresceu ${formatCents(delta, currency)} neste mês.`;
    return `Seu patrimônio recuou ${formatCents(Math.abs(delta, currency))} neste mês.`;
  }

  if (input.metrics.income.total > 0 && input.metrics.balance < 0) {
    return `Neste mês suas despesas superaram as receitas em ${formatCents(Math.abs(input.metrics.balance, currency))}.`;
  }

  if (input.metrics.income.total > 0) {
    return `Sua taxa de poupança neste mês é de ${formatPercent(input.metrics.savingsRate)}.`;
  }

  if (input.reserveMonths > 0) {
    return `Sua reserva cobre ${input.reserveMonths.toFixed(1)} meses do seu custo essencial (meta: ${input.emergencyMonthsTarget}).`;
  }

  return "Registre suas receitas e despesas do mês para acompanhar sua evolução.";
}

export interface RealHighlight {
  label: string;
  value: string;
  tone: "neutral" | "positive" | "negative";
}

/** Destaques determinísticos do fechamento de um mês. */
export function closureHighlights(
  month: string,
  metrics: MonthMetrics,
  currency: CurrencyCode = DEFAULT_CURRENCY,
): RealHighlight[] {
  const highlights: RealHighlight[] = [
    {
      label: `Resumo de ${monthLabel(month)}`,
      value: `Você recebeu ${formatCents(metrics.income.total, currency)} e gastou ${formatCents(metrics.expenses.total, currency)}.`,
      tone: metrics.balance >= 0 ? "positive" : "negative",
    },
  ];

  const top = metrics.expenses.byCategory.slice(0, 3);
  if (top.length) {
    highlights.push({
      label: "Maiores categorias",
      value: top.map((c) => `${c.name} (${formatCents(c.total, currency)})`).join(" · "),
      tone: "neutral",
    });
  }

  if (metrics.income.extraordinary > 0) {
    highlights.push({
      label: "Receita extraordinária",
      value: `${formatCents(metrics.income.extraordinary, currency)} não fazem parte da sua renda recorrente.`,
      tone: "neutral",
    });
  }

  if (metrics.income.temporary > 0) {
    highlights.push({
      label: "Dependência de renda temporária",
      value: `${formatPercent(metrics.temporaryDependency)} da sua receita do mês vem de fontes temporárias.`,
      tone: "neutral",
    });
  }

  return highlights;
}
