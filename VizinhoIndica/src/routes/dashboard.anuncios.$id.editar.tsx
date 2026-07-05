import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
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

export const Route = createFileRoute("/dashboard/anuncios/$id/editar")({
  component: EditarAnuncio,
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

function EditarAnuncio() {
  const { id } = useParams({ from: "/dashboard/anuncios/$id/editar" });
  const servicoId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [preco, setPreco] = useState("");
  const [fotoAtual, setFotoAtual] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const { data: categorias = [], isLoading: loadingCategorias } = useQuery({
    queryKey: ["categorias-editar-anuncio"],
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

  const categoriasDisponiveis = useMemo(() => {
    if (!categoria) return categorias;

    const existe = categorias.some((c) => c.nome === categoria);

    if (existe) return categorias;

    return [
      {
        id: -1,
        nome: categoria,
        ativo: true,
        ordem: null,
      },
      ...categorias,
    ];
  }, [categoria, categorias]);

  useEffect(() => {
    async function carregarServico() {
      const { data, error } = await supabase
        .from("servicos")
        .select("id,user_id,titulo,descricao,categoria,preco,foto_url")
        .eq("id", servicoId)
        .maybeSingle();

      if (error || !data) {
        toast.error("Não encontrado");
        navigate({ to: "/dashboard/anuncios" });
        return;
      }

      if (user && data.user_id !== user.id) {
        toast.error("Você não pode editar este anúncio");
        navigate({ to: "/dashboard/anuncios" });
        return;
      }

      setTitulo(data.titulo);
      setDescricao(data.descricao ?? "");
      setCategoria(data.categoria ?? "");
      setPreco(data.preco != null ? String(data.preco) : "");
      setFotoAtual(data.foto_url ?? null);
      setLoading(false);
    }

    carregarServico();
  }, [servicoId, navigate, user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!user) return;

    if (!categoria) {
      toast.error("Selecione uma categoria cadastrada no Supabase.");
      return;
    }

    setBusy(true);

    try {
      let fotoUrlFinal = fotoAtual;

      if (fotoFile) {
        fotoUrlFinal = await uploadServicoImagem(fotoFile, user.id);
      }

      const { error } = await supabase
        .from("servicos")
        .update({
          titulo,
          descricao,
          categoria,
          preco: preco ? Number(preco) : null,
          foto_url: fotoUrlFinal,
        })
        .eq("id", servicoId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Anúncio atualizado!");
      navigate({ to: "/dashboard/anuncios" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar anúncio.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Carregando...</p>;
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Editar anúncio</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <ImageUpload
            value={fotoAtual}
            file={fotoFile}
            onFileChange={setFotoFile}
            onRemove={() => setFotoAtual(null)}
            disabled={busy}
            label="Imagem do anúncio"
            description="Clique ou arraste uma nova imagem do seu computador"
          />

          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>

            <Select
              value={categoria || undefined}
              onValueChange={setCategoria}
              disabled={loadingCategorias || categoriasDisponiveis.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>

              <SelectContent>
                {categoriasDisponiveis.map((c) => (
                  <SelectItem key={`${c.id}-${c.nome}`} value={c.nome}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!loadingCategorias && categoriasDisponiveis.length === 0 && (
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
              {busy ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}