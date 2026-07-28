-- helpers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'BRL',
  theme TEXT NOT NULL DEFAULT 'dark',
  first_day_of_month INT NOT NULL DEFAULT 1,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER t_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- settings
CREATE TABLE public.settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  expected_monthly_return NUMERIC(6,4) NOT NULL DEFAULT 0.008,
  emergency_months INT NOT NULL DEFAULT 6,
  surplus_invest_percent INT NOT NULL DEFAULT 80,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings" ON public.settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER t_settings_updated BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'EXPENSE' CHECK (kind IN ('EXPENSE','INCOME','INVESTMENT','TRANSFER')),
  essential BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  color TEXT,
  icon TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own categories" ON public.categories FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_categories_user ON public.categories(user_id, parent_id, sort_order);
CREATE TRIGGER t_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- categorization rules
CREATE TABLE public.categorization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  pattern TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'CONTAINS' CHECK (match_type IN ('CONTAINS','STARTS_WITH','EQUALS','REGEX')),
  priority INT NOT NULL DEFAULT 100,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL DEFAULT 'EXPENSE' CHECK (target_type IN ('EXPENSE','INCOME','TRANSFER','INVESTMENT_CONTRIBUTION')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorization_rules TO authenticated;
GRANT ALL ON public.categorization_rules TO service_role;
ALTER TABLE public.categorization_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rules" ON public.categorization_rules FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER t_rules_updated BEFORE UPDATE ON public.categorization_rules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- accounts
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'CHECKING' CHECK (type IN ('CHECKING','SAVINGS','INVESTMENT','FIXED_INCOME','STOCKS','FUNDS','PENSION','PROPERTY','OTHER_ASSET','DEBT')),
  side TEXT NOT NULL DEFAULT 'ASSET' CHECK (side IN ('ASSET','LIABILITY')),
  liquid BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own accounts" ON public.accounts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER t_accounts_updated BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- account balances (monthly snapshots)
CREATE TABLE public.account_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  balance_cents BIGINT NOT NULL DEFAULT 0,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_balances TO authenticated;
GRANT ALL ON public.account_balances TO service_role;
ALTER TABLE public.account_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own balances" ON public.account_balances FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_balances_user_month ON public.account_balances(user_id, month);
CREATE TRIGGER t_balances_updated BEFORE UPDATE ON public.account_balances FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- closures
CREATE TABLE public.closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  month DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED')),
  totals JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  closed_at TIMESTAMPTZ,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.closures TO authenticated;
GRANT ALL ON public.closures TO service_role;
ALTER TABLE public.closures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own closures" ON public.closures FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER t_closures_updated BEFORE UPDATE ON public.closures FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  occurred_on DATE NOT NULL,
  description TEXT NOT NULL,
  amount_cents BIGINT NOT NULL,
  type TEXT NOT NULL DEFAULT 'EXPENSE' CHECK (type IN ('EXPENSE','INCOME','TRANSFER','INVESTMENT_CONTRIBUTION')),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  closure_id UUID REFERENCES public.closures(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('MANUAL','IMPORT','DEMO')),
  dedupe_hash TEXT NOT NULL,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, dedupe_hash)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own transactions" ON public.transactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_tx_user_date ON public.transactions(user_id, occurred_on DESC);
CREATE TRIGGER t_tx_updated BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- real income entries
CREATE TABLE public.income_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  month DATE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'SALARY' CHECK (type IN ('SALARY','VR','BENEFIT','SCHOLARSHIP','BONUS','PLR','FREELANCE','INVESTMENT_INCOME','OTHER')),
  nature TEXT NOT NULL DEFAULT 'RECURRING' CHECK (nature IN ('RECURRING','TEMPORARY','EXTRAORDINARY')),
  amount_cents BIGINT NOT NULL DEFAULT 0,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.income_entries TO authenticated;
GRANT ALL ON public.income_entries TO service_role;
ALTER TABLE public.income_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own income" ON public.income_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_income_user_month ON public.income_entries(user_id, month);
CREATE TRIGGER t_income_updated BEFORE UPDATE ON public.income_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- import profiles
CREATE TABLE public.import_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.import_profiles TO authenticated;
GRANT ALL ON public.import_profiles TO service_role;
ALTER TABLE public.import_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own import profiles" ON public.import_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER t_import_updated BEFORE UPDATE ON public.import_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- seed defaults for a new user
CREATE OR REPLACE FUNCTION public.seed_defaults(_uid UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  grp RECORD;
  parent UUID;
  sub TEXT;
  i INT := 0;
  j INT;
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

  -- starter categorization rules
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
    ('XP INVESTIMENTOS', 5, 'Investimentos', 'INVESTMENT_CONTRIBUTION')
  ) AS r(pattern, priority, cat, target)
  JOIN public.categories c ON c.user_id = _uid AND c.name = r.cat
  LIMIT 100;
END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.settings (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  PERFORM public.seed_defaults(NEW.id);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();