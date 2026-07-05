import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StarRating } from "@/components/star-rating";

export interface ServiceCardData {
  id: number;
  titulo: string;
  categoria: string | null;
  preco: number | null;
  foto_url: string | null;
  prestador_nome: string | null;
  prestador_avatar: string | null;
  media_estrelas: number | null;
  total_avaliacoes: number | null;
}

function formatPrice(v: number | null) {
  if (v == null) return "A combinar";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export function ServiceCard({ s }: { s: ServiceCardData }) {
  const initials = (s.prestador_nome ?? "V")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Link
      to="/servico/$id"
      params={{ id: String(s.id) }}
      className="group block"
    >
      <Card className="overflow-hidden shadow-card transition-all hover:shadow-hero hover:-translate-y-0.5 border-border/60 pt-0 gap-0">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {s.foto_url ? (
            <img
              src={s.foto_url}
              alt={s.titulo}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-hero text-primary-foreground/80 text-sm">
              Sem foto
            </div>
          )}
          {s.categoria && (
            <Badge className="absolute left-3 top-3 bg-white/95 text-foreground hover:bg-white shadow-sm">
              {s.categoria}
            </Badge>
          )}
        </div>

        <div className="p-4 space-y-3">
          <h3 className="font-semibold text-foreground line-clamp-1">{s.titulo}</h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-7 w-7">
                <AvatarImage src={s.prestador_avatar ?? undefined} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">
                {s.prestador_nome ?? "Vizinho"}
              </span>
            </div>
            <StarRating value={s.media_estrelas} count={s.total_avaliacoes} size="sm" />
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-border/60">
            <span className="text-xs text-muted-foreground">A partir de</span>
            <span className="text-sm font-semibold text-primary">{formatPrice(s.preco)}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
