# Fase 1.1 — Multi-Currency Foundation

Objetivo: tornar o domínio financeiro currency-aware sem mudar o visual do produto, sem tocar na Fase 2 e sem alterar nenhum dado existente.

## 1. Banco de dados (uma migration)

Moedas suportadas: BRL (default), CAD, USD, EUR, ARS.

- Novo enum `currency_code` com os 5 códigos.
- Coluna `currency currency_code NOT NULL DEFAULT 'BRL'` em: `transactions`, `income_entries`, `accounts`, `account_balances`. Como todas as linhas atuais são BRL, o default preenche o histórico sem alterar valores.
  - `accounts.currency` = moeda nativa da conta (usada como default nos saldos e transações da conta).
  - `account_balances.currency` = moeda do saldo daquele mês (permanece imutável no histórico).
- Coluna `display_currency` na preferência do usuário: reaproveitar `profiles.currency` (já existe, default 'BRL') convertendo-a para o enum — evita duas fontes de verdade.
- Nova tabela `exchange_rates`: `base_currency`, `quote_currency`, `rate numeric`, `effective_on date`, `source text`, único por (base, quote, effective_on). Leitura pública para usuários autenticados (dados de câmbio não são financeiros do usuário), escrita apenas por service_role — nenhum vazamento entre usuários. GRANTs explícitos + RLS conforme padrão do projeto.
- Nenhum `UPDATE`/`DELETE` em dados existentes; nenhum valor convertido persistido.

## 2. Domínio (`src/domain/`)

- `src/domain/currency.ts`: `CurrencyCode`, metadados (símbolo, locale, nome), `DEFAULT_CURRENCY = "BRL"`, tipo `Money { amountCents: number; currency: CurrencyCode }`, helpers `money()`, `isSameCurrency()`.
- `src/domain/exchange.ts`: tipo `ExchangeRate { base, quote, rate, effectiveOn, source }`, `RateTable` (índice em memória), funções puras:
  - `findRate(table, base, quote, onDate)` — usa a cotação vigente **na data**, com fallback à mais recente anterior; suporta inversão (BRL→CAD a partir de CAD→BRL) e triangulação via BRL.
  - `convertMoney(money, target, rateLookup)` — determinística, retorna novo `Money`, identidade quando as moedas coincidem, nunca muta a origem.
  - `sumMoney(list, target, lookup, onDate)` — converte item a item **antes** de somar (patrimônio multimoeda).
- `financialMetrics.ts`: assinaturas passam a receber um conversor + moeda alvo; agregações (patrimônio, despesas, receitas, taxas) convertem cada componente antes de somar. Transferências e aportes continuam fora de despesa — regra intocada.
- Formatação centralizada em `src/lib/format.ts`: `formatMoney(money)` via `Intl.NumberFormat("pt-BR", { currency })` → `R$ 5.267,00`, `CA$ 699,00`, `US$ 1.000,00`, `€ 1.000,00`, `AR$ …`. Nenhum símbolo escrito à mão em componentes.

## 3. Serviço de cotação

- `src/lib/exchangeRates.functions.ts` (server function) + `src/lib/exchangeRates.server.ts`:
  - `getRates()` — lê `exchange_rates` do banco.
  - `refreshRates()` — busca cotações do dia numa fonte pública sem chave (Frankfurter/ECB, com ARS via fallback) e faz upsert de uma linha por par/dia; nunca sobrescreve datas passadas. Chamada sob demanda (botão em Configurações) e no máximo uma vez por dia.
- Nenhuma chamada HTTP em componente React. Carregamento no cliente via um único `useQuery` com `staleTime` longo (`useExchangeRates`), reutilizado por toda a app através de um `CurrencyProvider` — sem refetch por render.

## 4. UI (mudanças mínimas, visual preservado)

- `CurrencyProvider` + `useCurrency()`: expõe `displayCurrency`, `setDisplayCurrency` (persiste no perfil) e `convert/format` prontos.
- Seletor discreto "Moeda: BRL ▾" no header do `AppLayout` (e em Configurações), global para o usuário.
- Dashboard: mesmos cards e gráficos, valores na moeda de visualização; nota discreta quando houver conversão (`≈` + rótulo da data da cotação).
- Transações: valor exibido **sempre na moeda original** (`CAD 699,00`) com linha secundária `≈ R$ 2.756,00` quando a moeda de visualização difere.
- Formulários (transação, receita, conta, saldo): campo Moeda obrigatório, pré-preenchido com a moeda da conta ou o default do usuário.
- Patrimônio: cada conta mostra sua moeda original; totais convertidos antes de agregar, com indicação de que o total é convertido.
- Importação CSV: mapeamento ganha coluna opcional "Moeda"; sem coluna, usa a moeda padrão do usuário (CSVs atuais continuam funcionando). O preview exibe a coluna Moeda antes de importar. O `dedupe_hash` passa a incluir a moeda para não fundir 699 CAD com 699 BRL — hashes antigos permanecem válidos para linhas já importadas em BRL.

## 5. Testes

Adicionar Vitest (`bunx vitest run`) e `src/domain/__tests__/currency.test.ts` cobrindo os 9 casos pedidos: identidade BRL→BRL, CAD→BRL com taxa 4, BRL→CAD com 0,25, troca de moeda de visualização não muta o persistido, transação 699 CAD permanece 699 CAD, agregação de 3 ativos em moedas distintas, uso da cotação da data para transação antiga, CSV sem coluna moeda (default BRL) e CSV com moeda.

## Detalhes técnicos

- Valores continuam inteiros em centavos; conversão arredonda apenas na apresentação (`Math.round`), nunca na persistência.
- `exchange_rates` guarda `rate` como numeric para evitar perda de precisão.
- Tipos gerados do banco são regenerados após a migration; o código que depende do novo enum é escrito depois disso.
- Verificação final: typecheck, build, testes, lint e revisão visual desktop + mobile.

## Limites

Nada de planning, cenários, projeção, metas, spread cambial, ganho/perda cambial, conta multimoeda ou integração bancária. A fase termina aqui.
