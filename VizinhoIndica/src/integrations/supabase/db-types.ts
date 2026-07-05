// Minimal DB type shim for the Vizinho Indica schema (int8 ids).
// Kept separate from the managed src/integrations/supabase/types.ts.

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nome: string | null;
          avatar_url: string | null;
          bio: string | null;
          telefone: string | null;
          condominio: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      servicos: {
        Row: {
          id: number;
          user_id: string;
          titulo: string;
          descricao: string | null;
          categoria: string | null;
          preco: number | null;
          foto_url: string | null;
          created_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["servicos"]["Row"], "id" | "created_at"> & {
          id?: number;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["servicos"]["Row"]>;
        Relationships: [];
      };
      avaliacoes: {
        Row: {
          id: number;
          servico_id: number;
          user_id: string;
          nota: number;
          comentario: string | null;
          created_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["avaliacoes"]["Row"], "id" | "created_at"> & {
          id?: number;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["avaliacoes"]["Row"]>;
        Relationships: [];
      };
      mensagens: {
        Row: {
          id: number;
          servico_id: number | null;
          remetente_id: string;
          destinatario_id: string;
          conteudo: string;
          lida: boolean | null;
          created_at: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["mensagens"]["Row"],
          "id" | "created_at" | "lida"
        > & {
          id?: number;
          created_at?: string | null;
          lida?: boolean | null;
        };
        Update: Partial<Database["public"]["Tables"]["mensagens"]["Row"]>;
        Relationships: [];
      };
      favoritos: {
        Row: {
          id: number;
          user_id: string;
          servico_id: number;
          created_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["favoritos"]["Row"], "id" | "created_at"> & {
          id?: number;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["favoritos"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      v_servicos_destaque: {
        Row: {
          id: number;
          titulo: string;
          descricao: string | null;
          categoria: string | null;
          preco: number | null;
          foto_url: string | null;
          user_id: string;
          prestador_nome: string | null;
          prestador_avatar: string | null;
          media_estrelas: number | null;
          total_avaliacoes: number | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
