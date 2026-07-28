/**
 * Definição central de moedas do domínio financeiro.
 * Nenhum componente deve escrever strings de moeda ("BRL", "CAD"…) diretamente.
 */

export const CURRENCY_CODES = ["BRL", "CAD", "USD", "EUR", "ARS"] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = "BRL";

export interface CurrencyMeta {
  code: CurrencyCode;
  name: string;
  /** Sufixo/prefixo apenas informativo — a formatação real usa Intl.NumberFormat. */
  shortLabel: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  BRL: { code: "BRL", name: "Real brasileiro", shortLabel: "R$" },
  CAD: { code: "CAD", name: "Dólar canadense", shortLabel: "CA$" },
  USD: { code: "USD", name: "Dólar americano", shortLabel: "US$" },
  EUR: { code: "EUR", name: "Euro", shortLabel: "€" },
  ARS: { code: "ARS", name: "Peso argentino", shortLabel: "AR$" },
};

export const CURRENCY_LIST: CurrencyMeta[] = CURRENCY_CODES.map((code) => CURRENCIES[code]);

/** Valor monetário sempre em centavos inteiros + a moeda original. */
export interface Money {
  amountCents: number;
  currency: CurrencyCode;
}

export function money(amountCents: number, currency: CurrencyCode = DEFAULT_CURRENCY): Money {
  return { amountCents: Math.round(amountCents), currency };
}

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && (CURRENCY_CODES as readonly string[]).includes(value);
}

/** Converte um valor vindo do banco/CSV em uma moeda válida, caindo no default quando desconhecido. */
export function toCurrencyCode(
  value: unknown,
  fallback: CurrencyCode = DEFAULT_CURRENCY,
): CurrencyCode {
  if (typeof value !== "string") return fallback;
  const upper = value.trim().toUpperCase();
  return isCurrencyCode(upper) ? upper : fallback;
}

export function isSameCurrency(a: Money, b: Money): boolean {
  return a.currency === b.currency;
}
