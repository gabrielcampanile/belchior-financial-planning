## Fase 2 — Planejamento

Objetivo: responder "como será minha vida financeira nos próximos meses?" com números determinísticos, separando sempre REAL / PLANEJADO / PROJETADO.

### 1. Banco de dados (uma migração)

- `scenarios`: nome, descrição, `is_default`, `base_currency`, `start_month`, `horizon_months` (padrão 60), `expected_monthly_return` (herda de settings), `is_demo`.
- `income_plans`: `scenario_id`, nome, `type` (SALARY, VR, BENEFIT, SCHOLARSHIP, BONUS, PLR, FREELANCE, INVESTMENT_INCOME, OTHER), `nature` (RECURRING / EXTRAORDINARY / TEMPORARY), `amount_cents`, `currency`, `frequency` (MONTHLY, BIMONTHLY, QUARTERLY, SEMIANNUAL, YEARLY, ONCE), `months_of_year` (para PLR em fev/ago), `start_date`, `end_date`, `annual_adjustment_percent`, `enabled`, `notes`.
- `expense_plans`: `scenario_id`, `category_id`, nome, `amount_cents`, `currency`, mesmas frequências e datas, `annual_adjustment_percent`, `essential`, `enabled`, `notes`.
- Todas com RLS por `auth.uid()`, GRANTs, `created_at/updated_at` + trigger, e índices por `scenario_id`.
- Duplicar cenário: função no banco (`duplicate_scenario`) que copia o cenário e todos os planos filhos.

Eventos futuros, metas, what-if e comparação de cenários continuam na Fase 4 (conforme o documento).

### 2. Domínio (funções puras, sem React)

- `src/domain/planning.ts`: tipos `Scenario`, `IncomePlan`, `ExpensePlan`; regras de ocorrência mensal (ativo? dentro de start/end? cai na frequência? qual reajuste anual acumulado?). O reajuste só se aplica em aniversários da `start_date`, nunca mês a mês.
- `src/domain/projectionEngine.ts`: recebe cenário, mês inicial, horizonte, patrimônio inicial (REAL, vindo de `account_balances`), planos, rentabilidade e conversor multi-moeda; devolve `ProjectionMonth[]` com `month, recurringIncome, extraordinaryIncome, totalIncome, essentialExpenses, discretionaryExpenses, totalExpenses, monthlyCashFlow, plannedInvestment, investmentReturn, endingNetWorth`.
- Regras: `totalIncome = recorrente + extraordinária`; `cashFlow = totalIncome − totalExpenses`; `netWorthEnd = netWorthStart + cashFlow + investmentReturn`; investimento nunca é despesa; sobra alocada segundo `surplus_invest_percent` das configurações.
- `bridgeReserveBalance` fica reservado para a Fase 3 (campo já previsto no tipo, calculado como 0 por enquanto).

### 3. Telas

**Cenários** (`/cenarios`): lista de cenários com badge de padrão, criar, renomear, duplicar, excluir, definir como padrão, e ajustar horizonte e rentabilidade esperada.

**Planejamento** (`/planejamento`), com o cenário ativo selecionável no topo:
- Abas *Receitas planejadas* e *Despesas planejadas*: tabelas com criar/editar/remover, moeda por linha, frequência, período de vigência, reajuste anual, essencial (despesas) e toggle de ativação.
- *Projeção*: tabela mês a mês + gráfico de linha (Recharts) do patrimônio projetado, com histórico REAL em traço sólido e projeção em traço pontilhado, e cards de receita recorrente vs. extraordinária.
- *Orçamento do mês*: planejado × real por categoria, com variância em valor e percentual, alimentado pelas transações já existentes.

Todos os valores respeitam a moeda de visualização com o "≈" já implementado; badges REAL / PLANEJADO / PROJETADO em todos os números.

### 4. Qualidade

Testes com vitest para o motor de projeção: reajuste anual só no aniversário, PLR em fevereiro e agosto como extraordinária, fim de bolsa em março/2027, e a identidade `netWorthEnd = netWorthStart + cashFlow + investmentReturn`.

### Fora do escopo

Insights, health score, reserva ponte/emergência (Fase 3); eventos, metas, timeline, what-if e comparação de cenários (Fase 4); relatórios e PDF (Fase 5).
