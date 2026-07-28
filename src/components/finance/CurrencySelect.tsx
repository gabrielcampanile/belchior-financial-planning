import { Coins } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCY_LIST, type CurrencyCode } from "@/domain/currency";
import { useCurrency } from "@/hooks/useCurrency";

/** Seletor global da moeda de visualização. Não altera nenhum dado armazenado. */
export function CurrencySelect({ className }: { className?: string }) {
  const { displayCurrency, setDisplayCurrency, isUpdating } = useCurrency();

  return (
    <Select
      value={displayCurrency}
      onValueChange={(v) => setDisplayCurrency(v as CurrencyCode)}
      disabled={isUpdating}
    >
      <SelectTrigger className={className ?? "h-9 w-[132px] text-xs"} aria-label="Moeda de visualização">
        <Coins className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCY_LIST.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.shortLabel} {c.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Seletor da moeda ORIGINAL de um lançamento (dado persistido). */
export function CurrencyField({
  value,
  onChange,
  disabled,
  className,
}: {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as CurrencyCode)} disabled={disabled}>
      <SelectTrigger className={className} aria-label="Moeda do lançamento">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCY_LIST.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.code} · {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
