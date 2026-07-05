import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/dashboard/anuncios/novo")({
  component: NovoAnuncio,
});

interface Categoria {
  id: number;
  nome: string;
  ativo: boolean | null;
  ordem: number | null;
}

async function uploadServicoImagem(file: File, userId: string) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${extension}`;

  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from("servicos")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) throw error;

  const { data } = supabase.storage.from("servicos").getPublicUrl(filePath);

  return data.publicUrl;
}

function NovoAnuncio() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [preco, setPreco] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: categorias = [], isLoading: loadingCategorias } = useQuery({
    queryKey: ["categorias-anuncio"],
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

  useEffect(() => {
    if (!categoria && categorias.length > 0) {
      setCategoria(categorias[0].nome);
    }
  }, [categoria, categorias]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!user) return;

    if (!categoria) {
      toast.error("Cadastre uma categoria no Supabase antes de publicar.");
      return;
    }

    setBusy(true);

    try {
      let fotoUrl: string | null = null;

      if (fotoFile) {
        fotoUrl = await uploadServicoImagem(fotoFile, user.id);
      }

      const { error } = await supabase.from("servicos").insert({
        user_id: user.id,
        titulo,
        descricao,
        categoria,
        preco: preco ? Number(preco) : null,
        foto_url: fotoUrl,
      });

      if (error) throw error;

      toast.success("Anúncio criado!");
      navigate({ to: "/dashboard/anuncios" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar anúncio.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Novo anúncio</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <ImageUpload
            file={fotoFile}
            onFileChange={setFotoFile}
            disabled={busy}
            label="Imagem do anúncio"
            description="Clique ou arraste uma imagem do seu computador"
          />

          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              placeholder="Ex: Aulas de violão para iniciantes"
            />
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>

            <Select
              value={categoria || undefined}
              onValueChange={setCategoria}
              disabled={loadingCategorias || categorias.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>

              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.nome}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!loadingCategorias && categorias.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhuma categoria ativa encontrada no Supabase.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              rows={5}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Conte sobre seu serviço, experiência, horários..."
            />
          </div>

          <div className="space-y-2">
            <Label>Preço (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/dashboard/anuncios" })}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={busy || loadingCategorias}
              className="border-0 bg-gradient-hero text-primary-foreground hover:opacity-90"
            >
              {busy ? "Publicando..." : "Publicar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}