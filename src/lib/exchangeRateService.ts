import { supabase } from "@/integrations/supabase/client";
import { toCurrencyCode } from "@/domain/currency";
import type { ExchangeRate } from "@/domain/exchange";

/**
 * Camada isolada de cotações. A fonte pode ser trocada sem tocar no domínio.
 * Leitura: tabela `exchange_rates` (RLS: leitura para usuários autenticados).
 * Escrita: apenas o servidor (`refreshExchangeRates`).
 */
export async function fetchExchangeRates(): Promise<ExchangeRate[]> {
  const { data, error } = await supabase
    .from("exchange_rates")
    .select("base_currency, quote_currency, rate, effective_on, source")
    .order("effective_on", { ascending: true })
    .limit(5000);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    base: toCurrencyCode(row.base_currency),
    quote: toCurrencyCode(row.quote_currency),
    rate: Number(row.rate),
    effectiveOn: String(row.effective_on),
    source: String(row.source ?? "unknown"),
  }));
}
