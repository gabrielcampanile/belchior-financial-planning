import { describe, expect, it } from "vitest";
import { amountForMonth, occursInMonth, type ExpensePlan, type IncomePlan } from "../planning";
import { runProjection, summarizeProjection } from "../projectionEngine";

function income(partial: Partial<IncomePlan> = {}): IncomePlan {
  return {
    id: "i1",
    scenario_id: "s1",
    name: "Salário",
    amount_cents: 1_000_000,
    currency: "BRL",
    frequency: "MONTHLY",
    months_of_year: [],
    start_date: "2026-01-01",
    end_date: null,
    annual_adjustment_percent: 0,
    enabled: true,
    notes: null,
    type: "SALARY",
    nature: "RECURRING",
    ...partial,
  };
}

function expense(partial: Partial<ExpensePlan> = {}): ExpensePlan {
  return {
    id: "e1",
    scenario_id: "s1",
    name: "Aluguel",
    amount_cents: 300_000,
    currency: "BRL",
    frequency: "MONTHLY",
    months_of_year: [],
    start_date: "2026-01-01",
    end_date: null,
    annual_adjustment_percent: 0,
    enabled: true,
    notes: null,
    category_id: null,
    essential: true,
    ...partial,
  };
}

describe("occursInMonth", () => {
  it("não ocorre antes do início", () => {
    expect(occursInMonth(income(), "2025-12-01")).toBe(false);
  });

  it("mensal ocorre em todo mês a partir do início", () => {
    expect(occursInMonth(income(), "2026-01-01")).toBe(true);
    expect(occursInMonth(income(), "2026-07-01")).toBe(true);
  });

  it("trimestral ocorre a cada 3 meses", () => {
    const plan = income({ frequency: "QUARTERLY" });
    expect(occursInMonth(plan, "2026-01-01")).toBe(true);
    expect(occursInMonth(plan, "2026-02-01")).toBe(false);
    expect(occursInMonth(plan, "2026-04-01")).toBe(true);
  });

  it("única ocorre só no mês inicial", () => {
    const plan = income({ frequency: "ONCE" });
    expect(occursInMonth(plan, "2026-01-01")).toBe(true);
    expect(occursInMonth(plan, "2026-02-01")).toBe(false);
  });

  it("meses do ano têm prioridade sobre a frequência", () => {
    const plan = income({ frequency: "MONTHLY", months_of_year: [11, 12] });
    expect(occursInMonth(plan, "2026-03-01")).toBe(false);
    expect(occursInMonth(plan, "2026-12-01")).toBe(true);
  });

  it("respeita a data de término e o desligamento", () => {
    expect(occursInMonth(income({ end_date: "2026-03-31" }), "2026-04-01")).toBe(false);
    expect(occursInMonth(income({ enabled: false }), "2026-02-01")).toBe(false);
  });
});

describe("amountForMonth", () => {
  it("aplica reajuste apenas no aniversário anual", () => {
    const plan = income({ annual_adjustment_percent: 10 });
    expect(amountForMonth(plan, "2026-06-01")).toBe(1_000_000);
    expect(amountForMonth(plan, "2027-01-01")).toBe(1_100_000);
    expect(amountForMonth(plan, "2028-01-01")).toBe(1_210_000);
  });
});

describe("runProjection", () => {
  it("evolui o patrimônio como início + fluxo + retorno", () => {
    const months = runProjection({
      startMonth: "2026-01-01",
      horizonMonths: 3,
      startingNetWorthCents: 1_000_000,
      incomePlans: [income()],
      expensePlans: [expense()],
      expectedMonthlyReturn: 0.01,
      surplusInvestPercent: 80,
    });

    expect(months).toHaveLength(3);
    expect(months[0].cashFlow).toBe(700_000);
    expect(months[0].investmentReturn).toBe(10_000);
    expect(months[0].netWorthEnd).toBe(1_710_000);
    expect(months[1].netWorthStart).toBe(1_710_000);
    expect(months[0].plannedInvestment).toBe(560_000);
  });

  it("é determinístico: mesma entrada, mesma saída", () => {
    const input = {
      startMonth: "2026-01-01",
      horizonMonths: 12,
      startingNetWorthCents: 500_000,
      incomePlans: [income()],
      expensePlans: [expense({ essential: false })],
      expectedMonthlyReturn: 0.008,
    };
    expect(runProjection(input)).toEqual(runProjection(input));
  });

  it("separa despesas essenciais de discricionárias", () => {
    const [first] = runProjection({
      startMonth: "2026-01-01",
      horizonMonths: 1,
      startingNetWorthCents: 0,
      incomePlans: [],
      expensePlans: [expense(), expense({ id: "e2", essential: false, amount_cents: 100_000 })],
      expectedMonthlyReturn: 0,
    });
    expect(first.essentialExpenses).toBe(300_000);
    expect(first.discretionaryExpenses).toBe(100_000);
    expect(first.totalExpenses).toBe(400_000);
  });

  it("não rende sobre patrimônio negativo", () => {
    const [first] = runProjection({
      startMonth: "2026-01-01",
      horizonMonths: 1,
      startingNetWorthCents: -100_000,
      incomePlans: [],
      expensePlans: [],
      expectedMonthlyReturn: 0.01,
    });
    expect(first.investmentReturn).toBe(0);
  });
});

describe("summarizeProjection", () => {
  it("aponta o primeiro mês negativo", () => {
    const months = runProjection({
      startMonth: "2026-01-01",
      horizonMonths: 3,
      startingNetWorthCents: 0,
      incomePlans: [income({ frequency: "ONCE" })],
      expensePlans: [expense()],
      expectedMonthlyReturn: 0,
    });
    const summary = summarizeProjection(months);
    expect(summary.negativeMonths).toBe(2);
    expect(summary.firstNegativeMonth).toBe("2026-02-01");
  });
});
