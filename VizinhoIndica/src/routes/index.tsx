import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, PlusCircle, ShieldCheck, Sparkles, Users2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { ServiceCard, type ServiceCardData } from "@/components/service-card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Home,
});

interface Categoria {
  id: number;
  nome: string;
  ativo: boolean | null;
  ordem: number | null;
}

function Home() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todos");

  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("id,nome,ativo,ordem")
        .eq("ativo", true)
        .order("ordem", { ascending: true })
        .order("nome", { ascending: true });

      if (error) {
        console.error(error);
        return [];
      }

      return (data ?? []) as Categoria[];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["servicos-destaque"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_servicos_destaque")
        .select(
          "id,titulo,descricao,categoria,preco,foto_url,user_id,prestador_nome,prestador_avatar,media_estrelas,total_avaliacoes",
        )
        .limit(24);

      if (error) throw error;

      return (data ?? []) as ServiceCardData[];
    },
  });

  const filtered = useMemo(() => {
    const list = data ?? [];
    const busca = q.trim().toLowerCase();

    return list.filter((s) => {
      const matchBusca =
        !busca ||
        s.titulo.toLowerCase().includes(busca) ||
        (s.categoria ?? "").toLowerCase().includes(busca);

      const matchCategoria = cat === "Todos" || s.categoria === cat;

      return matchBusca && matchCategoria;
    });
  }, [data, q, cat]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />

        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center text-primary-foreground md:py-28">
          <Badge className="mb-4 border-0 bg-white/15 text-white backdrop-blur">
            <Sparkles className="mr-1 h-3 w-3" />
            Comunidade ativa no seu condomínio
          </Badge>

          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Encontre profissionais de confiança no seu condomínio
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">
            Reformas, aulas, culinária, cuidados e muito mais — direto com
            vizinhos avaliados pela comunidade.
          </p>

          <div className="mx-auto mt-8 max-w-2xl">
            <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-hero">
              <Search className="ml-2 h-5 w-5 text-muted-foreground" />

              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="O que você precisa hoje?"
                className="h-11 border-0 text-base text-foreground shadow-none focus-visible:ring-0"
              />

              <Button className="h-11 border-0 bg-gradient-hero px-6 text-primary-foreground hover:opacity-90">
                Buscar
              </Button>
            </div>

            {categorias.length > 0 && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCat("Todos")}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    cat === "Todos"
                      ? "bg-white text-primary"
                      : "bg-white/15 text-white hover:bg-white/25",
                  )}
                >
                  Todos
                </button>

                {categorias.map((categoria) => (
                  <button
                    key={categoria.id}
                    type="button"
                    onClick={() => setCat(categoria.nome)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                      cat === categoria.nome
                        ? "bg-white text-primary"
                        : "bg-white/15 text-white hover:bg-white/25",
                    )}
                  >
                    {categoria.nome}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mx-auto mt-10 grid max-w-xl grid-cols-3 gap-4 text-left">
            <Stat
              icon={<Users2 className="h-4 w-4" />}
              n="500+"
              l="Vizinhos"
            />
            <Stat
              icon={<ShieldCheck className="h-4 w-4" />}
              n="100%"
              l="Verificados"
            />
            <Stat
              icon={<Sparkles className="h-4 w-4" />}
              n="4.9"
              l="Avaliação"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">
              Destaques da vizinhança
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {filtered.length}{" "}
              {filtered.length === 1 ? "serviço" : "serviços"} disponíveis
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-4/3 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card py-20 text-center">
            <p className="text-muted-foreground">
              Nenhum serviço encontrado com esses filtros.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <ServiceCard key={s.id} s={s} />
            ))}
          </div>
        )}
      </section>

      <Link
        to="/dashboard/anuncios/novo"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-hero px-5 py-3 font-semibold text-primary-foreground shadow-hero md:hidden"
      >
        <PlusCircle className="h-5 w-5" />
        Anunciar
      </Link>
    </div>
  );
}

function Stat({
  icon,
  n,
  l,
}: {
  icon: React.ReactNode;
  n: string;
  l: string;
}) {
  return (
    <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-1.5 text-xs text-white/80">
        {icon}
        {l}
      </div>

      <div className="mt-0.5 text-xl font-bold">{n}</div>
    </div>
  );
}