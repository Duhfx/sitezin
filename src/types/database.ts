export type Database = {
  public: {
    Tables: {
      coupons: {
        Row: {
          id: string;
          marca: string;
          descricao: string;
          cupom: string;
          affiliate_url: string;
          logo_url: string | null;
          ativo: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["coupons"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["coupons"]["Insert"]>;
        Relationships: [];
      };
      media_kit_requests: {
        Row: {
          id: string;
          nome: string;
          empresa: string;
          cargo: string;
          email: string;
          whatsapp: string | null;
          instagram_empresa: string | null;
          descricao: string;
          status: "pendente" | "aprovado" | "reprovado";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["media_kit_requests"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["media_kit_requests"]["Insert"]>;
        Relationships: [];
      };
      media_kit_access: {
        Row: {
          id: string;
          request_id: string;
          token: string;
          created_at: string;
          revoked_at: string | null;
          expires_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["media_kit_access"]["Row"], "id" | "created_at" | "revoked_at" | "expires_at"> & {
          id?: string;
          created_at?: string;
          revoked_at?: string | null;
          expires_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["media_kit_access"]["Insert"]>;
        Relationships: [];
      };
      media_kit_views: {
        Row: {
          id: string;
          access_id: string;
          viewed_at: string;
          ip: string | null;
          user_agent: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["media_kit_views"]["Row"], "id" | "viewed_at"> & {
          id?: string;
          viewed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["media_kit_views"]["Insert"]>;
        Relationships: [];
      };
      influencer_metrics: {
        Row: {
          id: string;
          reference_month: string;
          instagram_followers: number;
          instagram_reach: number;
          instagram_impressions: number;
          instagram_engagement: number;
          tiktok_followers: number;
          tiktok_views: number;
          tiktok_likes: number;
          tiktok_engagement: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["influencer_metrics"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["influencer_metrics"]["Insert"]>;
        Relationships: [];
      };
      influencer_profile: {
        Row: {
          id: string;
          nome: string;
          foto_url: string | null;
          biografia: string;
          nicho: string;
          publico_alvo: string;
          top_estados: TopEstado[];
          instagram_url: string | null;
          tiktok_url: string | null;
          youtube_url: string | null;
          formatos: Formato[];
          cases: Case[];
          moodboard: string[];
          email: string | null;
          whatsapp: string | null;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["influencer_profile"]["Row"], "id" | "updated_at"> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["influencer_profile"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type TopEstado = { uf: string; pct: number };
export type Formato = { nome: string; descricao: string };
export type Case = { marca: string; resultado: string; periodo: string };

export type Coupon = Database["public"]["Tables"]["coupons"]["Row"];
export type MediaKitRequest = Database["public"]["Tables"]["media_kit_requests"]["Row"];
export type MediaKitAccess = Database["public"]["Tables"]["media_kit_access"]["Row"];
export type MediaKitView = Database["public"]["Tables"]["media_kit_views"]["Row"];
export type InfluencerMetrics = Database["public"]["Tables"]["influencer_metrics"]["Row"];
export type InfluencerProfile = Database["public"]["Tables"]["influencer_profile"]["Row"];
