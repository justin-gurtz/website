export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "10.2.0 (e07807d)";
  };
  public: {
    Tables: {
      duolingo: {
        Row: {
          courses: Json;
          created_at: string;
          id: number;
          streak: number;
        };
        Insert: {
          courses: Json;
          created_at?: string;
          id?: number;
          streak: number;
        };
        Update: {
          courses?: Json;
          created_at?: string;
          id?: number;
          streak?: number;
        };
        Relationships: [];
      };
      garmin: {
        Row: {
          created_at: string;
          id: number;
          payload: Json;
          start_time_local: string;
          vo2_max_value: number;
        };
        Insert: {
          created_at?: string;
          id?: number;
          payload: Json;
          start_time_local: string;
          vo2_max_value: number;
        };
        Update: {
          created_at?: string;
          id?: number;
          payload?: Json;
          start_time_local?: string;
          vo2_max_value?: number;
        };
        Relationships: [];
      };
      garmin_tokens: {
        Row: {
          created_at: string;
          id: number;
          oauth1_token: string;
          oauth2_token: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          oauth1_token: string;
          oauth2_token: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          oauth1_token?: string;
          oauth2_token?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      github: {
        Row: {
          contributions: Json;
          created_at: string;
          id: number;
        };
        Insert: {
          contributions: Json;
          created_at?: string;
          id?: number;
        };
        Update: {
          contributions?: Json;
          created_at?: string;
          id?: number;
        };
        Relationships: [];
      };
      movements: {
        Row: {
          city: string | null;
          country: string | null;
          created_at: string;
          id: number;
          latitude: number;
          longitude: number;
          moved_at: string;
          neighborhood: string | null;
          radius: number;
          region: string | null;
          time_zone_id: string | null;
        };
        Insert: {
          city?: string | null;
          country?: string | null;
          created_at?: string;
          id?: number;
          latitude: number;
          longitude: number;
          moved_at: string;
          neighborhood?: string | null;
          radius: number;
          region?: string | null;
          time_zone_id?: string | null;
        };
        Update: {
          city?: string | null;
          country?: string | null;
          created_at?: string;
          id?: number;
          latitude?: number;
          longitude?: number;
          moved_at?: string;
          neighborhood?: string | null;
          radius?: number;
          region?: string | null;
          time_zone_id?: string | null;
        };
        Relationships: [];
      };
      now_playing: {
        Row: {
          by: string[];
          created_at: string;
          id: number;
          image: string | null;
          media_type: string;
          name: string;
          payload: Json;
          source: string;
        };
        Insert: {
          by: string[];
          created_at?: string;
          id?: number;
          image?: string | null;
          media_type?: string;
          name: string;
          payload: Json;
          source?: string;
        };
        Update: {
          by?: string[];
          created_at?: string;
          id?: number;
          image?: string | null;
          media_type?: string;
          name?: string;
          payload?: Json;
          source?: string;
        };
        Relationships: [];
      };
      nytimes: {
        Row: {
          created_at: string;
          id: number;
          image: string | null;
          title: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          image?: string | null;
          title: string;
          url: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          image?: string | null;
          title?: string;
          url?: string;
        };
        Relationships: [];
      };
      strava: {
        Row: {
          created_at: string;
          id: number;
          payload: Json;
          start_date: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          payload: Json;
          start_date: string;
          type: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          payload?: Json;
          start_date?: string;
          type?: string;
        };
        Relationships: [];
      };
      visits: {
        Row: {
          arrived_at: string;
          city: string | null;
          country: string | null;
          created_at: string;
          departed_at: string;
          id: number;
          latitude: number;
          longitude: number;
          neighborhood: string | null;
          radius: number;
          region: string | null;
          time_zone_id: string | null;
        };
        Insert: {
          arrived_at: string;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          departed_at: string;
          id?: number;
          latitude: number;
          longitude: number;
          neighborhood?: string | null;
          radius: number;
          region?: string | null;
          time_zone_id?: string | null;
        };
        Update: {
          arrived_at?: string;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          departed_at?: string;
          id?: number;
          latitude?: number;
          longitude?: number;
          neighborhood?: string | null;
          radius?: number;
          region?: string | null;
          time_zone_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
