import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState, PageHeader, Panel, SectionHeader, AssumptionNote } from "@/components/finance/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  detectDelimiter,
  importMappingSchema,
  mapRows,
  parseCsv,
  dedupeHash,
  type Delimiter,
  type ImportMapping,
} from "@/domain/csv";
import { applyRules } from "@/domain/categorizationEngine";
import { useCategories, useRules, useTransactions, useUpsert } from "@/hooks/useFinanceData";
import { formatCents } from "@/lib/format";
import { CURRENCY_LIST, DEFAULT_CURRENCY, type CurrencyCode } from "@/domain/currency";
import { formatDateBR } from "@/lib/months";

export const Route = createFileRoute("/importar")({
  head: () => ({
    meta: [
      { title: "Importar extrato CSV · Belchior" },
      {
        name: "description",
        content: "Importe extratos bancários em CSV com mapeamento de colunas, preview e deduplicação.",
      },
      { property: "og:title", content: "Importar extrato CSV · Belchior" },
      { property: "og:description", content: "Mapeie colunas, veja o preview e evite transações duplicadas." },
    ],
  }),
  component: ImportPage,
});

function ImportPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<string[][]>([]);
  const [delimiter, setDelimiter] = useState<Delimiter>(";");
  const [mapping, setMapping] = useState<ImportMapping>({
    dateColumn: 0,
    descriptionColumn: 1,
    amountColumn: 2,
    dateFormat: "DD/MM/YYYY",
    hasHeader: true,
    negativeIsExpense: true,
    currency: DEFAULT_CURRENCY,
    currencyColumn: null,
  });

  const { data: categories = [] } = useCategories();
  const { data: rules = [] } = useRules();
  const { data: existing = [] } = useTransactions();
  const upsert = useUpsert("transactions", "user_id,dedupe_hash");

  const columns = rows[0] ?? [];
  const result = useMemo(() => (rows.length ? mapRows(rows, mapping) : null), [rows, mapping]);
  const existingHashes = useMemo(() => new Set(existing.map((t) => t.dedupe_hash)), [existing]);

  const prepared = useMemo(() => {
    if (!result) return [];
    return result.parsed.map((row) => {
      const isExpense = mapping.negativeIsExpense ? row.amount_cents < 0 : row.amount_cents > 0;
      const match = applyRules(row.description, rules);
      const type = match?.type ?? (isExpense ? "EXPENSE" : "INCOME");
      const hash = dedupeHash(row.occurred_on, Math.abs(row.amount_cents), row.description, row.currency);
      return {
        occurred_on: row.occurred_on,
        description: row.description,
        amount_cents: Math.abs(row.amount_cents),
        currency: row.currency,
        type,
        category_id: match?.categoryId ?? null,
        source: "IMPORT",
        dedupe_hash: hash,
        duplicate: existingHashes.has(hash),
      };
    });
  }, [result, mapping.negativeIsExpense, rules, existingHashes]);

  const newRows = prepared.filter((r) => !r.duplicate);

  async function handleFile(file: File) {
    const text = await file.text();
    const detected = detectDelimiter(text.slice(0, 4000));
    setDelimiter(detected);
    setRows(parseCsv(text, detected));
  }

  async function confirmImport() {
    const parsedMapping = importMappingSchema.safeParse(mapping);
    if (!parsedMapping.success) {
      toast.error("Mapeamento inválido.");
      return;
    }
    if (!newRows.length) {
      toast.error("Nenhuma transação nova para importar.");
      return;
    }
    await upsert.mutateAsync(
      newRows.map(({ duplicate: _duplicate, ...row }) => row),
    );
    toast.success(`${newRows.length} transações importadas.`);
    navigate({ to: "/transacoes" });
  }

  return (
    <AppLayout>
      <PageHeader
        title="Importar extrato CSV"
        description="Nenhum dado sai do seu navegador antes da confirmação: o arquivo é lido localmente."
      />

      <Panel className="space-y-4">
        <SectionHeader title="1. Arquivo" description="Selecione o CSV exportado pelo seu banco." />
        <Input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        {rows.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            {rows.length} linhas lidas · delimitador detectado: <code>{delimiter === "\t" ? "TAB" : delimiter}</code>
          </p>
        ) : null}
      </Panel>

      {rows.length > 0 ? (
        <>
          <Panel className="space-y-4">
            <SectionHeader title="2. Mapeamento das colunas" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ColumnSelect
                label="Data"
                columns={columns}
                value={mapping.dateColumn}
                onChange={(v) => setMapping({ ...mapping, dateColumn: v })}
              />
              <ColumnSelect
                label="Descrição"
                columns={columns}
                value={mapping.descriptionColumn}
                onChange={(v) => setMapping({ ...mapping, descriptionColumn: v })}
              />
              <ColumnSelect
                label="Valor"
                columns={columns}
                value={mapping.amountColumn}
                onChange={(v) => setMapping({ ...mapping, amountColumn: v })}
              />
              <div className="grid gap-2">
                <Label>Formato de data</Label>
                <Select
                  value={mapping.dateFormat}
                  onValueChange={(v) =>
                    setMapping({ ...mapping, dateFormat: v as ImportMapping["dateFormat"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/AAAA</SelectItem>
                    <SelectItem value="YYYY-MM-DD">AAAA-MM-DD</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/AAAA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Moeda padrão do arquivo</Label>
                <Select
                  value={mapping.currency}
                  onValueChange={(v) => setMapping({ ...mapping, currency: v as CurrencyCode })}
                >
                  <SelectTrigger>
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
              </div>
              <div className="grid gap-2">
                <Label>Coluna de moeda (opcional)</Label>
                <Select
                  value={mapping.currencyColumn == null ? "none" : String(mapping.currencyColumn)}
                  onValueChange={(v) =>
                    setMapping({ ...mapping, currencyColumn: v === "none" ? null : Number(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem coluna — usar moeda padrão</SelectItem>
                    {columns.map((col, index) => (
                      <SelectItem key={index} value={String(index)}>
                        {col || `Coluna ${index + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <span className="text-sm">Primeira linha é cabeçalho</span>
                <Switch
                  checked={mapping.hasHeader}
                  onCheckedChange={(v) => setMapping({ ...mapping, hasHeader: v })}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <span className="text-sm">Valor negativo é despesa</span>
                <Switch
                  checked={mapping.negativeIsExpense}
                  onCheckedChange={(v) => setMapping({ ...mapping, negativeIsExpense: v })}
                />
              </div>
            </div>
          </Panel>

          <Panel className="space-y-4">
            <SectionHeader
              title="3. Preview"
              description={`${newRows.length} novas · ${prepared.length - newRows.length} duplicadas · ${result?.invalid.length ?? 0} inválidas`}
              action={
                <Button onClick={confirmImport} disabled={upsert.isPending || !newRows.length}>
                  Importar {newRows.length}
                </Button>
              }
            />
            {prepared.length === 0 ? (
              <EmptyState
                title="Nada para importar"
                description="Ajuste o mapeamento das colunas para que as linhas sejam interpretadas corretamente."
              />
            ) : (
              <ul className="divide-y divide-border">
                {prepared.slice(0, 30).map((row, index) => (
                  <li
                    key={`${row.dedupe_hash}-${index}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">{row.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateBR(row.occurred_on)} ·{" "}
                        {categories.find((c) => c.id === row.category_id)?.name ?? "Sem categoria"}
                        {row.duplicate ? " · duplicada" : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm tabular-nums">{formatCents(row.amount_cents, row.currency)}</span>
                  </li>
                ))}
              </ul>
            )}
            <AssumptionNote>
              A deduplicação usa um hash de data + valor + descrição normalizada. Linhas já existentes são
              ignoradas automaticamente.
            </AssumptionNote>
          </Panel>
        </>
      ) : null}
    </AppLayout>
  );
}

function ColumnSelect({
  label,
  columns,
  value,
  onChange,
}: {
  label: string;
  columns: string[];
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {columns.map((col, index) => (
            <SelectItem key={index} value={String(index)}>
              {index + 1}. {col || "(vazio)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
