import { describe, expect, it } from "vitest";
import { classifyRow } from "@/domain/csv";
import { incomeBreakdown } from "@/domain/financialMetrics";
import type { Category, Transaction } from "@/domain/types";

function tx(partial: Partial<Transaction>): Transaction {
  return {
    id: crypto.randomUUID(),
    user_id: "u",
    occurred_on: "2026-08-05",
    description: "linha",
    amount_cents: 1000,
    currency: "BRL",
    type: "EXPENSE",
    category_id: null,
    account_id: null,
    closure_id: null,
    source: "IMPORT",
    dedupe_hash: "h",
    notes: null,
    income_type: null,
    income_nature: null,
    is_demo: false,
    created_at: "",
    updated_at: "",
    ...partial,
  } as Transaction;
}

describe("classifyRow", () => {
  it("extrato: negativo é despesa, positivo é receita", () => {
    expect(classifyRow(-5000, "STATEMENT", true)).toBe("EXPENSE");
    expect(classifyRow(5000, "STATEMENT", true)).toBe("INCOME");
  });

  it("extrato com convenção invertida", () => {
    expect(classifyRow(5000, "STATEMENT", false)).toBe("EXPENSE");
    expect(classifyRow(-5000, "STATEMENT", false)).toBe("INCOME");
  });

  it("fatura de cartão: tudo é despesa, negativo é estorno", () => {
    expect(classifyRow(5000, "CARD_INVOICE", true)).toBe("EXPENSE");
    expect(classifyRow(-5000, "CARD_INVOICE", true)).toBe("INCOME");
    expect(classifyRow(5000, "CARD_INVOICE", false)).toBe("EXPENSE");
  });
});

describe("incomeBreakdown a partir de transações", () => {
  const categories: Category[] = [
    { id: "c1", name: "Salário", kind: "INCOME", parent_id: null } as Category,
  ];

  it("soma apenas transações de receita e separa por natureza", () => {
    const result = incomeBreakdown(
      [
        tx({ type: "INCOME", amount_cents: 100_000, income_nature: "RECURRING", category_id: "c1" }),
        tx({ type: "INCOME", amount_cents: 50_000, income_nature: "TEMPORARY" }),
        tx({ type: "EXPENSE", amount_cents: 30_000 }),
        tx({ type: "INVESTMENT_CONTRIBUTION", amount_cents: 20_000 }),
      ],
      categories,
    );
    expect(result.total).toBe(150_000);
    expect(result.recurring).toBe(100_000);
    expect(result.temporary).toBe(50_000);
    expect(result.byCategory[0]).toMatchObject({ name: "Salário", total: 100_000 });
  });

  it("agrupa receitas sem categoria", () => {
    const result = incomeBreakdown([tx({ type: "INCOME", amount_cents: 10_000 })], categories);
    expect(result.byCategory).toEqual([{ categoryId: null, name: "Sem categoria", total: 10_000 }]);
  });
});
