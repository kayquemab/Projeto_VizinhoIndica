import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ServiceCard, type ServiceCardData } from "@/components/service-card";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/dashboard/favoritos")({
  component: Favoritos,
});

function Favoritos() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["favoritos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: favs, error } = await supabase
        .from("favoritos").select("servico_id").eq("user_id", user!.id);
      if (error) throw error;
      const ids = (favs ?? []).map((f) => f.servico_id);
      if (ids.length === 0) return [] as ServiceCardData[];
      const { data: servs, error: e2 } = await supabase
        .from("v_servicos_destaque").select("*").in("id", ids);
      if (e2) throw e2;
      return (servs ?? []) as ServiceCardData[];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Favoritos</h1>
        <p className="text-sm text-muted-foreground mt-1">Serviços que você salvou</p>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-xl" />)}</div>
      ) : (data ?? []).length === 0 ? (
        <Card><CardContent className="py-14 text-center text-muted-foreground">Nenhum favorito ainda. Explore serviços e toque no coração ♥</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(data ?? []).map((s) => <ServiceCard key={s.id} s={s} />)}
        </div>
      )}
    </div>
  );
}
