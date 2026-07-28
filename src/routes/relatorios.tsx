import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState, PageHeader } from "@/components/finance/primitives";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios · Belchior" },
      {
        name: "description",
        content: "Relatórios mensais e anuais da sua vida financeira, prontos para exportação.",
      },
      { property: "og:title", content: "Relatórios · Belchior" },
      { property: "og:description", content: "Consolidados mensais e anuais das suas finanças." },
    ],
  }),
  component: () => (
    <AppLayout>
      <PageHeader title="Relatórios" description="Consolidados mensais, anuais e exportação." />
      <EmptyState
        title="Disponível na Fase 5"
        description="Enquanto isso, os fechamentos mensais já congelam todos os totais que alimentarão os relatórios."
      />
    </AppLayout>
  ),
});
