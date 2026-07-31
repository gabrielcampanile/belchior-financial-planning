-- 1. Novas colunas em transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS income_type text NOT NULL DEFAULT 'OTHER',
  ADD COLUMN IF NOT EXISTS income_nature text NOT NULL DEFAULT 'RECURRING';

-- 2. Categorias de receita para usuários existentes
INSERT INTO public.categories (user_id, name, kind, essential, sort_order)
SELECT p.id, c.name, 'INCOME', false, c.ord
FROM public.profiles p
CROSS JOIN (VALUES
  ('Salário', 510),
  ('VR/VA', 520),
  ('Benefício', 530),
  ('Bolsa', 540),
  ('Bônus', 550),
  ('PLR', 560),
  ('Freelance', 570),
  ('Rendimentos', 580),
  ('Aluguel recebido', 590),
  ('Outras receitas', 600)
) AS c(name, ord)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories x
  WHERE x.user_id = p.id AND x.kind = 'INCOME' AND x.name = c.name
);

-- 3. Migrar income_entries -> transactions
INSERT INTO public.transactions (
  user_id, occurred_on, description, amount_cents, currency, type,
  category_id, source, dedupe_hash, notes, is_demo, income_type, income_nature, created_at
)
SELECT
  e.user_id,
  e.month::date,
  e.name,
  abs(e.amount_cents),
  e.currency,
  'INCOME',
  cat.id,
  CASE WHEN e.is_demo THEN 'DEMO' ELSE 'MANUAL' END,
  'inc' || replace(e.id::text, '-', ''),
  e.notes,
  e.is_demo,
  e.type,
  e.nature,
  e.created_at
FROM public.income_entries e
LEFT JOIN LATERAL (
  SELECT x.id FROM public.categories x
  WHERE x.user_id = e.user_id AND x.kind = 'INCOME'
    AND x.name = CASE e.type
      WHEN 'SALARY' THEN 'Salário'
      WHEN 'VR' THEN 'VR/VA'
      WHEN 'BENEFIT' THEN 'Benefício'
      WHEN 'SCHOLARSHIP' THEN 'Bolsa'
      WHEN 'BONUS' THEN 'Bônus'
      WHEN 'PLR' THEN 'PLR'
      WHEN 'FREELANCE' THEN 'Freelance'
      WHEN 'INVESTMENT_INCOME' THEN 'Rendimentos'
      ELSE 'Outras receitas'
    END
  LIMIT 1
) cat ON true
ON CONFLICT (user_id, dedupe_hash) DO NOTHING;

-- 4. Remover tabela de receitas manuais
DROP TABLE IF EXISTS public.income_entries;

-- 5. seed_defaults passa a criar categorias de receita
CREATE OR REPLACE FUNCTION public.seed_defaults(_uid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  grp RECORD;
  parent UUID;
  sub TEXT;
  i INT := 0;
  j INT;
  inc RECORD;
  groups JSONB := '[
    {"n":"Moradia","e":true,"s":["Aluguel","Condomínio","IPTU","Energia","Água","Gás","Internet","Manutenção"]},
    {"n":"Alimentação","e":true,"s":["Mercado","Restaurante","Delivery","Café","Alimentação"]},
    {"n":"Transporte","e":true,"s":["Gasolina","Estacionamento","Pedágio","Uber","Transporte público","Manutenção","Seguro","IPVA"]},
    {"n":"Saúde","e":true,"s":["Plano de saúde","Consulta","Exame","Farmácia","Terapia","Academia"]},
    {"n":"Família","e":true,"s":["Bebê","Filhos","Presentes","Família"]},
    {"n":"Lazer","e":false,"s":["Viagens","Entretenimento","Hobbies","Bares","Restaurantes"]},
    {"n":"Assinaturas","e":false,"s":["Streaming","Software","Serviços"]},
    {"n":"Compras","e":false,"s":["Roupas","Eletrônicos","Casa","Outros"]},
    {"n":"Investimentos","e":false,"s":[]},
    {"n":"Impostos","e":true,"s":[]},
    {"n":"Outros","e":false,"s":[]}
  ]'::jsonb;
BEGIN
  IF EXISTS (SELECT 1 FROM public.categories WHERE user_id = _uid) THEN RETURN; END IF;

  FOR grp IN SELECT * FROM jsonb_array_elements(groups) AS g(v) LOOP
    i := i + 1;
    INSERT INTO public.categories (user_id, name, essential, sort_order, kind)
    VALUES (_uid, grp.v->>'n', (grp.v->>'e')::boolean, i * 10,
      CASE WHEN grp.v->>'n' = 'Investimentos' THEN 'INVESTMENT' ELSE 'EXPENSE' END)
    RETURNING id INTO parent;

    j := 0;
    FOR sub IN SELECT jsonb_array_elements_text(grp.v->'s') LOOP
      j := j + 1;
      INSERT INTO public.categories (user_id, parent_id, name, essential, sort_order, kind)
      VALUES (_uid, parent, sub, (grp.v->>'e')::boolean, j * 10, 'EXPENSE');
    END LOOP;
  END LOOP;

  FOR inc IN SELECT * FROM (VALUES
    ('Salário', 510), ('VR/VA', 520), ('Benefício', 530), ('Bolsa', 540),
    ('Bônus', 550), ('PLR', 560), ('Freelance', 570), ('Rendimentos', 580),
    ('Aluguel recebido', 590), ('Outras receitas', 600)
  ) AS v(name, ord) LOOP
    INSERT INTO public.categories (user_id, name, essential, sort_order, kind)
    VALUES (_uid, inc.name, false, inc.ord, 'INCOME');
  END LOOP;

  INSERT INTO public.categorization_rules (user_id, pattern, priority, category_id, target_type)
  SELECT _uid, r.pattern, r.priority, c.id, r.target
  FROM (VALUES
    ('UBER', 10, 'Uber', 'EXPENSE'),
    ('99APP', 11, 'Uber', 'EXPENSE'),
    ('SUPERMERCADO', 20, 'Mercado', 'EXPENSE'),
    ('MERCADO', 21, 'Mercado', 'EXPENSE'),
    ('IFOOD', 30, 'Delivery', 'EXPENSE'),
    ('RAPPI', 31, 'Delivery', 'EXPENSE'),
    ('POSTO', 40, 'Gasolina', 'EXPENSE'),
    ('SHELL', 41, 'Gasolina', 'EXPENSE'),
    ('DROGARIA', 50, 'Farmácia', 'EXPENSE'),
    ('FARMACIA', 51, 'Farmácia', 'EXPENSE'),
    ('NETFLIX', 60, 'Streaming', 'EXPENSE'),
    ('SPOTIFY', 61, 'Streaming', 'EXPENSE'),
    ('ALUGUEL', 70, 'Aluguel', 'EXPENSE'),
    ('CONDOMINIO', 71, 'Condomínio', 'EXPENSE'),
    ('ENERGIA', 72, 'Energia', 'EXPENSE'),
    ('VIVO', 73, 'Internet', 'EXPENSE'),
    ('XP INVESTIMENTOS', 5, 'Investimentos', 'INVESTMENT_CONTRIBUTION'),
    ('SALARIO', 1, 'Salário', 'INCOME'),
    ('PAGAMENTO SALARIO', 2, 'Salário', 'INCOME'),
    ('PIX RECEBIDO', 90, 'Outras receitas', 'INCOME'),
    ('RENDIMENTO', 6, 'Rendimentos', 'INCOME')
  ) AS r(pattern, priority, cat, target)
  JOIN public.categories c ON c.user_id = _uid AND c.name = r.cat
  LIMIT 100;
END; $function$;