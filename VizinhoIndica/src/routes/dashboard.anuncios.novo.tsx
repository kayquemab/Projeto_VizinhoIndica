import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/anuncios/novo")({
  component: NovoAnuncio,
});

const CATEGORIAS = ["Reformas", "Aulas", "Culinária", "Beleza", "Cuidados", "Tecnologia", "Pets", "Outros"];

function NovoAnuncio() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("Reformas");
  const [preco, setPreco] = useState("");
  const [foto, setFoto] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("servicos").insert({
      user_id: user.id,
      titulo, descricao, categoria,
      preco: preco ? Number(preco) : null,
      foto_url: foto || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Anúncio criado!");
    navigate({ to: "/dashboard/anuncios" });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader><CardTitle>Novo anúncio</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2"><Label>Título</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} required placeholder="Ex: Aulas de violão para iniciantes" /></div>
          <div className="space-y-2"><Label>Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Descrição</Label><Textarea rows={5} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Conte sobre seu serviço, experiência, horários..." /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Preço (R$)</Label><Input type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="Opcional" /></div>
            <div className="space-y-2"><Label>URL da foto</Label><Input value={foto} onChange={(e) => setFoto(e.target.value)} placeholder="https://..." /></div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/dashboard/anuncios" })}>Cancelar</Button>
            <Button type="submit" disabled={busy} className="bg-gradient-hero border-0 text-primary-foreground hover:opacity-90">
              {busy ? "Publicando..." : "Publicar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
