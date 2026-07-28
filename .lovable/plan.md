## Belchior — Personal Finance OS · FASE 1 (Fundação)

Produto novo, do zero. Sem IA. Todos os cálculos determinísticos em código.
Ao final da Fase 1 eu apresento um resumo e aguardo seu comando para a Fase 2.

### Ajustes de stack (necessários nesta plataforma)
- Roteamento: **TanStack Router** (file-based em `src/routes/`) no lugar de React Router — mesma experiência de navegação.
- Backend: **Lovable Cloud** (Postgres + Auth + RLS gerenciados). Sem serviços externos, nenhum dado financeiro sai do backend/browser.
- Mantidos: React, TypeScript, Vite, Tailwind, shadcn/ui, Recharts, date-fns, Zod, Lucide.

---

### 1. Design system (dark premium por padrão)
- Tokens em `src/styles.css`: fundo quase preto, superfícies levemente elevadas, bordas de baixíssimo contraste, verde para positivo, vermelho reservado, um accent sofisticado (azul-petróleo/âmbar frio) para ações e investimentos. Light mode como variante.
- Fonte Inter via `<link>` no root. Tipografia com números tabulares, valores grandes, muito espaçamento.
- Componentes base: `MetricValue`, `DataBadge` (REAL / PLANEJADO / PROJETADO), `SectionHeader`, `EmptyState`, `AssumptionNote`.
- Formatação `pt-BR` / `BRL` centralizada em `src/lib/format.ts`. Valores monetários guardados como inteiros em centavos.

### 2. Layout e navegação
- Sidebar compacta no desktop; bottom nav no mobile.
- Itens (rotas já criadas na Fase 1, com estado vazio elegante nas de fases futuras): Visão geral, Transações, Fechamentos, Planejamento, Cenários, Patrimônio, Relatórios, Configurações.
- Rota pública `/auth` (e-mail/senha + Google), demais rotas sob gate autenticado. Onboarding em `/onboarding`.

### 3. Banco de dados (RLS por usuário em todas as tabelas)
- `profiles` — nome de exibição, moeda, tema, primeiro dia do mês.
- `settings` — rentabilidade mensal esperada (default 0,8%), meses de reserva (default 6), preferências.
- `categories` / `subcategories` — hierarquia editável, flag `essential`, ordem, cor/ícone; seed das categorias padrão da sua lista no primeiro acesso.
- `categorization_rules` — padrão de texto, tipo de match, prioridade, categoria/subcategoria destino.
- `transactions` — data, descrição, valor (centavos), tipo (`EXPENSE` / `INCOME` / `TRANSFER` / `INVESTMENT_CONTRIBUTION`), categoria, conta, origem (import/manual), hash de dedupe, `closure_id`.
- `income_entries` — receitas **reais** (salário, VR, bolsa, PLR, freelance, rendimentos, outras) com flags `recurring` / `temporary` / `extraordinary`.
- `accounts` (conta corrente, poupança, investimentos, renda fixa, ações, fundos, previdência, bens, dívidas) e `account_balances` (snapshot mensal) → patrimônio histórico real.
- `closures` — fechamento mensal com totais congelados e status.
- Tabelas de planejamento (cenários, income/expense plans, eventos, metas) ficam para a Fase 2.

### 4. Transações
- Lista com filtros (período, categoria, tipo, texto), edição inline de categoria, seleção múltipla, criar/editar/excluir manual.
- Transferências e aportes marcados explicitamente e **excluídos das despesas**; não alteram patrimônio líquido, só a alocação.

### 5. Importação CSV
- Upload → detecção de delimitador/encoding → mapeamento configurável de colunas (data, descrição, valor, débito/crédito) → escolha de formato de data e sinal → **preview** com contagem de novas/duplicadas → confirmação.
- Perfis de import salvos por banco para reutilização. Dedupe por hash (data+valor+descrição).

### 6. Categorização automática
- Motor `domain/categorizationEngine.ts`: regras por prioridade, match por `contains` / `startsWith` / `regex`, case-insensitive e sem acento.
- Seed de regras comuns (UBER, SUPERMERCADO, IFOOD, POSTO, XP INVESTIMENTOS…). CRUD completo de regras em Configurações, com reordenação e botão "reaplicar regras".

### 7. Fechamento mensal
- Fluxo em etapas: importar → categorizar (fila de não categorizadas) → revisar receitas → atualizar saldos de contas → fechar.
- Detalhe do fechamento: totais por categoria, receita recorrente vs extraordinária, saldo do mês, variação patrimonial, comparação com mês anterior. Reabertura permitida.

### 8. Patrimônio
- Cadastro de contas com classificação em Ativos / Passivos e flag de liquidez.
- Snapshot mensal de saldos; `NetWorth = Ativos − Passivos`.
- Gráfico de linha do patrimônio **histórico real** (linha contínua). A camada projetada entra na Fase 2, já preparada visualmente.

### 9. Dashboard (Visão geral)
- Saudação por horário + frase contextual determinística (regras em código, sem IA).
- Indicadores: patrimônio líquido, receita recorrente, despesas do mês, taxa de investimento, saldo do mês, reserva financeira (ativos líquidos e meses cobertos).
- Gráfico de patrimônio histórico e resumo do mês corrente. Poucos elementos, hierarquia clara.

### 10. Onboarding (primeiro acesso)
Seis perguntas curtas: patrimônio atual, renda mensal, principais despesas, meses de reserva desejados, receitas temporárias, uma meta. Cria conta inicial de patrimônio, categorias padrão, configurações e a meta de reserva. Pulável e reeditável.

### 11. Dados de demonstração (removíveis)
Botão em Configurações: "Carregar cenário de demonstração — Família Ago/2026–Ago/2027" com transações, receitas e patrimônio marcados como `is_demo`, banner visível e botão "Remover dados de demonstração". Nada hardcoded na lógica: são só linhas no banco criadas pela mesma UI/regras do produto.

### 12. Preparação para o motor financeiro (Fase 2)
Já nesta fase crio a pasta `src/domain/` com tipos compartilhados e `financialMetrics.ts` (taxa de poupança, taxa de investimento, custo total/essencial/discricionário, reserva em meses) usados pelo dashboard sobre dados reais. `projectionEngine.ts`, `insightEngine.ts`, `scenarioEngine.ts`, `goalEngine.ts`, `budgetEngine.ts` entram nas fases seguintes, junto com os casos de teste do PDF (bolsa, PLR, parcelas, transferência, juros compostos).

---

### Detalhes técnicos
- Estrutura: `src/domain/` (puro, sem React), `src/lib/` (persistência e formatação), `src/hooks/` (React Query), `src/components/<módulo>/`, rotas em `src/routes/`.
- Nenhuma lógica financeira dentro de componentes; funções puras e memoizadas.
- Zod valida todo input de formulário e todo CSV parseado.
- RLS: cada tabela com política `auth.uid() = user_id` e GRANTs explícitos; nenhum dado público.
- Verificação de build/TypeScript ao final da fase.

### Fora do escopo da Fase 1
Cenários, planos de receita/despesa, projeções, eventos, metas, what-if, health score, insights, relatórios e exportação PDF — Fases 2 a 5.
