type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      duolingo: {
        Row: {
          courses: Json
          created_at: string
          id: number
          streak: number
        }
        Insert: {
          courses: Json
          created_at?: string
          id?: number
          streak: number
        }
        Update: {
          courses?: Json
          created_at?: string
          id?: number
          streak?: number
        }
        Relationships: []
      }
      github: {
        Row: {
          contributions: Json
          created_at: string
          id: number
        }
        Insert: {
          contributions: Json
          created_at?: string
          id?: number
        }
        Update: {
          contributions?: Json
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      movements: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: number
          latitude: number
          longitude: number
          moved_at: string
          neighborhood: string | null
          radius: number
          region: string | null
          time_zone_id: string | null
          vercel_env: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: number
          latitude: number
          longitude: number
          moved_at: string
          neighborhood?: string | null
          radius: number
          region?: string | null
          time_zone_id?: string | null
          vercel_env: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: number
          latitude?: number
          longitude?: number
          moved_at?: string
          neighborhood?: string | null
          radius?: number
          region?: string | null
          time_zone_id?: string | null
          vercel_env?: string
        }
        Relationships: []
      }
      now_playing: {
        Row: {
          by: string[] | null
          created_at: string
          id: number
          image: string | null
          media_type: string
          name: string
          payload: Json
          source: string
        }
        Insert: {
          by?: string[] | null
          created_at?: string
          id?: number
          image?: string | null
          media_type?: string
          name: string
          payload: Json
          source?: string
        }
        Update: {
          by?: string[] | null
          created_at?: string
          id?: number
          image?: string | null
          media_type?: string
          name?: string
          payload?: Json
          source?: string
        }
        Relationships: []
      }
      strava: {
        Row: {
          created_at: string
          id: number
          payload: Json
          start_date: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: number
          payload: Json
          start_date: string
          type: string
        }
        Update: {
          created_at?: string
          id?: number
          payload?: Json
          start_date?: string
          type?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          arrived_at: string
          city: string | null
          country: string | null
          created_at: string
          departed_at: string
          id: number
          latitude: number
          longitude: number
          neighborhood: string | null
          radius: number
          region: string | null
          time_zone_id: string | null
          vercel_env: string
        }
        Insert: {
          arrived_at: string
          city?: string | null
          country?: string | null
          created_at?: string
          departed_at: string
          id?: number
          latitude: number
          longitude: number
          neighborhood?: string | null
          radius: number
          region?: string | null
          time_zone_id?: string | null
          vercel_env: string
        }
        Update: {
          arrived_at?: string
          city?: string | null
          country?: string | null
          created_at?: string
          departed_at?: string
          id?: number
          latitude?: number
          longitude?: number
          neighborhood?: string | null
          radius?: number
          region?: string | null
          time_zone_id?: string | null
          vercel_env?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
