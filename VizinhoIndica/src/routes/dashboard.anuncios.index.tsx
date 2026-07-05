import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/anuncios/")({
  component: MeusAnuncios,
});

interface ServicoRow {
  id: number;
  titulo: string;
  categoria: string | null;
  preco: number | null;
  foto_url: string | null;
  created_at: string | null;
}

function MeusAnuncios() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["meus-servicos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servicos")
        .select("id,titulo,categoria,preco,foto_url,created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ServicoRow[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("servicos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Anúncio excluído");
      qc.invalidateQueries({ queryKey: ["meus-servicos", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meus anúncios</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seus serviços publicados</p>
        </div>
        <Button asChild className="bg-gradient-hero border-0 text-primary-foreground hover:opacity-90">
          <Link to="/dashboard/anuncios/novo"><PlusCircle className="mr-2 h-4 w-4" />Novo</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
      ) : (data ?? []).length === 0 ? (
        <Card><CardContent className="py-14 text-center">
          <p className="text-muted-foreground mb-4">Você ainda não tem anúncios.</p>
          <Button asChild className="bg-gradient-hero border-0 text-primary-foreground hover:opacity-90">
            <Link to="/dashboard/anuncios/novo">Criar primeiro anúncio</Link>
          </Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-16 w-24 rounded-md overflow-hidden bg-muted shrink-0">
                  {s.foto_url ? <img src={s.foto_url} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-hero" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{s.titulo}</p>
                  <p className="text-xs text-muted-foreground">{s.categoria ?? "Sem categoria"}</p>
                </div>
                <div className="text-sm font-semibold text-primary">
                  {s.preco != null ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(s.preco) : "—"}
                </div>
                <div className="flex gap-1">
                  <Button asChild variant="ghost" size="icon"><Link to="/dashboard/anuncios/$id/editar" params={{ id: String(s.id) }}><Pencil className="h-4 w-4" /></Link></Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => { if (confirm("Excluir este anúncio?")) del.mutate(s.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
