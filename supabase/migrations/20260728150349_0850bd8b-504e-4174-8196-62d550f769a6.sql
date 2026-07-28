-- Remove duplicates before creating unique constraints
DELETE FROM public.account_balances a USING public.account_balances b
WHERE a.ctid < b.ctid AND a.user_id = b.user_id AND a.account_id = b.account_id AND a.month = b.month;

DELETE FROM public.transactions a USING public.transactions b
WHERE a.ctid < b.ctid AND a.user_id = b.user_id AND a.dedupe_hash = b.dedupe_hash;

DELETE FROM public.closures a USING public.closures b
WHERE a.ctid < b.ctid AND a.user_id = b.user_id AND a.month = b.month;

DELETE FROM public.exchange_rates a USING public.exchange_rates b
WHERE a.ctid < b.ctid AND a.base_currency = b.base_currency AND a.quote_currency = b.quote_currency AND a.effective_on = b.effective_on;

ALTER TABLE public.account_balances ADD CONSTRAINT account_balances_user_account_month_key UNIQUE (user_id, account_id, month);
ALTER TABLE public.transactions ADD CONSTRAINT transactions_user_dedupe_key UNIQUE (user_id, dedupe_hash);
ALTER TABLE public.closures ADD CONSTRAINT closures_user_month_key UNIQUE (user_id, month);
ALTER TABLE public.exchange_rates ADD CONSTRAINT exchange_rates_pair_date_key UNIQUE (base_currency, quote_currency, effective_on);