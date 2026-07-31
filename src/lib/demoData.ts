/**
 * Cenário de demonstração — família Gabriel, Luana e Sofia (Ago/2026 → Ago/2027).
 * Gerador puro e determinístico: as linhas produzidas aqui são gravadas no banco
 * com `is_demo = true` e podem ser removidas a qualquer momento.
 */
import { dedupeHash } from "@/domain/csv";
import type { IncomeNature, IncomeType, TransactionType } from "@/domain/types";
import { monthRange, monthStartISO } from "@/lib/months";

export const DEMO_START = "2026-08-01";
export const DEMO_MONTHS = 13;

export interface DemoAccountSeed {
  key: string;
  name: string;
  type: string;
  side: "ASSET" | "LIABILITY";
  liquid: boolean;
  start: number;
  monthlyDelta: number;
}

export const DEMO_ACCOUNTS: DemoAccountSeed[] = [
  { key: "cc", name: "Conta corrente (demo)", type: "CHECKING", side: "ASSET", liquid: true, start: 850_000, monthlyDelta: 40_000 },
  { key: "reserva", name: "Reserva de emergência (demo)", type: "FIXED_INCOME", side: "ASSET", liquid: true, start: 3_200_000, monthlyDelta: 180_000 },
  { key: "invest", name: "Carteira de investimentos (demo)", type: "INVESTMENT", side: "ASSET", liquid: false, start: 6_500_000, monthlyDelta: 220_000 },
  { key: "carro", name: "Carro (demo)", type: "PROPERTY", side: "ASSET", liquid: false, start: 5_800_000, monthlyDelta: -35_000 },
  { key: "financiamento", name: "Financiamento do carro (demo)", type: "DEBT", side: "LIABILITY", liquid: false, start: 2_400_000, monthlyDelta: -160_000 },
];

interface DemoIncomeSeed {
  name: string;
  type: IncomeType;
  nature: IncomeNature;
  /** Categoria de RECEITA (conjunto separado das categorias de despesa). */
  category: string;
  amount: number;
  day: number;
  from: number;
  to: number;
}

/** índices de mês relativos a DEMO_START (0 = Ago/2026) */
const DEMO_INCOMES: DemoIncomeSeed[] = [
  { name: "Salário Gabriel", type: "SALARY", nature: "RECURRING", category: "Salário", amount: 1_450_000, day: 5, from: 0, to: 12 },
  { name: "Salário Luana", type: "SALARY", nature: "RECURRING", category: "Salário", amount: 780_000, day: 5, from: 0, to: 12 },
  { name: "VR/VA do casal", type: "VR", nature: "RECURRING", category: "VR/VA", amount: 160_000, day: 1, from: 0, to: 12 },
  { name: "Bolsa de pesquisa (temporária)", type: "SCHOLARSHIP", nature: "TEMPORARY", category: "Bolsa", amount: 220_000, day: 10, from: 0, to: 7 },
  { name: "PLR anual", type: "PLR", nature: "EXTRAORDINARY", category: "PLR", amount: 1_800_000, day: 15, from: 5, to: 5 },
  { name: "Freelance de design", type: "FREELANCE", nature: "TEMPORARY", category: "Freelance", amount: 120_000, day: 20, from: 2, to: 9 },
  { name: "Rendimentos de investimentos", type: "INVESTMENT_INCOME", nature: "RECURRING", category: "Rendimentos", amount: 52_000, day: 28, from: 0, to: 12 },
];

interface DemoExpenseSeed {
  description: string;
  amount: number;
  day: number;
  category: string;
  type: TransactionType;
  from?: number;
  to?: number;
}

const DEMO_EXPENSES: DemoExpenseSeed[] = [
  { description: "Aluguel", amount: 380_000, day: 5, category: "Moradia", type: "EXPENSE" },
  { description: "Condomínio e IPTU", amount: 95_000, day: 8, category: "Moradia", type: "EXPENSE" },
  { description: "Supermercado do mês", amount: 210_000, day: 10, category: "Alimentação", type: "EXPENSE" },
  { description: "IFOOD delivery", amount: 48_000, day: 14, category: "Alimentação", type: "EXPENSE" },
  { description: "Plano de saúde família", amount: 172_000, day: 12, category: "Saúde", type: "EXPENSE" },
  { description: "Escola infantil da Sofia", amount: 165_000, day: 7, category: "Educação", type: "EXPENSE", from: 6 },
  { description: "Posto combustível", amount: 62_000, day: 18, category: "Transporte", type: "EXPENSE" },
  { description: "UBER corridas", amount: 21_000, day: 22, category: "Transporte", type: "EXPENSE" },
  { description: "Energia, água e internet", amount: 58_000, day: 16, category: "Moradia", type: "EXPENSE" },
  { description: "Streaming e assinaturas", amount: 14_500, day: 20, category: "Lazer", type: "EXPENSE" },
  { description: "Lazer e restaurantes", amount: 75_000, day: 24, category: "Lazer", type: "EXPENSE" },
  { description: "Enxoval e itens do bebê", amount: 140_000, day: 11, category: "Família", type: "EXPENSE", from: 3, to: 6 },
  { description: "Mudança de cidade", amount: 620_000, day: 3, category: "Moradia", type: "EXPENSE", from: 4, to: 4 },
  { description: "Aporte carteira XP INVESTIMENTOS", amount: 220_000, day: 6, category: "Investimentos", type: "INVESTMENT_CONTRIBUTION" },
  { description: "Aporte reserva de emergência", amount: 180_000, day: 6, category: "Investimentos", type: "INVESTMENT_CONTRIBUTION" },
];

export interface DemoRows {
  accounts: Record<string, unknown>[];
  balancesFor: (accountIdByKey: Record<string, string>) => Record<string, unknown>[];
  /** Receitas e despesas são ambas transações — não existe tabela separada de renda. */
  transactionsFor: (categoryIdByName: Record<string, string>) => Record<string, unknown>[];
}

export function buildDemoData(): DemoRows {
  const months = monthRange(DEMO_START, DEMO_MONTHS);

  return {
    accounts: DEMO_ACCOUNTS.map((a, index) => ({
      name: a.name,
      type: a.type,
      side: a.side,
      liquid: a.liquid,
      sort_order: 100 + index,
      is_demo: true,
    })),

    balancesFor: (accountIdByKey) =>
      months.flatMap((month, i) =>
        DEMO_ACCOUNTS.filter((a) => accountIdByKey[a.key]).map((a) => ({
          account_id: accountIdByKey[a.key],
          month: monthStartISO(month),
          balance_cents: Math.max(0, a.start + a.monthlyDelta * i),
          is_demo: true,
        })),
      ),

    incomes: months.flatMap((month, i) =>
      DEMO_INCOMES.filter((inc) => i >= inc.from && i <= inc.to).map((inc) => ({
        month: monthStartISO(month),
        name: inc.name,
        type: inc.type,
        nature: inc.nature,
        amount_cents: inc.amount,
        is_demo: true,
      })),
    ),

    transactionsFor: (categoryIdByName) =>
      months.flatMap((month, i) =>
        DEMO_EXPENSES.filter((e) => i >= (e.from ?? 0) && i <= (e.to ?? DEMO_MONTHS - 1)).map((e) => {
          const day = String(e.day).padStart(2, "0");
          const occurred = `${month.slice(0, 8)}${day}`;
          return {
            occurred_on: occurred,
            description: e.description,
            amount_cents: e.amount,
            type: e.type,
            category_id: categoryIdByName[e.category] ?? null,
            source: "DEMO",
            dedupe_hash: dedupeHash(occurred, e.amount, e.description),
            is_demo: true,
          };
        }),
      ),
  };
}
