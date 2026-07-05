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

export const Route = createFileRoute("/")({
  component: Home,
});

const CATEGORIAS = [
  "Todos",
  "Reformas",
  "Aulas",
  "Culinária",
  "Beleza",
  "Cuidados",
  "Tecnologia",
  "Pets",
];

function Home() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("Todos");

  const { data, isLoading } = useQuery({
    queryKey: ["servicos-destaque"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_servicos_destaque")
        .select("*")
        .limit(24);
      if (error) throw error;
      return (data ?? []) as ServiceCardData[];
    },
  });

  const filtered = useMemo(() => {
    const list = data ?? [];
    return list.filter((s) => {
      const matchCat = cat === "Todos" || s.categoria === cat;
      const matchQ =
        !q.trim() ||
        s.titulo.toLowerCase().includes(q.toLowerCase()) ||
        (s.categoria ?? "").toLowerCase().includes(q.toLowerCase());
      return matchCat && matchQ;
    });
  }, [data, cat, q]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="relative mx-auto max-w-4xl px-4 py-20 md:py-28 text-center text-primary-foreground">
          <Badge className="mb-4 bg-white/15 text-white border-0 backdrop-blur">
            <Sparkles className="mr-1 h-3 w-3" /> Comunidade ativa no seu condomínio
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
            Encontre profissionais de <span className="text-white/95">confiança</span> no seu condomínio
          </h1>
          <p className="mt-4 text-lg text-white/85 max-w-2xl mx-auto">
            Reformas, aulas, culinária e muito mais — indicados e avaliados pelos seus vizinhos.
          </p>

          <div className="mt-8 mx-auto max-w-2xl">
            <div className="flex items-center gap-2 bg-white rounded-2xl p-2 shadow-hero">
              <Search className="h-5 w-5 text-muted-foreground ml-2" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="O que você precisa hoje?"
                className="border-0 focus-visible:ring-0 shadow-none text-base h-11 text-foreground"
              />
              <Button className="bg-gradient-hero border-0 text-primary-foreground hover:opacity-90 h-11 px-6">
                Buscar
              </Button>
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {CATEGORIAS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-all " +
                    (cat === c
                      ? "bg-white text-primary shadow-sm"
                      : "bg-white/15 text-white hover:bg-white/25 backdrop-blur")
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 max-w-xl mx-auto text-left">
            <Stat icon={<Users2 className="h-4 w-4" />} n="500+" l="Vizinhos" />
            <Stat icon={<ShieldCheck className="h-4 w-4" />} n="100%" l="Verificados" />
            <Stat icon={<Sparkles className="h-4 w-4" />} n="4.9" l="Avaliação" />
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Destaques da vizinhança</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {filtered.length} {filtered.length === 1 ? "serviço" : "serviços"} disponíveis
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed rounded-xl bg-card">
            <p className="text-muted-foreground">Nenhum serviço encontrado com esses filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((s) => (
              <ServiceCard key={s.id} s={s} />
            ))}
          </div>
        )}
      </section>

      {/* FAB (mobile) */}
      <Link
        to="/dashboard/anuncios/novo"
        className="md:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-hero px-5 py-3 text-primary-foreground font-semibold shadow-hero"
      >
        <PlusCircle className="h-5 w-5" /> Anunciar
      </Link>
    </div>
  );
}

function Stat({ icon, n, l }: { icon: React.ReactNode; n: string; l: string }) {
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur px-4 py-3">
      <div className="flex items-center gap-1.5 text-white/80 text-xs">{icon}{l}</div>
      <div className="text-xl font-bold mt-0.5">{n}</div>
    </div>
  );
}
