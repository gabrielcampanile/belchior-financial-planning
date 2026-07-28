import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState, PageHeader } from "@/components/finance/primitives";

export const Route = createFileRoute("/planejamento")({
  head: () => ({
    meta: [
      { title: "Planejamento · Belchior" },
      {
        name: "description",
        content: "Planeje receitas, despesas, eventos e metas dos próximos meses com números determinísticos.",
      },
      { property: "og:title", content: "Planejamento · Belchior" },
      { property: "og:description", content: "Orçamento e metas mês a mês, sem achismos." },
    ],
  }),
  component: () => (
    <AppLayout>
      <PageHeader title="Planejamento" description="Orçamentos, eventos futuros e metas financeiras." />
      <EmptyState
        title="Disponível na Fase 2"
        description="A fundação já grava receitas, despesas e patrimônio reais. O motor de planejamento e projeção entra na próxima fase, usando exatamente esses dados."
      />
    </AppLayout>
  ),
});
