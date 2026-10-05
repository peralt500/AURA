export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface SocialLinks {
  instagram?: string
  tiktok?: string
  youtube?: string
  facebook?: string
  shop?: string
  [key: string]: string | undefined
}

export interface Database {
  public: {
    Tables: {
      creators: {
        Row: {
          id: string
          user_id: string | null
          username: string
          display_name: string
          bio: string | null
          avatar_url: string | null
          social_links: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          username: string
          display_name: string
          bio?: string | null
          avatar_url?: string | null
          social_links?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          username?: string
          display_name?: string
          bio?: string | null
          avatar_url?: string | null
          social_links?: Json
          created_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          creator_id: string
          title: string
          event_date: string
          location: string | null
          ticket_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          event_date: string
          location?: string | null
          ticket_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          event_date?: string
          location?: string | null
          ticket_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_creator_id_fkey"
            columns: ["creator_id"]
            referencedRelation: "creators"
            referencedColumns: ["id"]
          }
        ]
      }
      fans: {
        Row: {
          id: string
          creator_id: string
          email: string
          confirm_token: string
          unsubscribe_token: string
          confirmed_at: string | null
          unsubscribed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          email: string
          confirm_token?: string
          unsubscribe_token?: string
          confirmed_at?: string | null
          unsubscribed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          email?: string
          confirm_token?: string
          unsubscribe_token?: string
          confirmed_at?: string | null
          unsubscribed_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fans_creator_id_fkey"
            columns: ["creator_id"]
            referencedRelation: "creators"
            referencedColumns: ["id"]
          }
        ]
      }
      broadcast_logs: {
        Row: {
          id: string
          creator_id: string
          subject: string
          body: string
          recipients_count: number
          sent_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          subject: string
          body: string
          recipients_count?: number
          sent_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          subject?: string
          body?: string
          recipients_count?: number
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_logs_creator_id_fkey"
            columns: ["creator_id"]
            referencedRelation: "creators"
            referencedColumns: ["id"]
          }
        ]
      }
      gallery_items: {
        Row: {
          id: string
          creator_id: string
          image_url: string
          caption: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          image_url: string
          caption?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          image_url?: string
          caption?: string | null
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_items_creator_id_fkey"
            columns: ["creator_id"]
            referencedRelation: "creators"
            referencedColumns: ["id"]
          }
        ]
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

// Helpers útiles para entidades tipadas directamente
export type Creator = Database['public']['Tables']['creators']['Row']
export type CreatorInsert = Database['public']['Tables']['creators']['Insert']
export type CreatorUpdate = Database['public']['Tables']['creators']['Update']

export type EventItem = Database['public']['Tables']['events']['Row']
export type EventInsert = Database['public']['Tables']['events']['Insert']
export type EventUpdate = Database['public']['Tables']['events']['Update']

export type Fan = Database['public']['Tables']['fans']['Row']
export type FanInsert = Database['public']['Tables']['fans']['Insert']
export type FanUpdate = Database['public']['Tables']['fans']['Update']

export type BroadcastLog = Database['public']['Tables']['broadcast_logs']['Row']
export type BroadcastLogInsert = Database['public']['Tables']['broadcast_logs']['Insert']

export type GalleryItem = Database['public']['Tables']['gallery_items']['Row']
export type GalleryItemInsert = Database['public']['Tables']['gallery_items']['Insert']
export type GalleryItemUpdate = Database['public']['Tables']['gallery_items']['Update']
