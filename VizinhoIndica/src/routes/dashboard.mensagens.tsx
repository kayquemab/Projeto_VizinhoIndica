import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/mensagens")({
  component: Mensagens,
});

interface MensagemRow {
  id: number;
  servico_id: number | null;
  remetente_id: string;
  destinatario_id: string;
  conteudo: string;
  lida: boolean | null;
  created_at: string | null;
}

interface Conversa {
  otherUserId: string;
  otherNome: string;
  ultimaMensagem: string;
  ultimaData: string | null;
}

function Mensagens() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [active, setActive] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: mensagens = [] } = useQuery({
    queryKey: ["todas-mensagens", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mensagens").select("*")
        .or(`remetente_id.eq.${user!.id},destinatario_id.eq.${user!.id}`)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as MensagemRow[];
    },
  });

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("mensagens-user")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagens" },
        () => qc.invalidateQueries({ queryKey: ["todas-mensagens", user.id] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  const conversas: Conversa[] = useMemo(() => {
    if (!user) return [];
    const map = new Map<string, Conversa>();
    for (const m of mensagens) {
      const other = m.remetente_id === user.id ? m.destinatario_id : m.remetente_id;
      const prev = map.get(other);
      if (!prev || (m.created_at ?? "") > (prev.ultimaData ?? "")) {
        map.set(other, {
          otherUserId: other,
          otherNome: "Vizinho",
          ultimaMensagem: m.conteudo,
          ultimaData: m.created_at,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => (b.ultimaData ?? "").localeCompare(a.ultimaData ?? ""));
  }, [mensagens, user]);

  // Fetch names for conversas
  const otherIds = conversas.map((c) => c.otherUserId);
  const { data: nomes } = useQuery({
    queryKey: ["nomes-conversas", otherIds.join(",")],
    enabled: otherIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id,nome").in("id", otherIds);
      const m = new Map<string, string>();
      for (const p of data ?? []) m.set(p.id, p.nome ?? "Vizinho");
      return m;
    },
  });

  const thread = useMemo(() => {
    if (!user || !active) return [];
    return mensagens.filter(
      (m) =>
        (m.remetente_id === user.id && m.destinatario_id === active) ||
        (m.remetente_id === active && m.destinatario_id === user.id),
    );
  }, [mensagens, user, active]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [thread.length]);

  async function send() {
    if (!user || !active || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    await supabase.from("mensagens").insert({
      remetente_id: user.id, destinatario_id: active, conteudo: text, servico_id: null,
    });
    qc.invalidateQueries({ queryKey: ["todas-mensagens", user.id] });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Mensagens</h1>
        <p className="text-sm text-muted-foreground mt-1">Converse com seus vizinhos</p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-[280px_1fr] h-[600px]">
          {/* Lista */}
          <div className="border-r border-border overflow-y-auto">
            {conversas.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">Nenhuma conversa ainda.</div>
            ) : (
              conversas.map((c) => {
                const nome = nomes?.get(c.otherUserId) ?? "Vizinho";
                return (
                  <button
                    key={c.otherUserId}
                    onClick={() => setActive(c.otherUserId)}
                    className={cn(
                      "w-full text-left p-3 flex items-center gap-3 border-b border-border/60 hover:bg-muted transition-colors",
                      active === c.otherUserId && "bg-primary/10",
                    )}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {nome.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.ultimaMensagem}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Thread */}
          <div className="flex flex-col">
            {active ? (
              <>
                <div className="px-4 py-3 border-b border-border">
                  <p className="font-semibold">{nomes?.get(active) ?? "Vizinho"}</p>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/30">
                  {thread.map((m) => {
                    const mine = m.remetente_id === user?.id;
                    return (
                      <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                          mine ? "bg-gradient-hero text-primary-foreground rounded-br-sm" : "bg-white text-foreground rounded-bl-sm",
                        )}>
                          {m.conteudo}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <form
                  onSubmit={(e) => { e.preventDefault(); send(); }}
                  className="p-3 border-t border-border flex gap-2 bg-background"
                >
                  <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Escreva uma mensagem" />
                  <Button type="submit" disabled={!draft.trim()} className="bg-gradient-hero border-0 text-primary-foreground hover:opacity-90">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Selecione uma conversa para começar
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
