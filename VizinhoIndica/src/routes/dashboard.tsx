import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Heart, LayoutList, MessageSquare, PlusCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

const NAV = [
  { to: "/dashboard/anuncios", label: "Meus anúncios", icon: LayoutList },
  { to: "/dashboard/favoritos", label: "Favoritos", icon: Heart },
  { to: "/dashboard/mensagens", label: "Mensagens", icon: MessageSquare },
];

function DashboardLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 py-20 text-center text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
          <aside className="space-y-1">
            <Button asChild className="w-full mb-4 bg-gradient-hero border-0 text-primary-foreground hover:opacity-90">
              <Link to="/dashboard/anuncios/novo"><PlusCircle className="mr-2 h-4 w-4" />Anunciar</Link>
            </Button>
            {NAV.map((n) => {
              const active = pathname.startsWith(n.to);
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" /> {n.label}
                </Link>
              );
            })}
          </aside>
          <main><Outlet /></main>
        </div>
      </div>
    </div>
  );
}
