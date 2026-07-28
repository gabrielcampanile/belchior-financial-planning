import { describe, expect, it } from "vitest";
import { money } from "@/domain/currency";
import { convertMoney, createConverter, findRate, sumMoney, type ExchangeRate } from "@/domain/exchange";
import { formatCents } from "@/lib/format";

const rates: ExchangeRate[] = [
  { base: "CAD", quote: "BRL", rate: 3.5, effectiveOn: "2026-01-10", source: "test" },
  { base: "CAD", quote: "BRL", rate: 4, effectiveOn: "2026-03-01", source: "test" },
  { base: "BRL", quote: "USD", rate: 0.2, effectiveOn: "2026-03-01", source: "test" },
  { base: "BRL", quote: "EUR", rate: 0.17, effectiveOn: "2026-03-01", source: "test" },
];

describe("câmbio determinístico", () => {
  it("1. mesma moeda não converte", () => {
    expect(convertMoney(money(10_000, "BRL"), "BRL", rates)).toEqual(money(10_000, "BRL"));
  });

  it("2. 100 CAD com taxa 4 vira 400 BRL", () => {
    expect(convertMoney(money(10_000, "CAD"), "BRL", rates, "2026-03-15")).toEqual(money(40_000, "BRL"));
  });

  it("3. usa a cotação vigente na data histórica, não a atual", () => {
    expect(convertMoney(money(10_000, "CAD"), "BRL", rates, "2026-02-01")).toEqual(money(35_000, "BRL"));
  });

  it("4. converte pelo par invertido quando só existe o inverso", () => {
    expect(findRate(rates, "BRL", "CAD", "2026-03-15")).toBeCloseTo(0.25, 10);
  });

  it("5. tri  angula via BRL quando não há par direto", () => {
    // CAD→BRL (4) × BRL→USD (0,2) = 0,8
    expect(findRate(rates, "CAD", "USD", "2026-03-15")).toBeCloseTo(0.8, 10);
  });

  it("6. sem cotação disponível retorna null (nunca inventa taxa)", () => {
    expect(convertMoney(money(1_000, "ARS"), "BRL", rates, "2026-03-15")).toBeNull();
  });

  it("7. soma multimoeda converte antes de agregar", () => {
    const total = sumMoney(
      [money(10_000, "BRL"), money(10_000, "CAD")],
      "BRL",
      rates,
      "2026-03-15",
    );
    expect(total).toEqual(money(50_000, "BRL"));
  });

  it("8. conversão é reproduzível para a mesma entrada", () => {
    const convert = createConverter("BRL", rates);
    const a = convert(money(12_345, "CAD"), "2026-03-15");
    const b = convert(money(12_345, "CAD"), "2026-03-15");
    expect(a).toBe(b);
    expect(a).toBe(49_380);
  });

  it("9. formatação respeita a moeda alvo", () => {
    expect(formatCents(40_000, "BRL").replace(/\u00a0/g, " ")).toBe("R$ 400,00");
    expect(formatCents(10_000, "CAD")).toContain("100,00");
    expect(formatCents(10_000, "USD")).toContain("100,00");
  });

  it("data anterior a qualquer cotação usa a mais antiga conhecida", () => {
    expect(convertMoney(money(10_000, "CAD"), "BRL", rates, "2025-01-01")).toEqual(money(35_000, "BRL"));
  });
});
