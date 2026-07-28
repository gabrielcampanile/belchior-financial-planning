CREATE TABLE public.scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  base_currency currency_code NOT NULL DEFAULT 'BRL'::currency_code,
  start_month DATE NOT NULL DEFAULT date_trunc('month', now())::date,
  horizon_months INTEGER NOT NULL DEFAULT 60,
  expected_monthly_return NUMERIC NOT NULL DEFAULT 0.008,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scenarios TO authenticated;
GRANT ALL ON public.scenarios TO service_role;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own scenarios" ON public.scenarios FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.income_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scenario_id UUID NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'SALARY',
  nature TEXT NOT NULL DEFAULT 'RECURRING',
  amount_cents BIGINT NOT NULL DEFAULT 0,
  currency currency_code NOT NULL DEFAULT 'BRL'::currency_code,
  frequency TEXT NOT NULL DEFAULT 'MONTHLY',
  months_of_year SMALLINT[] NOT NULL DEFAULT '{}',
  start_date DATE NOT NULL DEFAULT date_trunc('month', now())::date,
  end_date DATE,
  annual_adjustment_percent NUMERIC NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.income_plans TO authenticated;
GRANT ALL ON public.income_plans TO service_role;
ALTER TABLE public.income_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own income plans" ON public.income_plans FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.expense_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scenario_id UUID NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  amount_cents BIGINT NOT NULL DEFAULT 0,
  currency currency_code NOT NULL DEFAULT 'BRL'::currency_code,
  frequency TEXT NOT NULL DEFAULT 'MONTHLY',
  months_of_year SMALLINT[] NOT NULL DEFAULT '{}',
  start_date DATE NOT NULL DEFAULT date_trunc('month', now())::date,
  end_date DATE,
  annual_adjustment_percent NUMERIC NOT NULL DEFAULT 0,
  essential BOOLEAN NOT NULL DEFAULT false,
  enabled BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_plans TO authenticated;
GRANT ALL ON public.expense_plans TO service_role;
ALTER TABLE public.expense_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own expense plans" ON public.expense_plans FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_income_plans_scenario ON public.income_plans(scenario_id);
CREATE INDEX idx_expense_plans_scenario ON public.expense_plans(scenario_id);
CREATE INDEX idx_scenarios_user ON public.scenarios(user_id);

CREATE TRIGGER scenarios_updated_at BEFORE UPDATE ON public.scenarios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER income_plans_updated_at BEFORE UPDATE ON public.income_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER expense_plans_updated_at BEFORE UPDATE ON public.expense_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.duplicate_scenario(_scenario_id UUID, _name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
  uid UUID := auth.uid();
BEGIN
  INSERT INTO public.scenarios (user_id, name, description, is_default, base_currency, start_month, horizon_months, expected_monthly_return)
  SELECT user_id, _name, description, false, base_currency, start_month, horizon_months, expected_monthly_return
  FROM public.scenarios WHERE id = _scenario_id AND user_id = uid
  RETURNING id INTO new_id;

  IF new_id IS NULL THEN RAISE EXCEPTION 'Scenario not found'; END IF;

  INSERT INTO public.income_plans (user_id, scenario_id, name, type, nature, amount_cents, currency, frequency, months_of_year, start_date, end_date, annual_adjustment_percent, enabled, notes)
  SELECT user_id, new_id, name, type, nature, amount_cents, currency, frequency, months_of_year, start_date, end_date, annual_adjustment_percent, enabled, notes
  FROM public.income_plans WHERE scenario_id = _scenario_id AND user_id = uid;

  INSERT INTO public.expense_plans (user_id, scenario_id, category_id, name, amount_cents, currency, frequency, months_of_year, start_date, end_date, annual_adjustment_percent, essential, enabled, notes)
  SELECT user_id, new_id, category_id, name, amount_cents, currency, frequency, months_of_year, start_date, end_date, annual_adjustment_percent, essential, enabled, notes
  FROM public.expense_plans WHERE scenario_id = _scenario_id AND user_id = uid;

  RETURN new_id;
END; $$;