## Objetivo

O fechamento mensal passa a ser 100% derivado das transações. Você importa extrato e fatura, ajusta o que estiver errado na aba Transações, e o fechamento mostra receita total, despesa total, saldo do mês e gráficos de composição — sem nenhum lançamento manual.

## Situação atual (verificada no código)

- `monthMetrics` calcula receita **apenas** da tabela `income_entries`; transações com tipo Receita são ignoradas em todos os cálculos (Dashboard, Fechamentos, Planejamento).
- Por isso a receita do extrato não conta e precisa ser redigitada no Fechamento — daí a duplicação percebida.
- As categorias criadas por padrão são só de despesa/investimento (`seed_defaults`); a coluna `kind` existe em `categories` mas não há categorias de receita.
- Na importação, o tipo é definido só pelo sinal do valor + regras de categorização.

## O que vai mudar

### 1. Receita vem das transações
- `incomeBreakdown` passa a somar transações do tipo Receita, agrupadas por **natureza** (recorrente / temporária / extraordinária), **tipo de renda** (Salário, VR/VA, Bônus, PLR, Freelance, Rendimentos, Outras) e **categoria**.
- Transferências e aportes continuam fora de receita e despesa.
- Dashboard, Fechamentos e o comparativo Planejado vs. Real usam a mesma fonte automaticamente.

### 2. Fim das receitas manuais
- Migração: cada receita já lançada vira uma transação do tipo Receita no dia 1º do mês, com tipo e natureza preservados, marcada como origem manual.
- A aba "Receitas do mês" some do Fechamento; a tabela `income_entries` é removida depois da migração.
- Onboarding e dados de demonstração passam a criar transações de receita em vez de receitas manuais.

### 3. Categorias de receita
- Novas categorias padrão de receita: Salário, VR/VA, Bônus, PLR, Freelance, Rendimentos, Aluguel recebido, Outras receitas (criadas para contas novas e para a sua conta atual).
- O seletor de categoria em Transações e na importação passa a mostrar só categorias compatíveis com o tipo da transação (receita x despesa), evitando misturar.

### 4. Importação: extrato x fatura de cartão
- Novo passo na tela de importação: escolher **Extrato bancário** (negativo = despesa, positivo = receita) ou **Fatura de cartão** (tudo despesa; negativo = estorno, tratado como redução/receita).
- O preview passa a mostrar contagem de entradas e saídas, com o tipo e a categoria sugeridos por linha, e permite trocar tipo/categoria antes de confirmar.

### 5. Transações: separar em vez de misturar
- Abas "Todas / Receitas / Despesas / Transferências e aportes" no topo da lista, com totais de cada aba.
- Cada linha ganha edição completa (data, descrição, valor, moeda, tipo, categoria, conta) e, para receitas, tipo de renda e natureza. Mudar uma transação de Despesa para Receita move-a para a aba certa e limpa a categoria incompatível.

### 6. Fechamento com gráficos
- Cards de Receita total, Despesa total, Saldo do mês e Aportes calculados só das transações.
- **Dois gráficos donut lado a lado**: composição da receita por categoria e composição da despesa por categoria, no padrão visual dark premium do app (Recharts, tooltip com valor formatado na moeda de exibição e percentual, legenda com valores, categorias pequenas agrupadas em "Outros", clique numa fatia filtra a lista de transações do mês).
- Quebra de receita por natureza junto da quebra de despesa essencial x discricionária.
- Aviso quando houver receita ou despesa sem categoria no mês, com link direto para a aba correspondente em Transações.

## Detalhes técnicos

- Migração de banco: adicionar `income_type` e `income_nature` em `transactions` (default `OTHER` / `RECURRING`, usados só quando `type = 'INCOME'`); inserir categorias de receita com `kind = 'INCOME'` para usuários existentes e atualizar `seed_defaults`; copiar `income_entries` para `transactions`; dropar `income_entries` e ajustar limpeza de demo/configurações que referenciam a tabela.
- Domínio: `incomeBreakdown(transactions, categories, convert)` substitui a versão baseada em `IncomeEntry` e devolve também `byCategory`; `monthMetrics` perde o parâmetro `incomes`; testes unitários cobrindo natureza, agrupamento por categoria, multi-moeda e exclusão de transferências/aportes.
- Gráficos: componente reutilizável `CategoryDonut` em `src/components/finance/`, alimentado por `income.byCategory` e `expenses.byCategory`, usando tokens de cor do design system (sem cores hardcoded).
- Importação: `ImportMapping` ganha `sourceKind: 'STATEMENT' | 'CARD_INVOICE'`; a derivação de tipo sai da tela e vira função pura testada em `src/domain/csv.ts`.
- Arquivos afetados: `src/domain/financialMetrics.ts`, `src/domain/csv.ts`, `src/domain/types.ts`, `src/hooks/useFinanceData.ts`, `src/components/finance/CategoryDonut.tsx` (novo), `src/routes/transacoes.tsx`, `src/routes/importar.tsx`, `src/routes/fechamentos.tsx`, `src/routes/index.tsx`, `src/routes/planejamento.tsx`, `src/routes/onboarding.tsx`, `src/routes/configuracoes.tsx`, `src/lib/demoData.ts`.
