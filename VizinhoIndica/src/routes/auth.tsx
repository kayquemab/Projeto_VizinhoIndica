import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function getAuthErrorMessage(err: unknown, mode: "signin" | "signup") {
  const message = err instanceof Error ? err.message : "";

  if (mode === "signin" && message.includes("Invalid login credentials")) {
    return "Não conseguimos encontrar uma conta com esses dados. Verifique seu e-mail e senha ou crie uma nova conta para continuar.";
  }

  if (mode === "signin" && message.includes("Email not confirmed")) {
    return "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada antes de entrar.";
  }

  if (mode === "signup" && message.includes("User already registered")) {
    return "Já existe uma conta com esse e-mail. Tente entrar ou use outro e-mail para se cadastrar.";
  }

  if (message) {
    return message;
  }

  return mode === "signin"
    ? "Não foi possível entrar. Verifique seus dados e tente novamente."
    : "Não foi possível criar sua conta. Verifique os dados e tente novamente.";
}

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nome },
          },
        });

        if (error) throw error;

        toast.success("Conta criada! Verifique seu e-mail se necessário.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success("Bem-vindo(a) de volta!");
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(getAuthErrorMessage(err, mode));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-6 flex items-center justify-center gap-2 text-white"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white font-bold text-primary shadow-sm">
            V
          </div>

          <span className="text-xl font-bold">Vizinho Indica</span>
        </Link>

        <Card className="border-0 shadow-hero">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Acesse a comunidade</CardTitle>

            <CardDescription>
              Entre ou crie sua conta para conectar-se com seus vizinhos
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs
              value={mode}
              onValueChange={(v) => setMode(v as "signin" | "signup")}
            >
              <TabsList className="mb-6 grid w-full grid-cols-2">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-4">
                <TabsContent value="signup" className="m-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>

                    <Input
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Seu nome"
                      required={mode === "signup"}
                    />
                  </div>
                </TabsContent>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>

                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>

                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={busy}
                  className="h-11 w-full border-0 bg-gradient-hero text-primary-foreground hover:opacity-90"
                >
                  {busy ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta"}
                </Button>
              </form>
            </Tabs>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-white/80">
          <Link to="/" className="hover:underline">
            ← Voltar ao início
          </Link>
        </p>
      </div>
    </div>
  );
}