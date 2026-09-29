# Belchior Financial Planning 

# Construir do zero: Personal Finance OS — Belchior

Quero criar uma aplicação web completa de finanças pessoais chamada provisoriamente **Belchior**.

IMPORTANTE: este é um **NOVO PROJETO**, não quero refatorar nem reaproveitar visualmente o aplicativo antigo.

O projeto antigo era um "Monthly Financial Report": ele fazia fechamento mensal, importação de CSV, categorização de despesas, acompanhamento de receitas, investimentos, patrimônio e histórico.

Quero preservar esses conceitos e aprendizados, mas construir um produto muito mais completo.

O novo produto deve ser um **Personal Finance OS**: uma ferramenta para entender o passado, controlar o presente e principalmente planejar o futuro financeiro.

A aplicação precisa ter aparência de produto fintech premium, como um aplicativo bancário moderno, mas sem copiar nenhuma marca específica.

---

# 1. PRINCÍPIO FUNDAMENTAL DO PRODUTO

O aplicativo deve responder três perguntas:

### PASSADO

"O que aconteceu com meu dinheiro?"

### PRESENTE

"Como está minha situação financeira agora?"

### FUTURO

"Se eu continuar assim, onde vou chegar?"

O fechamento mensal pertence ao PASSADO.

O orçamento pertence ao PRESENTE.

O planejamento, cenários e projeções pertencem ao FUTURO.

O produto deve conectar essas três dimensões.

---

# 2. NÃO USAR IA NESTA PRIMEIRA VERSÃO

Não integrar OpenAI, Gemini, Claude ou qualquer outro LLM.

Todos os cálculos, projeções, indicadores e recomendações da primeira versão devem ser **determinísticos e reproduzíveis**.

Não quero pagar por APIs de IA neste momento.

Podemos posteriormente adicionar uma camada de IA para interpretar dados, mas a primeira versão deve funcionar completamente sem IA.

Isso é importante:

**o sistema nunca deve usar IA para fazer cálculos financeiros.**

Os cálculos devem ser feitos pelo código.

---

# 3. STACK

Use uma stack moderna e simples:

* React

* TypeScript

* Vite

* Tailwind CSS

* shadcn/ui

* Supabase

* Recharts

* React Router

* date-fns

* Zod para validação

* Lucide icons

Não adicionar dependências desnecessárias.

O código deve ser fortemente tipado.

Separar claramente:

* UI

* domínio financeiro

* persistência

* cálculos

* projeções

* componentes visuais

Não colocar lógica financeira complexa diretamente dentro dos componentes React.

---

# 4. DESIGN / UX

Quero um produto com aparência de:

**"banco digital premium + wealth management + dashboard financeiro".**

Não quero aparência de planilha.

Não quero excesso de cards coloridos.

Não quero visual infantil.

Não quero dashboard lotado.

Quero algo:

* clean

* sofisticado

* minimalista

* muito espaçamento

* tipografia excelente

* números grandes e legíveis

* poucos elementos por tela

* microinterações discretas

* gráficos limpos

* hierarquia visual muito clara

Preferência por:

* dark mode premium como padrão

* opção de light mode

* fundo quase preto

* surfaces levemente elevadas

* bordas extremamente sutis

* verde para entradas/positivo

* vermelho apenas quando realmente necessário

* uma cor de destaque sofisticada para ações e investimentos

Usar Inter ou Geist.

Não usar gradientes exagerados.

Não usar glassmorphism excessivo.

Não transformar tudo em cards.

A sensação deve ser de um produto financeiro sério.

---

# 5. NAVEGAÇÃO PRINCIPAL

Desktop:

Sidebar compacta e elegante.

Itens:

1. Visão geral

2. Transações

3. Fechamentos

4. Planejamento

5. Cenários

6. Patrimônio

7. Relatórios

8. Configurações

Mobile:

Bottom navigation com os principais módulos.

---

# 6. DASHBOARD / VISÃO GERAL

A Home deve ser a tela mais importante.

No topo:

"Bom dia, Gabriel"

E uma pequena frase contextual baseada nos dados, mas sem IA.

Exemplo:

"Seu patrimônio cresceu R$ 4.820 este mês."

Esse texto deve ser gerado por regras determinísticas.

---

## Indicadores principais

Mostrar:

### Patrimônio líquido

Valor atual dos ativos menos passivos.

### Receita mensal

Receita recorrente atual.

### Despesas do mês

Total efetivamente gasto.

### Taxa de investimento

Investimentos / receitas.

### Saldo do mês

Receitas - despesas.

### Reserva financeira

Valor líquido disponível em ativos líquidos.

---

# 7. DASHBOARD DE PATRIMÔNIO

Gráfico de linha mostrando:

* patrimônio histórico

* patrimônio atual

* patrimônio projetado

Diferenciar visualmente:

**Histórico**

dados reais.

**Projeção**

dados calculados.

Nunca misturar os dois sem deixar claro.

---

# 8. FECHAMENTO MENSAL

Preservar a ideia fundamental do sistema antigo.

O usuário deve poder criar um fechamento para um determinado mês.

Fluxo:

## Etapa 1 — Importar transações

Permitir CSV.

O parser deve ser configurável e tolerante a pequenas diferenças.

Mostrar preview antes de importar.

---

## Etapa 2 — Categorizar

Categorias padrão:

### Moradia

* aluguel

* condomínio

* IPTU

* energia

* água

* gás

* internet

* manutenção

### Alimentação

* mercado

* restaurante

* delivery

* café

* alimentação

### Transporte

* gasolina

* estacionamento

* pedágio

* Uber

* transporte público

* manutenção

* seguro

* IPVA

### Saúde

* plano de saúde

* consulta

* exame

* farmácia

* terapia

* academia

### Família

* bebê

* filhos

* presentes

* família

### Lazer

* viagens

* entretenimento

* hobbies

* bares

* restaurantes

### Assinaturas

* streaming

* software

* serviços

### Compras

* roupas

* eletrônicos

* casa

* outros

### Investimentos

### Impostos

### Outros

O usuário deve poder criar, editar, remover e reorganizar categorias.

---

# 9. REGRAS DE CATEGORIZAÇÃO

Criar regras automáticas.

Exemplo:

Se descrição contém:

"UBER"

→ Transporte / Uber

Se contém:

"SUPERMERCADO"

→ Alimentação / Mercado

O usuário deve poder criar regras personalizadas.

Exemplo:

"XP INVESTIMENTOS"

→ Investimentos

As regras devem ter prioridade configurável.

---

# 10. RECEITAS

Permitir registrar receitas reais:

* salário

* VR/VA

* bolsa

* PLR

* freelance

* rendimentos

* outras

Importante:

**receita real** e **receita planejada** são conceitos diferentes.

Não misturar.

---

# 11. PLANEJAMENTO FINANCEIRO

Criar uma seção completamente nova chamada:

# Planejamento

Essa seção deve responder:

"Como será minha vida financeira nos próximos meses?"

---

# 12. CENÁRIO FINANCEIRO

Todo planejamento pertence a um cenário.

Exemplos:

* Cenário atual

* Indaiatuba

* Sorocaba

* Canadá 2028

* Promoção XP

* Conservador

* Otimista

O usuário pode:

* criar cenário

* duplicar cenário

* renomear

* excluir

* definir como padrão

Duplicar um cenário deve criar uma cópia independente.

---

# 13. FONTES DE RENDA PLANEJADAS

Criar entidade:

IncomePlan

Campos:

* id

* scenario_id

* name

* type

* amount

* frequency

* start_date

* end_date

* annual_adjustment_percent

* enabled

Tipos:

* SALARY

* VR

* BENEFIT

* SCHOLARSHIP

* BONUS

* PLR

* FREELANCE

* INVESTMENT_INCOME

* OTHER

Frequências:

* MONTHLY

* BIMONTHLY

* QUARTERLY

* SEMIANNUAL

* YEARLY

* ONCE

---

# 14. REGRAS DE RECEITAS

Para cada mês da projeção:

1. verificar se a receita está ativa;

2. verificar start_date;

3. verificar end_date;

4. aplicar frequência;

5. aplicar reajuste anual, se houver;

6. somar à receita planejada.

Exemplo:

Salário:

R$ 5.267/mês

start:

01/08/2026

annual adjustment:

5%

O valor não deve aumentar todo mês.

Deve aumentar somente quando completar um ano.

---

# 15. PLR

PLR deve poder ser configurada como evento recorrente.

Exemplo:

R$ 20.000

Fevereiro e Agosto.

Isso NÃO deve ser considerado receita recorrente mensal.

Deve aparecer como:

**Receita extraordinária.**

No dashboard:

Receita recorrente

vs.

Receita extraordinária.

---

# 16. DESPESAS PLANEJADAS

Criar:

ExpensePlan

Campos:

* id

* scenario_id

* category_id

* name

* amount

* frequency

* start_date

* end_date

* annual_adjustment_percent

* enabled

* essential

* notes

---

# 17. DESPESAS ESSENCIAIS

Permitir marcar uma despesa como:

* essencial

* discricionária

Exemplo:

Moradia → essencial

Mercado → essencial

Gasolina → essencial

Netflix → discricionária

Lazer → discricionária

Isso será usado posteriormente para calcular o "custo mínimo de vida".

---

# 18. EVENTOS FUTUROS

Criar entidade:

PlanningEvent

Campos:

* id

* scenario_id

* name

* date

* type

* description

Tipos:

* BIRTH

* MOVE

* JOB_CHANGE

* PROMOTION

* SCHOLARSHIP_END

* IMMIGRATION

* PURCHASE

* SALE

* CUSTOM

Um evento pode modificar o planejamento.

---

# 19. EXEMPLO REAL DO PROJETO

Cadastrar inicialmente apenas como exemplo/template, não como dados obrigatórios do usuário:

### Agosto/2026

Mudança para Indaiatuba.

Moradia passa de aproximadamente R$ 1.500 para aproximadamente R$ 3.500.

---

### Setembro/2026

Nascimento da Sofia.

Adicionar custos planejados de bebê.

---

### Março/2027

Fim da bolsa de R$ 3.200.

A receita deixa de existir.

---

### Fevereiro/2027

PLR extraordinária de R$ 20.000.

---

### Agosto/2027

PLR extraordinária de R$ 20.000.

---

# 20. MOTOR DE PROJEÇÃO

Criar um serviço isolado:

projectionEngine.ts

Esse serviço recebe:

* cenário

* data inicial

* data final

* patrimônio inicial

* receitas planejadas

* despesas planejadas

* eventos

* rentabilidade

E retorna:

ProjectionMonth[]

Cada mês deve conter:

* month

* recurringIncome

* extraordinaryIncome

* totalIncome

* essentialExpenses

* discretionaryExpenses

* totalExpenses

* monthlyCashFlow

* plannedInvestment

* investmentReturn

* endingNetWorth

* bridgeReserveBalance

---

# 21. REGRA FUNDAMENTAL DO FLUXO

Para cada mês:

totalIncome =

recurringIncome + extraordinaryIncome

cashFlow =

totalIncome - totalExpenses

netWorthEnd =

netWorthStart + cashFlow + investmentReturn

Não contar investimento como despesa.

Transferência entre contas não é despesa.

Transferência para investimento não reduz patrimônio.

Ela apenas altera a composição do patrimônio.

---

# 22. RENTABILIDADE

Permitir configurar:

"Rentabilidade média mensal esperada"

Default:

0,8% ao mês.

Não usar 1% como promessa.

Mostrar claramente:

"premissa de rentabilidade".

Calcular:

investmentReturn =

investedBalanceStartOfMonth * monthlyRate

Permitir desligar a rentabilidade para uma projeção conservadora.

---

# 23. PROJEÇÃO CONSERVADORA

Criar três modos:

### Conservador

Sem rentabilidade.

### Base

Rentabilidade configurada pelo usuário.

### Otimista

Rentabilidade configurada pelo usuário + crescimento de renda.

Não apresentar isso como previsão certa.

Sempre chamar de:

"Projeção baseada nas premissas informadas."

---

# 24. RESERVA DE EMERGÊNCIA

Criar configuração:

"Meses de custo essencial desejados"

Default:

6 meses.

Calcular:

essentialMonthlyCost =

média das despesas essenciais planejadas

emergencyFundTarget =

essentialMonthlyCost * emergencyMonths

Mostrar:

Reserva atual

Meta

Percentual atingido

---

# 25. RESERVA PONTE

Criar um conceito específico:

# Reserva Ponte

É uma reserva destinada a cobrir temporariamente a perda de uma receita recorrente.

Exemplo:

Bolsa termina.

A reserva ponte cobre a diferença entre:

despesas planejadas

e

receita recorrente.

---

## Regras

O usuário pode criar uma reserva ponte associada a uma receita temporária.

Exemplo:

Bolsa:

R$ 3.200

Fim:

Março/2027

Se em determinado mês:

Receita recorrente = R$ 7.185

Despesas = R$ 8.500

Déficit = R$ 1.315

E a reserva ponte tiver saldo:

R$ 8.000

Então:

BridgeReserve =

R$ 8.000 - R$ 1.315

=

R$ 6.685

---

# 26. DEPENDÊNCIA DE RENDA TEMPORÁRIA

Mostrar indicador:

Temporary Income Dependency

Fórmula:

temporaryIncome / totalIncome

Exemplo:

R$ 3.200 / R$ 10.385

= 30,8%

Mostrar:

"31% da sua renda atual depende de fontes temporárias."

---

# 27. CUSTO DE VIDA

Criar três indicadores:

### Custo total

Todas as despesas.

### Custo essencial

Somente essenciais.

### Custo discricionário

Total - essenciais.

Isso permite responder:

"Quanto custa manter minha vida?"

e

"Quanto custa sobreviver se eu precisar cortar tudo?"

---

# 28. TAXA DE POUPANÇA

Fórmula:

(totalIncome - totalExpenses) / totalIncome

Mostrar mensal e anual.

---

# 29. TAXA DE INVESTIMENTO

Fórmula:

newInvestments / totalIncome

Não confundir com taxa de poupança.

---

# 30. DASHBOARD DE PLANEJAMENTO

Mostrar:

## Patrimônio projetado

Gráfico:

histórico real → linha contínua

projeção → linha pontilhada

---

## Fluxo de caixa

Barras:

receita

despesa

saldo

---

## Receita

Stacked bar:

recorrente

extraordinária

temporária

---

## Despesas

Stacked:

essencial

discricionária

---

## Eventos

Timeline horizontal.

Exemplo:

AGO/26

Mudança

SET/26

Sofia nasce

MAR/27

Bolsa termina

FEV/27

PLR

AGO/27

PLR

---

# 31. SIMULADOR DE CENÁRIOS

Criar uma tela:

# Cenários

Permitir selecionar 2 a 4 cenários.

Comparar:

* patrimônio final

* renda total

* despesas totais

* média mensal

* taxa de poupança

* meses em déficit

* reserva de emergência

* reserva ponte

* patrimônio mínimo

* patrimônio máximo

Mostrar gráfico comparativo.

---

# 32. WHAT-IF

Permitir editar rapidamente variáveis:

"Aluguel"

R$ 3.500

slider/input:

R$ 2.000 → R$ 6.000

Ao mudar:

recalcular imediatamente:

* fluxo mensal

* patrimônio final

* taxa de poupança

Não salvar automaticamente.

Tratar como simulação temporária.

Botão:

"Salvar como cenário".

---

# 33. METAS FINANCEIRAS

Criar:

Goal

Campos:

* name

* targetAmount

* currentAmount

* targetDate

* priority

* category

Exemplos:

* Reserva de emergência

* Canadá

* Entrada imóvel

* Viagem

* Patrimônio de R$ 500 mil

Calcular:

monthlyRequiredContribution

para atingir a meta.

---

# 34. INTELIGÊNCIA SEM IA

Criar um mecanismo de regras chamado:

FinancialInsightsEngine

Ele recebe os dados reais + planejamento.

E produz insights determinísticos.

Exemplos:

### Insight 1

Se despesas > receitas recorrentes:

"Seu orçamento atual depende de receitas temporárias."

---

### Insight 2

Se moradia > 35% da receita recorrente:

"Moradia representa mais de 35% da sua renda recorrente."

---

### Insight 3

Se taxa de poupança < 10%:

"Sua taxa de poupança está abaixo de 10%."

---

### Insight 4

Se patrimônio cresceu:

"Seu patrimônio cresceu R$ X no período."

---

### Insight 5

Se categoria aumentou >20% versus média de 6 meses:

"Seus gastos com X aumentaram 23% acima da média recente."

---

### Insight 6

Se receita temporária termina nos próximos 6 meses:

"Uma fonte de renda de R$ X/mês termina em Y meses."

---

### Insight 7

Se reserva de emergência < meta:

"Sua reserva cobre X meses do custo essencial."

---

### Insight 8

Se há déficit projetado:

"O cenário apresenta déficit de R$ X no mês Y."

---

# 35. HEALTH SCORE

Criar um score financeiro de 0–100.

Não usar machine learning.

Fórmula transparente.

Componentes:

### Reserva de emergência — 25 pontos

0 pontos = nenhuma reserva

25 = >= meta

Linear entre os extremos.

---

### Fluxo recorrente — 25 pontos

25 = receita recorrente >= despesas

Menor conforme aumenta o déficit.

---

### Taxa de poupança — 20 pontos

20 = >= 30%

15 = 20%

10 = 10%

5 = 5%

0 = <= 0%

---

### Dependência de renda temporária — 15 pontos

15 = nenhuma

10 = <= 10%

5 = <= 25%

0 = > 50%

---

### Crescimento patrimonial — 15 pontos

15 = crescimento consistente

10 = estável

5 = pequena redução

0 = redução relevante

Mostrar sempre como:

"Score calculado a partir das suas configurações."

Não fingir que é uma métrica financeira universal.

---

# 36. RELATÓRIO MENSAL

Ao fechar o mês, gerar automaticamente:

## Resumo

"Você recebeu R$ X e gastou R$ Y."

## Patrimônio

"Seu patrimônio variou R$ X."

## Destaques

Top 3 maiores categorias.

## Comparação

Comparar com:

* mês anterior

* média dos últimos 3 meses

* média dos últimos 6 meses

## Planejamento

Comparar:

realizado vs planejado.

Exemplo:

Mercado

Planejado: R$ 1.600

Realizado: R$ 1.830

Desvio: +14,4%

---

# 37. ORÇAMENTO VS REALIZADO

Cada categoria planejada deve ser comparada com o fechamento real.

Mostrar:

budget

actual

variance

variancePercent

Exemplo:

Moradia

Planejado: R$ 3.500

Real: R$ 3.480

→ dentro do orçamento

---

# 38. PATRIMÔNIO

Permitir registrar:

* conta corrente

* poupança

* investimentos

* renda fixa

* ações

* fundos

* previdência

* bens

* dívidas

Separar:

Assets

Liabilities

Net Worth

Fórmula:

NetWorth =

TotalAssets - TotalLiabilities

---

# 39. IMPORTANTE: NÃO DUPLICAR PATRIMÔNIO

Se o usuário importa uma transação de:

"Transferência para investimento"

não considerar como despesa.

Se:

Conta corrente -R$ 10.000

Investimento +R$ 10.000

Patrimônio não muda.

Apenas a alocação muda.

---

# 40. CONFIGURAÇÕES

Permitir:

* moeda

* primeiro dia do mês

* categorias

* regras de categorização

* rentabilidade esperada

* meses de reserva

* categorias essenciais

* metas

* tema

* preferências de dashboard

---

# 41. EXPERIÊNCIA DE PRIMEIRO ACESSO

Criar onboarding.

Perguntar:

1. Qual seu patrimônio atual?

2. Qual sua renda mensal?

3. Quais suas principais despesas?

4. Quanto deseja manter como reserva?

5. Possui receitas temporárias?

6. Possui alguma meta financeira?

Depois criar automaticamente:

* cenário "Atual"

* orçamento inicial

* dashboard

* meta de reserva de emergência

Não exigir que o usuário configure 50 campos antes de ver valor.

---

# 42. PRIVACIDADE

Dados financeiros são sensíveis.

Implementar:

* autenticação Supabase

* Row Level Security

* cada usuário só acessa seus próprios dados

* nenhum dado financeiro deve ser público

* não enviar dados financeiros para APIs externas

Como não haverá IA nesta versão, **nenhum dado financeiro deve sair do Supabase/browser para serviços externos**.

---

# 43. PERFORMANCE

Não recalcular toda a projeção em cada render.

Criar funções puras e memoização onde fizer sentido.

O projection engine deve ser independente da UI.

Idealmente:

```text

domain/

  projectionEngine.ts

  financialMetrics.ts

  insightEngine.ts

  scenarioEngine.ts

  goalEngine.ts

```

A UI apenas consome os resultados.

---

# 44. ARQUITETURA SUGERIDA

Organizar aproximadamente:

```text

src/

components/

  dashboard/

  transactions/

  closures/

  planning/

  scenarios/

  net-worth/

  goals/

  reports/

  layout/

domain/

  projectionEngine.ts

  financialMetrics.ts

  insightEngine.ts

  scenarioEngine.ts

  goalEngine.ts

  budgetEngine.ts

hooks/

  useTransactions.ts

  useClosures.ts

  usePlanning.ts

  useScenarios.ts

  useNetWorth.ts

  useGoals.ts

pages/

  Dashboard.tsx

  Transactions.tsx

  Closures.tsx

  ClosureDetail.tsx

  Planning.tsx

  Scenarios.tsx

  NetWorth.tsx

  Reports.tsx

  Settings.tsx

```

Não precisa seguir literalmente se houver uma arquitetura melhor, mas manter a separação de responsabilidades.

---

# 45. DADOS REAIS VS PLANEJADOS

Essa distinção é absolutamente obrigatória.

Usar nomenclatura visual:

REAL

PLANEJADO

PROJETADO

Nunca misturar silenciosamente.

Por exemplo:

Patrimônio:

R$ 200.000 REAL

→ R$ 247.000 PROJETADO

---

# 46. EXEMPLO DE PROJEÇÃO

Se:

Patrimônio inicial = R$ 200.000

Receita recorrente = R$ 7.185

Despesa = R$ 8.500

Então:

fluxo = -R$ 1.315

Se não houver outra fonte:

patrimônio diminui R$ 1.315.

Se houver bolsa de R$ 3.200:

receita total = R$ 10.385

fluxo = R$ 1.885

Esse valor aumenta o patrimônio, salvo se o usuário configurar uma regra específica de alocação.

---

# 47. ALOCAÇÃO DE SOBRAS

Permitir configurar:

"Quando houver sobra mensal, o que fazer?"

Opções:

* manter em caixa

* investir

* dividir percentual

Exemplo:

80% investir

20% caixa

---

# 48. ALOCAÇÃO DE PLR

Permitir configurar separadamente:

PLR:

100% investir

ou

70% investir

30% meta Canadá

Isso não deve ser hardcoded.

---

# 49. RESUMO EXECUTIVO

No topo do dashboard mostrar algo semelhante a:

```text

Patrimônio

R$ 200.000

+ R$ 3.850 este mês

Receita recorrente

R$ 7.185

Despesas planejadas

R$ 8.500

Gap mensal

-R$ 1.315

Reserva

8,2 meses

Health score

87

```

E abaixo:

"Seu cenário atual é sustentável com a reserva ponte configurada."

Esse texto deve vir do FinancialInsightsEngine, não de IA.

---

# 50. PRINCÍPIOS DE PRODUTO

O aplicativo NÃO deve:

* tentar parecer uma planilha

* mostrar dezenas de números simultaneamente

* usar IA para matemática

* inventar previsões

* tratar projeção como certeza

* misturar receita extraordinária com renda recorrente

* tratar transferência entre contas como despesa

* misturar patrimônio com fluxo de caixa

* esconder premissas dos cálculos

O aplicativo DEVE:

* ser extremamente claro

* mostrar premissas

* permitir edição rápida

* permitir simulações

* preservar histórico

* distinguir real vs planejado vs projetado

* explicar os cálculos

* ser útil mesmo sem planejamento avançado

* funcionar perfeitamente no mobile

---

# 51. MVP — IMPLEMENTAÇÃO EM FASES

Não tente construir tudo em uma única etapa.

Implemente nesta ordem:

## FASE 1

Fundação:

* autenticação

* banco

* layout

* dashboard

* categorias

* receitas

* despesas

* patrimônio

* transações

* fechamento mensal

* importação CSV

## FASE 2

Planejamento:

* cenários

* receitas planejadas

* despesas planejadas

* orçamento

* projection engine

## FASE 3

Inteligência determinística:

* insights

* health score

* comparação real vs planejado

* dependência de renda temporária

* reserva de emergência

* reserva ponte

## FASE 4

Planejamento avançado:

* eventos

* metas

* timeline

* what-if

* comparação de cenários

## FASE 5

Relatórios:

* relatório mensal

* gráficos

* exportação PDF

* resumo executivo

---

# 52. CRITÉRIOS DE ACEITAÇÃO

Antes de considerar a aplicação pronta, verificar:

1. Posso importar minhas transações.

2. Posso categorizar automaticamente.

3. Posso corrigir categorias.

4. Posso fechar um mês.

5. Posso visualizar histórico.

6. Posso visualizar patrimônio.

7. Posso criar receitas futuras.

8. Posso criar despesas futuras.

9. Posso criar cenários.

10. Posso duplicar cenários.

11. Posso simular mudanças sem salvar.

12. Posso salvar uma simulação como cenário.

13. Posso criar eventos futuros.

14. O fim de uma receita realmente altera a projeção.

15. Uma PLR aparece como receita extraordinária.

16. Transferências não alteram patrimônio líquido.

17. Posso configurar rentabilidade.

18. Posso configurar reserva de emergência.

19. Posso criar reserva ponte.

20. O sistema mostra dependência de renda temporária.

21. O sistema calcula taxa de poupança.

22. O sistema calcula taxa de investimento.

23. O sistema calcula custo essencial.

24. O sistema calcula Health Score.

25. O sistema compara realizado vs planejado.

26. O sistema mostra patrimônio histórico + projetado.

27. O sistema funciona sem nenhuma API de IA.

28. Os dados de um usuário nunca aparecem para outro usuário.

29. Todos os valores monetários usam pt-BR e BRL.

30. O layout funciona perfeitamente em desktop e mobile.

---

# 53. MUITO IMPORTANTE SOBRE IMPLEMENTAÇÃO

Não gerar dados financeiros fictícios como se fossem dados reais do usuário.

Se precisar de dados para demonstrar componentes durante desenvolvimento, usar claramente "dados de demonstração" e permitir removê-los.

Não alterar silenciosamente regras financeiras existentes.

Não implementar features parcialmente e declarar concluído.

Antes de cada fase, verificar se o código compila e se não há erros TypeScript.

Priorizar qualidade da arquitetura e consistência dos cálculos em vez de quantidade de features.

Começar pela FASE 1.

Depois de finalizar a FASE 1, apresentar um resumo do que foi implementado e aguardar meu próximo comando antes de iniciar a FASE 2.

# Construir do zero: Personal Finance OS — Belchior

Quero criar uma aplicação web completa de finanças pessoais chamada provisoriamente **Belchior**.

IMPORTANTE: este é um **NOVO PROJETO**, não quero refatorar nem reaproveitar visualmente o aplicativo antigo.

O projeto antigo era um "Monthly Financial Report": ele fazia fechamento mensal, importação de CSV, categorização de despesas, acompanhamento de receitas, investimentos, patrimônio e histórico.

Quero preservar esses conceitos e aprendizados, mas construir um produto muito mais completo.

O novo produto deve ser um **Personal Finance OS**: uma ferramenta para entender o passado, controlar o presente e principalmente planejar o futuro financeiro.

A aplicação precisa ter aparência de produto fintech premium, como um aplicativo bancário moderno, mas sem copiar nenhuma marca específica.

---

# 1. PRINCÍPIO FUNDAMENTAL DO PRODUTO

O aplicativo deve responder três perguntas:

### PASSADO

"O que aconteceu com meu dinheiro?"

### PRESENTE

"Como está minha situação financeira agora?"

### FUTURO

"Se eu continuar assim, onde vou chegar?"

O fechamento mensal pertence ao PASSADO.

O orçamento pertence ao PRESENTE.

O planejamento, cenários e projeções pertencem ao FUTURO.

O produto deve conectar essas três dimensões.

---

# 2. NÃO USAR IA NESTA PRIMEIRA VERSÃO

Não integrar OpenAI, Gemini, Claude ou qualquer outro LLM.

Todos os cálculos, projeções, indicadores e recomendações da primeira versão devem ser **determinísticos e reproduzíveis**.

Não quero pagar por APIs de IA neste momento.

Podemos posteriormente adicionar uma camada de IA para interpretar dados, mas a primeira versão deve funcionar completamente sem IA.

Isso é importante:

**o sistema nunca deve usar IA para fazer cálculos financeiros.**

Os cálculos devem ser feitos pelo código.

---

# 3. STACK

Use uma stack moderna e simples:

* React

* TypeScript

* Vite

* Tailwind CSS

* shadcn/ui

* Supabase

* Recharts

* React Router

* date-fns

* Zod para validação

* Lucide icons

Não adicionar dependências desnecessárias.

O código deve ser fortemente tipado.

Separar claramente:

* UI

* domínio financeiro

* persistência

* cálculos

* projeções

* componentes visuais

Não colocar lógica financeira complexa diretamente dentro dos componentes React.

---

# 4. DESIGN / UX

Quero um produto com aparência de:

**"banco digital premium + wealth management + dashboard financeiro".**

Não quero aparência de planilha.

Não quero excesso de cards coloridos.

Não quero visual infantil.

Não quero dashboard lotado.

Quero algo:

* clean

* sofisticado

* minimalista

* muito espaçamento

* tipografia excelente

* números grandes e legíveis

* poucos elementos por tela

* microinterações discretas

* gráficos limpos

* hierarquia visual muito clara

Preferência por:

* dark mode premium como padrão

* opção de light mode

* fundo quase preto

* surfaces levemente elevadas

* bordas extremamente sutis

* verde para entradas/positivo

* vermelho apenas quando realmente necessário

* uma cor de destaque sofisticada para ações e investimentos

Usar Inter ou Geist.

Não usar gradientes exagerados.

Não usar glassmorphism excessivo.

Não transformar tudo em cards.

A sensação deve ser de um produto financeiro sério.

---

# 5. NAVEGAÇÃO PRINCIPAL

Desktop:

Sidebar compacta e elegante.

Itens:

1. Visão geral

2. Transações

3. Fechamentos

4. Planejamento

5. Cenários

6. Patrimônio

7. Relatórios

8. Configurações

Mobile:

Bottom navigation com os principais módulos.

---

# 6. DASHBOARD / VISÃO GERAL

A Home deve ser a tela mais importante.

No topo:

"Bom dia, Gabriel"

E uma pequena frase contextual baseada nos dados, mas sem IA.

Exemplo:

"Seu patrimônio cresceu R$ 4.820 este mês."

Esse texto deve ser gerado por regras determinísticas.

---

## Indicadores principais

Mostrar:

### Patrimônio líquido

Valor atual dos ativos menos passivos.

### Receita mensal

Receita recorrente atual.

### Despesas do mês

Total efetivamente gasto.

### Taxa de investimento

Investimentos / receitas.

### Saldo do mês

Receitas - despesas.

### Reserva financeira

Valor líquido disponível em ativos líquidos.

---

# 7. DASHBOARD DE PATRIMÔNIO

Gráfico de linha mostrando:

* patrimônio histórico

* patrimônio atual

* patrimônio projetado

Diferenciar visualmente:

**Histórico**

dados reais.

**Projeção**

dados calculados.

Nunca misturar os dois sem deixar claro.

---

# 8. FECHAMENTO MENSAL

Preservar a ideia fundamental do sistema antigo.

O usuário deve poder criar um fechamento para um determinado mês.

Fluxo:

## Etapa 1 — Importar transações

Permitir CSV.

O parser deve ser configurável e tolerante a pequenas diferenças.

Mostrar preview antes de importar.

---

## Etapa 2 — Categorizar

Categorias padrão:

### Moradia

* aluguel

* condomínio

* IPTU

* energia

* água

* gás

* internet

* manutenção

### Alimentação

* mercado

* restaurante

* delivery

* café

* alimentação

### Transporte

* gasolina

* estacionamento

* pedágio

* Uber

* transporte público

* manutenção

* seguro

* IPVA

### Saúde

* plano de saúde

* consulta

* exame

* farmácia

* terapia

* academia

### Família

* bebê

* filhos

* presentes

* família

### Lazer

* viagens

* entretenimento

* hobbies

* bares

* restaurantes

### Assinaturas

* streaming

* software

* serviços

### Compras

* roupas

* eletrônicos

* casa

* outros

### Investimentos

### Impostos

### Outros

O usuário deve poder criar, editar, remover e reorganizar categorias.

---

# 9. REGRAS DE CATEGORIZAÇÃO

Criar regras automáticas.

Exemplo:

Se descrição contém:

"UBER"

→ Transporte / Uber

Se contém:

"SUPERMERCADO"

→ Alimentação / Mercado

O usuário deve poder criar regras personalizadas.

Exemplo:

"XP INVESTIMENTOS"

→ Investimentos

As regras devem ter prioridade configurável.

---

# 10. RECEITAS

Permitir registrar receitas reais:

* salário

* VR/VA

* bolsa

* PLR

* freelance

* rendimentos

* outras

Importante:

**receita real** e **receita planejada** são conceitos diferentes.

Não misturar.

---

# 11. PLANEJAMENTO FINANCEIRO

Criar uma seção completamente nova chamada:

# Planejamento

Essa seção deve responder:

"Como será minha vida financeira nos próximos meses?"

---

# 12. CENÁRIO FINANCEIRO

Todo planejamento pertence a um cenário.

Exemplos:

* Cenário atual

* Indaiatuba

* Sorocaba

* Canadá 2028

* Promoção XP

* Conservador

* Otimista

O usuário pode:

* criar cenário

* duplicar cenário

* renomear

* excluir

* definir como padrão

Duplicar um cenário deve criar uma cópia independente.

---

# 13. FONTES DE RENDA PLANEJADAS

Criar entidade:

IncomePlan

Campos:

* id

* scenario_id

* name

* type

* amount

* frequency

* start_date

* end_date

* annual_adjustment_percent

* enabled

Tipos:

* SALARY

* VR

* BENEFIT

* SCHOLARSHIP

* BONUS

* PLR

* FREELANCE

* INVESTMENT_INCOME

* OTHER

Frequências:

* MONTHLY

* BIMONTHLY

* QUARTERLY

* SEMIANNUAL

* YEARLY

* ONCE

---

# 14. REGRAS DE RECEITAS

Para cada mês da projeção:

1. verificar se a receita está ativa;

2. verificar start_date;

3. verificar end_date;

4. aplicar frequência;

5. aplicar reajuste anual, se houver;

6. somar à receita planejada.

Exemplo:

Salário:

R$ 5.267/mês

start:

01/08/2026

annual adjustment:

5%

O valor não deve aumentar todo mês.

Deve aumentar somente quando completar um ano.

---

# 15. PLR

PLR deve poder ser configurada como evento recorrente.

Exemplo:

R$ 20.000

Fevereiro e Agosto.

Isso NÃO deve ser considerado receita recorrente mensal.

Deve aparecer como:

**Receita extraordinária.**

No dashboard:

Receita recorrente

vs.

Receita extraordinária.

---

# 16. DESPESAS PLANEJADAS

Criar:

ExpensePlan

Campos:

* id

* scenario_id

* category_id

* name

* amount

* frequency

* start_date

* end_date

* annual_adjustment_percent

* enabled

* essential

* notes

---

# 17. DESPESAS ESSENCIAIS

Permitir marcar uma despesa como:

* essencial

* discricionária

Exemplo:

Moradia → essencial

Mercado → essencial

Gasolina → essencial

Netflix → discricionária

Lazer → discricionária

Isso será usado posteriormente para calcular o "custo mínimo de vida".

---

# 18. EVENTOS FUTUROS

Criar entidade:

PlanningEvent

Campos:

* id

* scenario_id

* name

* date

* type

* description

Tipos:

* BIRTH

* MOVE

* JOB_CHANGE

* PROMOTION

* SCHOLARSHIP_END

* IMMIGRATION

* PURCHASE

* SALE

* CUSTOM

Um evento pode modificar o planejamento.

---

# 19. EXEMPLO REAL DO PROJETO

Cadastrar inicialmente apenas como exemplo/template, não como dados obrigatórios do usuário:

### Agosto/2026

Mudança para Indaiatuba.

Moradia passa de aproximadamente R$ 1.500 para aproximadamente R$ 3.500.

---

### Setembro/2026

Nascimento da Sofia.

Adicionar custos planejados de bebê.

---

### Março/2027

Fim da bolsa de R$ 3.200.

A receita deixa de existir.

---

### Fevereiro/2027

PLR extraordinária de R$ 20.000.

---

### Agosto/2027

PLR extraordinária de R$ 20.000.

---

# 20. MOTOR DE PROJEÇÃO

Criar um serviço isolado:

projectionEngine.ts

Esse serviço recebe:

* cenário

* data inicial

* data final

* patrimônio inicial

* receitas planejadas

* despesas planejadas

* eventos

* rentabilidade

E retorna:

ProjectionMonth[]

Cada mês deve conter:

* month

* recurringIncome

* extraordinaryIncome

* totalIncome

* essentialExpenses

* discretionaryExpenses

* totalExpenses

* monthlyCashFlow

* plannedInvestment

* investmentReturn

* endingNetWorth

* bridgeReserveBalance

---

# 21. REGRA FUNDAMENTAL DO FLUXO

Para cada mês:

totalIncome =

recurringIncome + extraordinaryIncome

cashFlow =

totalIncome - totalExpenses

netWorthEnd =

netWorthStart + cashFlow + investmentReturn

Não contar investimento como despesa.

Transferência entre contas não é despesa.

Transferência para investimento não reduz patrimônio.

Ela apenas altera a composição do patrimônio.

---

# 22. RENTABILIDADE

Permitir configurar:

"Rentabilidade média mensal esperada"

Default:

0,8% ao mês.

Não usar 1% como promessa.

Mostrar claramente:

"premissa de rentabilidade".

Calcular:

investmentReturn =

investedBalanceStartOfMonth * monthlyRate

Permitir desligar a rentabilidade para uma projeção conservadora.

---

# 23. PROJEÇÃO CONSERVADORA

Criar três modos:

### Conservador

Sem rentabilidade.

### Base

Rentabilidade configurada pelo usuário.

### Otimista

Rentabilidade configurada pelo usuário + crescimento de renda.

Não apresentar isso como previsão certa.

Sempre chamar de:

"Projeção baseada nas premissas informadas."

---

# 24. RESERVA DE EMERGÊNCIA

Criar configuração:

"Meses de custo essencial desejados"

Default:

6 meses.

Calcular:

essentialMonthlyCost =

média das despesas essenciais planejadas

emergencyFundTarget =

essentialMonthlyCost * emergencyMonths

Mostrar:

Reserva atual

Meta

Percentual atingido

---

# 25. RESERVA PONTE

Criar um conceito específico:

# Reserva Ponte

É uma reserva destinada a cobrir temporariamente a perda de uma receita recorrente.

Exemplo:

Bolsa termina.

A reserva ponte cobre a diferença entre:

despesas planejadas

e

receita recorrente.

---

## Regras

O usuário pode criar uma reserva ponte associada a uma receita temporária.

Exemplo:

Bolsa:

R$ 3.200

Fim:

Março/2027

Se em determinado mês:

Receita recorrente = R$ 7.185

Despesas = R$ 8.500

Déficit = R$ 1.315

E a reserva ponte tiver saldo:

R$ 8.000

Então:

BridgeReserve =

R$ 8.000 - R$ 1.315

=

R$ 6.685

---

# 26. DEPENDÊNCIA DE RENDA TEMPORÁRIA

Mostrar indicador:

Temporary Income Dependency

Fórmula:

temporaryIncome / totalIncome

Exemplo:

R$ 3.200 / R$ 10.385

= 30,8%

Mostrar:

"31% da sua renda atual depende de fontes temporárias."

---

# 27. CUSTO DE VIDA

Criar três indicadores:

### Custo total

Todas as despesas.

### Custo essencial

Somente essenciais.

### Custo discricionário

Total - essenciais.

Isso permite responder:

"Quanto custa manter minha vida?"

e

"Quanto custa sobreviver se eu precisar cortar tudo?"

---

# 28. TAXA DE POUPANÇA

Fórmula:

(totalIncome - totalExpenses) / totalIncome

Mostrar mensal e anual.

---

# 29. TAXA DE INVESTIMENTO

Fórmula:

newInvestments / totalIncome

Não confundir com taxa de poupança.

---

# 30. DASHBOARD DE PLANEJAMENTO

Mostrar:

## Patrimônio projetado

Gráfico:

histórico real → linha contínua

projeção → linha pontilhada

---

## Fluxo de caixa

Barras:

receita

despesa

saldo

---

## Receita

Stacked bar:

recorrente

extraordinária

temporária

---

## Despesas

Stacked:

essencial

discricionária

---

## Eventos

Timeline horizontal.

Exemplo:

AGO/26

Mudança

SET/26

Sofia nasce

MAR/27

Bolsa termina

FEV/27

PLR

AGO/27

PLR

---

# 31. SIMULADOR DE CENÁRIOS

Criar uma tela:

# Cenários

Permitir selecionar 2 a 4 cenários.

Comparar:

* patrimônio final

* renda total

* despesas totais

* média mensal

* taxa de poupança

* meses em déficit

* reserva de emergência

* reserva ponte

* patrimônio mínimo

* patrimônio máximo

Mostrar gráfico comparativo.

---

# 32. WHAT-IF

Permitir editar rapidamente variáveis:

"Aluguel"

R$ 3.500

slider/input:

R$ 2.000 → R$ 6.000

Ao mudar:

recalcular imediatamente:

* fluxo mensal

* patrimônio final

* taxa de poupança

Não salvar automaticamente.

Tratar como simulação temporária.

Botão:

"Salvar como cenário".

---

# 33. METAS FINANCEIRAS

Criar:

Goal

Campos:

* name

* targetAmount

* currentAmount

* targetDate

* priority

* category

Exemplos:

* Reserva de emergência

* Canadá

* Entrada imóvel

* Viagem

* Patrimônio de R$ 500 mil

Calcular:

monthlyRequiredContribution

para atingir a meta.

---

# 34. INTELIGÊNCIA SEM IA

Criar um mecanismo de regras chamado:

FinancialInsightsEngine

Ele recebe os dados reais + planejamento.

E produz insights determinísticos.

Exemplos:

### Insight 1

Se despesas > receitas recorrentes:

"Seu orçamento atual depende de receitas temporárias."

---

### Insight 2

Se moradia > 35% da receita recorrente:

"Moradia representa mais de 35% da sua renda recorrente."

---

### Insight 3

Se taxa de poupança < 10%:

"Sua taxa de poupança está abaixo de 10%."

---

### Insight 4

Se patrimônio cresceu:

"Seu patrimônio cresceu R$ X no período."

---

### Insight 5

Se categoria aumentou >20% versus média de 6 meses:

"Seus gastos com X aumentaram 23% acima da média recente."

---

### Insight 6

Se receita temporária termina nos próximos 6 meses:

"Uma fonte de renda de R$ X/mês termina em Y meses."

---

### Insight 7

Se reserva de emergência < meta:

"Sua reserva cobre X meses do custo essencial."

---

### Insight 8

Se há déficit projetado:

"O cenário apresenta déficit de R$ X no mês Y."

---

# 35. HEALTH SCORE

Criar um score financeiro de 0–100.

Não usar machine learning.

Fórmula transparente.

Componentes:

### Reserva de emergência — 25 pontos

0 pontos = nenhuma reserva

25 = >= meta

Linear entre os extremos.

---

### Fluxo recorrente — 25 pontos

25 = receita recorrente >= despesas

Menor conforme aumenta o déficit.

---

### Taxa de poupança — 20 pontos

20 = >= 30%

15 = 20%

10 = 10%

5 = 5%

0 = <= 0%

---

### Dependência de renda temporária — 15 pontos

15 = nenhuma

10 = <= 10%

5 = <= 25%

0 = > 50%

---

### Crescimento patrimonial — 15 pontos

15 = crescimento consistente

10 = estável

5 = pequena redução

0 = redução relevante

Mostrar sempre como:

"Score calculado a partir das suas configurações."

Não fingir que é uma métrica financeira universal.

---

# 36. RELATÓRIO MENSAL

Ao fechar o mês, gerar automaticamente:

## Resumo

"Você recebeu R$ X e gastou R$ Y."

## Patrimônio

"Seu patrimônio variou R$ X."

## Destaques

Top 3 maiores categorias.

## Comparação

Comparar com:

* mês anterior

* média dos últimos 3 meses

* média dos últimos 6 meses

## Planejamento

Comparar:

realizado vs planejado.

Exemplo:

Mercado

Planejado: R$ 1.600

Realizado: R$ 1.830

Desvio: +14,4%

---

# 37. ORÇAMENTO VS REALIZADO

Cada categoria planejada deve ser comparada com o fechamento real.

Mostrar:

budget

actual

variance

variancePercent

Exemplo:

Moradia

Planejado: R$ 3.500

Real: R$ 3.480

→ dentro do orçamento

---

# 38. PATRIMÔNIO

Permitir registrar:

* conta corrente

* poupança

* investimentos

* renda fixa

* ações

* fundos

* previdência

* bens

* dívidas

Separar:

Assets

Liabilities

Net Worth

Fórmula:

NetWorth =

TotalAssets - TotalLiabilities

---

# 39. IMPORTANTE: NÃO DUPLICAR PATRIMÔNIO

Se o usuário importa uma transação de:

"Transferência para investimento"

não considerar como despesa.

Se:

Conta corrente -R$ 10.000

Investimento +R$ 10.000

Patrimônio não muda.

Apenas a alocação muda.

---

# 40. CONFIGURAÇÕES

Permitir:

* moeda

* primeiro dia do mês

* categorias

* regras de categorização

* rentabilidade esperada

* meses de reserva

* categorias essenciais

* metas

* tema

* preferências de dashboard

---

# 41. EXPERIÊNCIA DE PRIMEIRO ACESSO

Criar onboarding.

Perguntar:

1. Qual seu patrimônio atual?

2. Qual sua renda mensal?

3. Quais suas principais despesas?

4. Quanto deseja manter como reserva?

5. Possui receitas temporárias?

6. Possui alguma meta financeira?

Depois criar automaticamente:

* cenário "Atual"

* orçamento inicial

* dashboard

* meta de reserva de emergência

Não exigir que o usuário configure 50 campos antes de ver valor.

---

# 42. PRIVACIDADE

Dados financeiros são sensíveis.

Implementar:

* autenticação Supabase

* Row Level Security

* cada usuário só acessa seus próprios dados

* nenhum dado financeiro deve ser público

* não enviar dados financeiros para APIs externas

Como não haverá IA nesta versão, **nenhum dado financeiro deve sair do Supabase/browser para serviços externos**.

---

# 43. PERFORMANCE

Não recalcular toda a projeção em cada render.

Criar funções puras e memoização onde fizer sentido.

O projection engine deve ser independente da UI.

Idealmente:

```text

domain/

  projectionEngine.ts

  financialMetrics.ts

  insightEngine.ts

  scenarioEngine.ts

  goalEngine.ts

```

A UI apenas consome os resultados.

---

# 44. ARQUITETURA SUGERIDA

Organizar aproximadamente:

```text

src/

components/

  dashboard/

  transactions/

  closures/

  planning/

  scenarios/

  net-worth/

  goals/

  reports/

  layout/

domain/

  projectionEngine.ts

  financialMetrics.ts

  insightEngine.ts

  scenarioEngine.ts

  goalEngine.ts

  budgetEngine.ts

hooks/

  useTransactions.ts

  useClosures.ts

  usePlanning.ts

  useScenarios.ts

  useNetWorth.ts

  useGoals.ts

pages/

  Dashboard.tsx

  Transactions.tsx

  Closures.tsx

  ClosureDetail.tsx

  Planning.tsx

  Scenarios.tsx

  NetWorth.tsx

  Reports.tsx

  Settings.tsx

```

Não precisa seguir literalmente se houver uma arquitetura melhor, mas manter a separação de responsabilidades.

---

# 45. DADOS REAIS VS PLANEJADOS

Essa distinção é absolutamente obrigatória.

Usar nomenclatura visual:

REAL

PLANEJADO

PROJETADO

Nunca misturar silenciosamente.

Por exemplo:

Patrimônio:

R$ 200.000 REAL

→ R$ 247.000 PROJETADO

---

# 46. EXEMPLO DE PROJEÇÃO

Se:

Patrimônio inicial = R$ 200.000

Receita recorrente = R$ 7.185

Despesa = R$ 8.500

Então:

fluxo = -R$ 1.315

Se não houver outra fonte:

patrimônio diminui R$ 1.315.

Se houver bolsa de R$ 3.200:

receita total = R$ 10.385

fluxo = R$ 1.885

Esse valor aumenta o patrimônio, salvo se o usuário configurar uma regra específica de alocação.

---

# 47. ALOCAÇÃO DE SOBRAS

Permitir configurar:

"Quando houver sobra mensal, o que fazer?"

Opções:

* manter em caixa

* investir

* dividir percentual

Exemplo:

80% investir

20% caixa

---

# 48. ALOCAÇÃO DE PLR

Permitir configurar separadamente:

PLR:

100% investir

ou

70% investir

30% meta Canadá

Isso não deve ser hardcoded.

---

# 49. RESUMO EXECUTIVO

No topo do dashboard mostrar algo semelhante a:

```text

Patrimônio

R$ 200.000

+ R$ 3.850 este mês

Receita recorrente

R$ 7.185

Despesas planejadas

R$ 8.500

Gap mensal

-R$ 1.315

Reserva

8,2 meses

Health score

87

```

E abaixo:

"Seu cenário atual é sustentável com a reserva ponte configurada."

Esse texto deve vir do FinancialInsightsEngine, não de IA.

---

# 50. PRINCÍPIOS DE PRODUTO

O aplicativo NÃO deve:

* tentar parecer uma planilha

* mostrar dezenas de números simultaneamente

* usar IA para matemática

* inventar previsões

* tratar projeção como certeza

* misturar receita extraordinária com renda recorrente

* tratar transferência entre contas como despesa

* misturar patrimônio com fluxo de caixa

* esconder premissas dos cálculos

O aplicativo DEVE:

* ser extremamente claro

* mostrar premissas

* permitir edição rápida

* permitir simulações

* preservar histórico

* distinguir real vs planejado vs projetado

* explicar os cálculos

* ser útil mesmo sem planejamento avançado

* funcionar perfeitamente no mobile

---

# 51. MVP — IMPLEMENTAÇÃO EM FASES

Não tente construir tudo em uma única etapa.

Implemente nesta ordem:

## FASE 1

Fundação:

* autenticação

* banco

* layout

* dashboard

* categorias

* receitas

* despesas

* patrimônio

* transações

* fechamento mensal

* importação CSV

## FASE 2

Planejamento:

* cenários

* receitas planejadas

* despesas planejadas

* orçamento

* projection engine

## FASE 3

Inteligência determinística:

* insights

* health score

* comparação real vs planejado

* dependência de renda temporária

* reserva de emergência

* reserva ponte

## FASE 4

Planejamento avançado:

* eventos

* metas

* timeline

* what-if

* comparação de cenários

## FASE 5

Relatórios:

* relatório mensal

* gráficos

* exportação PDF

* resumo executivo

---

# 52. CRITÉRIOS DE ACEITAÇÃO

Antes de considerar a aplicação pronta, verificar:

1. Posso importar minhas transações.

2. Posso categorizar automaticamente.

3. Posso corrigir categorias.

4. Posso fechar um mês.

5. Posso visualizar histórico.

6. Posso visualizar patrimônio.

7. Posso criar receitas futuras.

8. Posso criar despesas futuras.

9. Posso criar cenários.

10. Posso duplicar cenários.

11. Posso simular mudanças sem salvar.

12. Posso salvar uma simulação como cenário.

13. Posso criar eventos futuros.

14. O fim de uma receita realmente altera a projeção.

15. Uma PLR aparece como receita extraordinária.

16. Transferências não alteram patrimônio líquido.

17. Posso configurar rentabilidade.

18. Posso configurar reserva de emergência.

19. Posso criar reserva ponte.

20. O sistema mostra dependência de renda temporária.

21. O sistema calcula taxa de poupança.

22. O sistema calcula taxa de investimento.

23. O sistema calcula custo essencial.

24. O sistema calcula Health Score.

25. O sistema compara realizado vs planejado.

26. O sistema mostra patrimônio histórico + projetado.

27. O sistema funciona sem nenhuma API de IA.

28. Os dados de um usuário nunca aparecem para outro usuário.

29. Todos os valores monetários usam pt-BR e BRL.

30. O layout funciona perfeitamente em desktop e mobile.

---

# 53. MUITO IMPORTANTE SOBRE IMPLEMENTAÇÃO

Não gerar dados financeiros fictícios como se fossem dados reais do usuário.

Se precisar de dados para demonstrar componentes durante desenvolvimento, usar claramente "dados de demonstração" e permitir removê-los.

Não alterar silenciosamente regras financeiras existentes.

Não implementar features parcialmente e declarar concluído.

Antes de cada fase, verificar se o código compila e se não há erros TypeScript.

Priorizar qualidade da arquitetura e consistência dos cálculos em vez de quantidade de features.

Começar pela FASE 1.

Depois de finalizar a FASE 1, apresentar um resumo do que foi implementado e aguardar meu próximo comando antes de iniciar a FASE 2.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://belchior-financial-planning.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a9de9eab-54bc-4827-b927-c9e5278b95bf).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
