/** Formatação pt-BR multimoeda. Valores monetários são sempre inteiros em centavos. */

import { DEFAULT_CURRENCY, type CurrencyCode, type Money } from "@/domain/currency";

const LOCALE = "pt-BR";

const cache = new Map<string, Intl.NumberFormat>();

function formatter(currency: CurrencyCode, compact: boolean): Intl.NumberFormat {
  const key = `${currency}:${compact}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency,
      minimumFractionDigits: compact ? 0 : 2,
      maximumFractionDigits: compact ? 0 : 2,
    });
    cache.set(key, f);
  }
  return f;
}

export function formatCents(cents: number, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  return formatter(currency, false).format((cents ?? 0) / 100);
}

export function formatCentsShort(cents: number, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  return formatter(currency, true).format((cents ?? 0) / 100);
}

/** Formatação canônica de um valor de domínio. */
export function formatMoney(value: Money): string {
  return formatCents(value.amountCents, value.currency);
}

export function formatMoneyShort(value: Money): string {
  return formatCentsShort(value.amountCents, value.currency);
}

/** Valor convertido, sempre marcado com "≈" para deixar claro que não é o original. */
export function formatApprox(cents: number, currency: CurrencyCode): string {
  return `≈ ${formatCents(cents, currency)}`;
}

export function formatSignedCents(cents: number, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  const s = formatCents(Math.abs(cents), currency);
  if (cents > 0) return `+${s}`;
  if (cents < 0) return `−${s}`;
  return s;
}

export function formatPercent(ratio: number, digits = 1): string {
  if (!Number.isFinite(ratio)) return "—";
  return `${(ratio * 100).toLocaleString(LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function formatNumber(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString(LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Converte texto digitado pelo usuário ("1.234,56", "1234.56", "R$ 100") em centavos. */
export function parseCurrencyToCents(input: string): number | null {
  if (input == null) return null;
  let raw = String(input).trim();
  if (!raw) return null;
  raw = raw.replace(/[R$\s\u00a0]/gi, "");
  const negative = /^-/.test(raw) || /^\(.*\)$/.test(raw);
  raw = raw.replace(/[()-]/g, "");
  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");
  if (hasComma && hasDot) {
    // o último separador é o decimal
    raw = raw.lastIndexOf(",") > raw.lastIndexOf(".") ? raw.replace(/\./g, "").replace(",", ".") : raw.replace(/,/g, "");
  } else if (hasComma) {
    raw = raw.replace(/\./g, "").replace(",", ".");
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  const cents = Math.round(value * 100);
  return negative ? -cents : cents;
}

export function centsToInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toLocaleString(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
