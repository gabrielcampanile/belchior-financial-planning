import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CURRENCY_CODES } from "@/domain/currency";

const SOURCE = "open.er-api.com";

/**
 * Busca as cotações do dia e grava uma linha por par/dia.
 * Nunca sobrescreve datas passadas — o histórico permanece imutável.
 */
export const refreshExchangeRates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("exchange_rates")
      .select("id")
      .eq("effective_on", today)
      .limit(1);
    if (existing && existing.length > 0) {
      return { updated: false, effectiveOn: today, pairs: 0 };
    }

    const response = await fetch("https://open.er-api.com/v6/latest/BRL");
    if (!response.ok) throw new Error("Fonte de cotações indisponível.");
    const payload = (await response.json()) as { rates?: Record<string, number> };
    const rates = payload.rates ?? {};

    const rows = CURRENCY_CODES.filter((code) => code !== "BRL" && Number.isFinite(rates[code])).map(
      (code) => ({
        base_currency: "BRL",
        quote_currency: code,
        rate: rates[code],
        effective_on: today,
        source: SOURCE,
      }),
    );
    if (rows.length === 0) throw new Error("Nenhuma cotação retornada pela fonte.");

    const { error } = await supabaseAdmin
      .from("exchange_rates")
      .upsert(rows, { onConflict: "base_currency,quote_currency,effective_on" });
    if (error) throw new Error(error.message);

    return { updated: true, effectiveOn: today, pairs: rows.length };
  });
