DO $$ BEGIN
  CREATE TYPE public.currency_code AS ENUM ('BRL','CAD','USD','EUR','ARS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS currency public.currency_code NOT NULL DEFAULT 'BRL';
ALTER TABLE public.income_entries ADD COLUMN IF NOT EXISTS currency public.currency_code NOT NULL DEFAULT 'BRL';
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS currency public.currency_code NOT NULL DEFAULT 'BRL';
ALTER TABLE public.account_balances ADD COLUMN IF NOT EXISTS currency public.currency_code NOT NULL DEFAULT 'BRL';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_currency public.currency_code NOT NULL DEFAULT 'BRL';

CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency public.currency_code NOT NULL,
  quote_currency public.currency_code NOT NULL,
  rate numeric(20,10) NOT NULL,
  effective_on date NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exchange_rates_unique_pair_day UNIQUE (base_currency, quote_currency, effective_on),
  CONSTRAINT exchange_rates_rate_positive CHECK (rate > 0)
);

GRANT SELECT ON public.exchange_rates TO authenticated;
GRANT ALL ON public.exchange_rates TO service_role;

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can read rates" ON public.exchange_rates
  FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS exchange_rates_lookup_idx
  ON public.exchange_rates (base_currency, quote_currency, effective_on DESC);

DROP TRIGGER IF EXISTS set_exchange_rates_updated_at ON public.exchange_rates;
CREATE TRIGGER set_exchange_rates_updated_at
  BEFORE UPDATE ON public.exchange_rates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();