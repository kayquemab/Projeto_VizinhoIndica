import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, MessageCircle, MapPin, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/servico/$id")({
  component: ServiceDetail,
});

interface ServicoRow {
  id: number;
  user_id: string;
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  preco: number | null;
  foto_url: string | null;
  created_at: string | null;
}

interface Prestador {
  id: string;
  nome: string | null;
  avatar_url: string | null;
  bio: string | null;
  condominio: string | null;
}

interface Avaliacao {
  id: number;
  nota: number;
  comentario: string | null;
  created_at: string | null;
  user_id: string;
}

function formatPrice(v: number | null) {
  if (v == null) return "A combinar";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function ServiceDetail() {
  const { id } = useParams({ from: "/servico/$id" });
  const servicoId = Number(id);
  const { user } = useAuth();
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");
  const [chatOpen, setChatOpen] = useState(false);

  const { data: servico, isLoading } = useQuery({
    queryKey: ["servico", servicoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servicos")
        .select("*")
        .eq("id", servicoId)
        .maybeSingle();
      if (error) throw error;
      return data as ServicoRow | null;
    },
  });

  const { data: prestador } = useQuery({
    queryKey: ["prestador", servico?.user_id],
    enabled: !!servico?.user_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,nome,avatar_url,bio,condominio")
        .eq("id", servico!.user_id)
        .maybeSingle();
      if (error) throw error;
      return data as Prestador | null;
    },
  });

  const { data: avaliacoes } = useQuery({
    queryKey: ["avaliacoes", servicoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avaliacoes")
        .select("id,nota,comentario,created_at,user_id")
        .eq("servico_id", servicoId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Avaliacao[];
    },
  });

  const { data: favorito } = useQuery({
    queryKey: ["favorito", servicoId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("favoritos")
        .select("id")
        .eq("servico_id", servicoId)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const toggleFav = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Faça login para favoritar");
      if (favorito) {
        const { error } = await supabase.from("favoritos").delete().eq("id", favorito.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favoritos")
          .insert({ user_id: user.id, servico_id: servicoId });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorito", servicoId, user?.id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Faça login para enviar mensagem");
      if (!servico || !msg.trim()) return;
      const { error } = await supabase.from("mensagens").insert({
        servico_id: servicoId,
        remetente_id: user.id,
        destinatario_id: servico.user_id,
        conteudo: msg.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mensagem enviada!");
      setMsg("");
      setChatOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!servico) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Serviço não encontrado</h1>
          <Button asChild className="mt-4"><Link to="/">Voltar</Link></Button>
        </div>
      </div>
    );
  }

  const media =
    (avaliacoes ?? []).length > 0
      ? (avaliacoes ?? []).reduce((s, a) => s + a.nota, 0) / (avaliacoes ?? []).length
      : 0;

  const initials = (prestador?.nome ?? "V").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Voltar aos serviços</Link>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna esquerda */}
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video overflow-hidden rounded-xl bg-muted shadow-card">
              {servico.foto_url ? (
                <img src={servico.foto_url} alt={servico.titulo} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-hero" />
              )}
            </div>

            <div>
              {servico.categoria && <Badge className="mb-2 bg-primary/10 text-primary hover:bg-primary/15 border-0">{servico.categoria}</Badge>}
              <h1 className="text-3xl md:text-4xl font-bold">{servico.titulo}</h1>
              <div className="mt-3 flex items-center gap-4">
                <StarRating value={media} count={(avaliacoes ?? []).length} size="md" />
                {servico.created_at && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(servico.created_at).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                <h2 className="font-semibold mb-2">Descrição</h2>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {servico.descricao ?? "Sem descrição."}
                </p>
              </CardContent>
            </Card>

            <div>
              <h2 className="text-xl font-bold mb-4">Prova social</h2>
              {(avaliacoes ?? []).length === 0 ? (
                <Card><CardContent className="py-10 text-center text-muted-foreground">Ainda sem avaliações. Seja o primeiro!</CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {(avaliacoes ?? []).map((a) => (
                    <Card key={a.id}>
                      <CardContent className="pt-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/10 text-primary text-xs">V</AvatarFallback></Avatar>
                            <div>
                              <p className="text-sm font-medium">Vizinho</p>
                              <p className="text-xs text-muted-foreground">
                                {a.created_at ? new Date(a.created_at).toLocaleDateString("pt-BR") : ""}
                              </p>
                            </div>
                          </div>
                          <StarRating value={a.nota} size="sm" showValue={false} />
                        </div>
                        {a.comentario && <p className="text-sm mt-3 text-foreground/90">{a.comentario}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Coluna direita — sticky */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-4">
              <Card className="shadow-card">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={prestador?.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{prestador?.nome ?? "Vizinho"}</p>
                      {prestador?.condominio && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {prestador.condominio}
                        </p>
                      )}
                    </div>
                  </div>

                  {prestador?.bio && <p className="text-sm text-muted-foreground">{prestador.bio}</p>}

                  <Separator />

                  <div>
                    <p className="text-xs text-muted-foreground">A partir de</p>
                    <p className="text-3xl font-bold text-primary">{formatPrice(servico.preco)}</p>
                  </div>

                  {chatOpen ? (
                    <div className="space-y-2">
                      <textarea
                        value={msg}
                        onChange={(e) => setMsg(e.target.value)}
                        rows={3}
                        placeholder="Olá! Tenho interesse no seu serviço..."
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setChatOpen(false)}>Cancelar</Button>
                        <Button disabled={sendMessage.isPending || !msg.trim()} className="flex-1 bg-gradient-hero border-0 text-primary-foreground hover:opacity-90" onClick={() => sendMessage.mutate()}>
                          Enviar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      className="w-full h-11 bg-gradient-hero border-0 text-primary-foreground hover:opacity-90"
                      onClick={() => {
                        if (!user) { toast.error("Faça login para conversar"); return; }
                        setChatOpen(true);
                      }}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" /> Chamar no chat
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => toggleFav.mutate()}
                    disabled={toggleFav.isPending}
                  >
                    <Heart className={"mr-2 h-4 w-4 " + (favorito ? "fill-destructive text-destructive" : "")} />
                    {favorito ? "Favoritado" : "Favoritar"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
