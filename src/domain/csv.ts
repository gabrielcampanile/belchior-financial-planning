import { z } from "zod";
import { CURRENCY_CODES, DEFAULT_CURRENCY, toCurrencyCode, type CurrencyCode } from "./currency";

/** Parser de CSV tolerante: detecta delimitador, respeita aspas, ignora linhas vazias. */

export type Delimiter = "," | ";" | "\t" | "|";

export function detectDelimiter(sample: string): Delimiter {
  const firstLines = sample.split(/\r?\n/).slice(0, 5).join("\n");
  const candidates: Delimiter[] = [";", ",", "\t", "|"];
  let best: Delimiter = ",";
  let bestCount = -1;
  for (const d of candidates) {
    const count = firstLines.split(d).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = d;
    }
  }
  return best;
}

export function parseCsv(text: string, delimiter: Delimiter): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const clean = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (inQuotes) {
      if (char === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else if (char !== "\r") {
      field += char;
    }
  }
  row.push(field);
  rows.push(row);

  return rows
    .map((r) => r.map((c) => c.trim()))
    .filter((r) => r.some((c) => c.length > 0));
}

export type DateFormat = "DD/MM/YYYY" | "YYYY-MM-DD" | "MM/DD/YYYY";

export function parseDate(raw: string, format: DateFormat): string | null {
  const value = raw.trim();
  const digits = value.match(/(\d{1,4})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (!digits) return null;
  let year: string, month: string, day: string;
  if (format === "YYYY-MM-DD") {
    [, year, month, day] = digits;
  } else if (format === "MM/DD/YYYY") {
    [, month, day, year] = digits;
  } else {
    [, day, month, year] = digits;
  }
  if (year.length === 2) year = `20${year}`;
  const iso = `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
}

export function parseAmountToCents(raw: string): number | null {
  let value = raw.trim();
  if (!value) return null;
  const negative = value.startsWith("-") || /^\(.*\)$/.test(value);
  value = value.replace(/[^\d.,-]/g, "").replace(/[()]/g, "");
  const hasComma = value.includes(",");
  const hasDot = value.includes(".");
  if (hasComma && hasDot) {
    value = value.lastIndexOf(",") > value.lastIndexOf(".")
      ? value.replace(/\./g, "").replace(",", ".")
      : value.replace(/,/g, "");
  } else if (hasComma) {
    value = value.replace(",", ".");
  }
  const parsed = Number(value.replace(/-/g, ""));
  if (!Number.isFinite(parsed)) return null;
  const cents = Math.round(parsed * 100);
  return negative ? -cents : cents;
}

export const importMappingSchema = z.object({
  dateColumn: z.number().int().min(0),
  descriptionColumn: z.number().int().min(0),
  amountColumn: z.number().int().min(0),
  dateFormat: z.enum(["DD/MM/YYYY", "YYYY-MM-DD", "MM/DD/YYYY"]),
  hasHeader: z.boolean(),
  /** true quando valores negativos representam despesa (padrão de extrato) */
  negativeIsExpense: z.boolean(),
  /** Moeda aplicada a todas as linhas quando não há coluna de moeda. */
  currency: z.enum(CURRENCY_CODES),
  /** Coluna opcional com o código da moeda de cada linha. */
  currencyColumn: z.number().int().min(0).nullable(),
});

export type ImportMapping = z.infer<typeof importMappingSchema>;

export interface ParsedRow {
  occurred_on: string;
  description: string;
  amount_cents: number;
  /** Moeda ORIGINAL da linha — nunca convertida na importação. */
  currency: CurrencyCode;
  raw: string[];
}

export function mapRows(rows: string[][], mapping: ImportMapping): {
  parsed: ParsedRow[];
  invalid: { line: number; reason: string }[];
} {
  const body = mapping.hasHeader ? rows.slice(1) : rows;
  const parsed: ParsedRow[] = [];
  const invalid: { line: number; reason: string }[] = [];

  body.forEach((row, index) => {
    const date = parseDate(row[mapping.dateColumn] ?? "", mapping.dateFormat);
    const description = (row[mapping.descriptionColumn] ?? "").trim();
    const amount = parseAmountToCents(row[mapping.amountColumn] ?? "");
    if (!date) {
      invalid.push({ line: index + 1, reason: "Data inválida" });
      return;
    }
    if (!description) {
      invalid.push({ line: index + 1, reason: "Descrição vazia" });
      return;
    }
    if (amount == null || amount === 0) {
      invalid.push({ line: index + 1, reason: "Valor inválido" });
      return;
    }
    const currency =
      mapping.currencyColumn != null
        ? toCurrencyCode(row[mapping.currencyColumn], mapping.currency)
        : mapping.currency;
    parsed.push({ occurred_on: date, description, amount_cents: amount, currency, raw: row });
  });

  return { parsed, invalid };
}

/** Hash determinístico para deduplicação (data + valor + descrição normalizada). */
export function dedupeHash(
  occurredOn: string,
  amountCents: number,
  description: string,
  currency: CurrencyCode = DEFAULT_CURRENCY,
): string {
  const base = `${occurredOn}|${amountCents}|${currency}|${description
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < base.length; i++) {
    const c = base.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 + c, 2654435761) >>> 0;
  }
  return `${h1.toString(36)}${h2.toString(36)}`;
}
