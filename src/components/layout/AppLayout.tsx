import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  BarChart3,
  CalendarCheck,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Settings,
  Target,
  Wallet,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useProfile } from "@/hooks/useFinanceData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CurrencySelect } from "@/components/finance/CurrencySelect";

const NAV = [
  { to: "/", label: "Visão geral", icon: LayoutDashboard },
  { to: "/transacoes", label: "Transações", icon: ArrowLeftRight },
  { to: "/fechamentos", label: "Fechamentos", icon: CalendarCheck },
  { to: "/planejamento", label: "Planejamento", icon: Target },
  { to: "/cenarios", label: "Cenários", icon: LineChart },
  { to: "/patrimonio", label: "Patrimônio", icon: Wallet },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

const MOBILE_NAV = NAV.filter((item) =>
  ["/", "/transacoes", "/fechamentos", "/patrimonio", "/configuracoes"].includes(item.to),
);

export function AppLayout({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: profile } = useProfile();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (session && profile && !profile.onboarded && pathname !== "/onboarding") {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [session, profile, pathname, navigate]);

  useEffect(() => setMobileOpen(false), [pathname]);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-sidebar px-3 py-6 lg:flex">
        <BrandMark />
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <NavLink key={item.to} {...item} active={pathname === item.to} />
          ))}
        </nav>
        <Button variant="ghost" className="justify-start gap-2 text-muted-foreground" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </aside>

      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
          <Menu className="h-5 w-5" />
        </Button>
        <BrandMark compact />
        <div className="ml-auto">
          <CurrencySelect />
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-x-0 top-[57px] z-30 border-b border-border bg-surface px-3 py-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <NavLink key={item.to} {...item} active={pathname === item.to} />
            ))}
            <Button variant="ghost" className="justify-start gap-2 text-muted-foreground" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </nav>
        </div>
      ) : null}

      <div className="hidden lg:flex lg:ml-60 lg:justify-end lg:px-10 lg:pt-6">
        <CurrencySelect />
      </div>

      <main className="px-4 pb-28 pt-6 sm:px-6 lg:ml-60 lg:px-10 lg:pb-14 lg:pt-4">
        <div className="mx-auto w-full max-w-6xl space-y-8">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur lg:hidden">
        {MOBILE_NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[10px]",
              pathname === item.to ? "text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function NavLink({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
        active
          ? "bg-sidebar-accent text-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2 px-2">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
        B
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold tracking-tight">Belchior</p>
        {!compact ? (
          <p className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">
            Personal Finance OS
          </p>
        ) : null}
      </div>
    </div>
  );
}
