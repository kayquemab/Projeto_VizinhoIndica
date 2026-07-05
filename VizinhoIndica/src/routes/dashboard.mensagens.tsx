import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  ultimaMensagem: string;
  ultimaData: string | null;
}

interface Profile {
  id: string;
  nome: string | null;
  avatar_url: string | null;
}

function getProfileName(profile: Profile | undefined) {
  return profile?.nome || "Usuário sem perfil";
}

function getInitials(nome: string | null | undefined) {
  if (!nome) return "?";

  return nome
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
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
        .from("mensagens")
        .select(
          "id,servico_id,remetente_id,destinatario_id,conteudo,lida,created_at",
        )
        .or(`remetente_id.eq.${user!.id},destinatario_id.eq.${user!.id}`)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data ?? []) as MensagemRow[];
    },
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`mensagens-user-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagens" },
        () => qc.invalidateQueries({ queryKey: ["todas-mensagens", user.id] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  const conversas: Conversa[] = useMemo(() => {
    if (!user) return [];

    const map = new Map<string, Conversa>();

    for (const m of mensagens) {
      const other =
        m.remetente_id === user.id ? m.destinatario_id : m.remetente_id;

      const prev = map.get(other);

      if (!prev || (m.created_at ?? "") > (prev.ultimaData ?? "")) {
        map.set(other, {
          otherUserId: other,
          ultimaMensagem: m.conteudo,
          ultimaData: m.created_at,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      (b.ultimaData ?? "").localeCompare(a.ultimaData ?? ""),
    );
  }, [mensagens, user]);

  const otherIds = conversas.map((c) => c.otherUserId);

  const { data: profilesMap } = useQuery({
    queryKey: ["profiles-conversas", otherIds.join(",")],
    enabled: otherIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,nome,avatar_url")
        .in("id", otherIds);

      if (error) throw error;

      const map = new Map<string, Profile>();

      for (const p of data ?? []) {
        map.set(p.id, p as Profile);
      }

      return map;
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
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [thread.length]);

  async function send() {
    if (!user || !active || !draft.trim()) return;

    const text = draft.trim();
    setDraft("");

    await supabase.from("mensagens").insert({
      remetente_id: user.id,
      destinatario_id: active,
      conteudo: text,
      servico_id: null,
    });

    qc.invalidateQueries({ queryKey: ["todas-mensagens", user.id] });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Mensagens</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Converse com seus vizinhos
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="grid h-150 grid-cols-[280px_1fr]">
          <div className="overflow-y-auto border-r border-border">
            {conversas.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Nenhuma conversa ainda.
              </div>
            ) : (
              conversas.map((c) => {
                const profile = profilesMap?.get(c.otherUserId);
                const nome = getProfileName(profile);

                return (
                  <button
                    key={c.otherUserId}
                    type="button"
                    onClick={() => setActive(c.otherUserId)}
                    className={cn(
                      "flex w-full items-center gap-3 border-b border-border/60 p-3 text-left transition-colors hover:bg-muted",
                      active === c.otherUserId && "bg-primary/10",
                    )}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={profile?.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-primary/10 text-xs text-primary">
                        {getInitials(profile?.nome)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{nome}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.ultimaMensagem}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex flex-col">
            {active ? (
              <>
                <div className="border-b border-border px-4 py-3">
                  <p className="font-semibold">
                    {getProfileName(profilesMap?.get(active))}
                  </p>
                </div>

                <div
                  ref={scrollRef}
                  className="flex-1 space-y-2 overflow-y-auto bg-muted/30 p-4"
                >
                  {thread.map((m) => {
                    const mine = m.remetente_id === user?.id;

                    return (
                      <div
                        key={m.id}
                        className={cn("flex", mine ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                            mine
                              ? "rounded-br-sm bg-gradient-hero text-primary-foreground"
                              : "rounded-bl-sm bg-white text-foreground",
                          )}
                        >
                          {m.conteudo}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                  className="flex gap-2 border-t border-border bg-background p-3"
                >
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Escreva uma mensagem"
                  />

                  <Button
                    type="submit"
                    disabled={!draft.trim()}
                    className="border-0 bg-gradient-hero text-primary-foreground hover:opacity-90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                Selecione uma conversa para começar
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}