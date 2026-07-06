import { Link, useRouter } from "@tanstack/react-router";
import {
  Home,
  LogOut,
  Menu,
  MessageSquare,
  PlusCircle,
  User,
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function SiteHeader() {
  const { user } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  }

  const initial = (user?.email ?? "V").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero font-bold text-primary-foreground shadow-sm">
            V
          </div>

          <span className="text-lg font-bold text-foreground">
            Vizinho <span className="text-primary">Indica</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <Home className="mr-1 h-4 w-4" /> Início
            </Link>
          </Button>

          {user && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/mensagens">
                <MessageSquare className="mr-1 h-4 w-4" /> Mensagens
              </Link>
            </Button>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button
                asChild
                size="sm"
                className="hidden border-0 bg-gradient-hero text-primary-foreground hover:opacity-90 sm:inline-flex"
              >
                <Link to="/dashboard/anuncios/novo">
                  <PlusCircle className="mr-1 h-4 w-4" /> Anunciar
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">
                    {user.email}
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/anuncios">
                      <Menu className="mr-2 h-4 w-4" />
                      Meus anúncios
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/favoritos">
                      <User className="mr-2 h-4 w-4" />
                      Favoritos
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/mensagens">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Mensagens
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <a href="/auth?mode=signin">Entrar</a>
              </Button>

              <Button
                asChild
                size="sm"
                className="border-0 bg-gradient-hero text-primary-foreground hover:opacity-90"
              >
                <a href="/auth?mode=signup">Cadastrar</a>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}