import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState, PageHeader } from "@/components/finance/primitives";

export const Route = createFileRoute("/cenarios")({
  head: () => ({
    meta: [
      { title: "Cenários · Belchior" },
      {
        name: "description",
        content: "Compare cenários otimista, base e pessimista para decidir com números, não com intuição.",
      },
      { property: "og:title", content: "Cenários · Belchior" },
      { property: "og:description", content: "Simulações what-if determinísticas do seu futuro financeiro." },
    ],
  }),
  component: () => (
    <AppLayout>
      <PageHeader title="Cenários" description="Simulações what-if comparando trajetórias possíveis." />
      <EmptyState
        title="Disponível na Fase 3"
        description="Os cenários usarão o motor de projeção construído sobre os dados reais desta fundação."
      />
    </AppLayout>
  ),
});
