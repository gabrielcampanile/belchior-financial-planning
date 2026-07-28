/** Formatação pt-BR / BRL. Valores monetários são sempre inteiros em centavos. */

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const brlCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCents(cents: number): string {
  return brl.format((cents ?? 0) / 100);
}

export function formatCentsShort(cents: number): string {
  return brlCompact.format((cents ?? 0) / 100);
}

export function formatSignedCents(cents: number): string {
  const s = formatCents(Math.abs(cents));
  if (cents > 0) return `+${s}`;
  if (cents < 0) return `−${s}`;
  return s;
}

export function formatPercent(ratio: number, digits = 1): string {
  if (!Number.isFinite(ratio)) return "—";
  return `${(ratio * 100).toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function formatNumber(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("pt-BR", {
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
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
