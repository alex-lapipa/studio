export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      chunks: {
        Row: {
          chunk_index: number
          content: string
          document_id: string
          embedding: string | null
          fts: unknown
          id: number
          page_end: number | null
          page_start: number | null
          section: string | null
        }
        Insert: {
          chunk_index: number
          content: string
          document_id: string
          embedding?: string | null
          fts?: unknown
          id?: never
          page_end?: number | null
          page_start?: number | null
          section?: string | null
        }
        Update: {
          chunk_index?: number
          content?: string
          document_id?: string
          embedding?: string | null
          fts?: unknown
          id?: never
          page_end?: number | null
          page_start?: number | null
          section?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      computers: {
        Row: {
          architecture: string | null
          created_at: string
          hardware_model: string | null
          hostname: string | null
          id: string
          memory_bytes: number | null
          name: string
          notes: string | null
          os_build: string | null
          os_version: string | null
          platform: string
          updated_at: string
        }
        Insert: {
          architecture?: string | null
          created_at?: string
          hardware_model?: string | null
          hostname?: string | null
          id?: string
          memory_bytes?: number | null
          name: string
          notes?: string | null
          os_build?: string | null
          os_version?: string | null
          platform: string
          updated_at?: string
        }
        Update: {
          architecture?: string | null
          created_at?: string
          hardware_model?: string | null
          hostname?: string | null
          id?: string
          memory_bytes?: number | null
          name?: string
          notes?: string | null
          os_build?: string | null
          os_version?: string | null
          platform?: string
          updated_at?: string
        }
        Relationships: []
      }
      connections: {
        Row: {
          channel_map: string | null
          connection_type: string
          created_at: string
          destination_endpoint_id: string | null
          id: string
          notes: string | null
          observed_at: string | null
          source_endpoint_id: string | null
          status: string
        }
        Insert: {
          channel_map?: string | null
          connection_type: string
          created_at?: string
          destination_endpoint_id?: string | null
          id?: string
          notes?: string | null
          observed_at?: string | null
          source_endpoint_id?: string | null
          status?: string
        }
        Update: {
          channel_map?: string | null
          connection_type?: string
          created_at?: string
          destination_endpoint_id?: string | null
          id?: string
          notes?: string | null
          observed_at?: string | null
          source_endpoint_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_destination_endpoint_id_fkey"
            columns: ["destination_endpoint_id"]
            isOneToOne: false
            referencedRelation: "endpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_source_endpoint_id_fkey"
            columns: ["source_endpoint_id"]
            isOneToOne: false
            referencedRelation: "endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      document_entities: {
        Row: {
          created_at: string
          document_id: string
          entity_id: string
          entity_type: string
          relationship: string
        }
        Insert: {
          created_at?: string
          document_id: string
          entity_id: string
          entity_type: string
          relationship?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          entity_id?: string
          entity_type?: string
          relationship?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_entities_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          checksum: string | null
          created_at: string
          doc_type: string
          gear_id: string | null
          id: string
          ingested_at: string | null
          pages: number | null
          source_bucket: string | null
          source_path: string | null
          source_url: string | null
          status: string
          title: string
        }
        Insert: {
          checksum?: string | null
          created_at?: string
          doc_type: string
          gear_id?: string | null
          id?: string
          ingested_at?: string | null
          pages?: number | null
          source_bucket?: string | null
          source_path?: string | null
          source_url?: string | null
          status?: string
          title: string
        }
        Update: {
          checksum?: string | null
          created_at?: string
          doc_type?: string
          gear_id?: string | null
          id?: string
          ingested_at?: string | null
          pages?: number | null
          source_bucket?: string | null
          source_path?: string | null
          source_url?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_gear_id_fkey"
            columns: ["gear_id"]
            isOneToOne: false
            referencedRelation: "gear"
            referencedColumns: ["id"]
          },
        ]
      }
      endpoints: {
        Row: {
          active: boolean | null
          channels_in: number | null
          channels_out: number | null
          computer_id: string | null
          created_at: string
          direction: string | null
          endpoint_type: string
          gear_id: string | null
          id: string
          is_default_input: boolean | null
          is_default_output: boolean | null
          metadata: Json
          name: string
          observed_at: string | null
          sample_rate_hz: number | null
          transport: string | null
        }
        Insert: {
          active?: boolean | null
          channels_in?: number | null
          channels_out?: number | null
          computer_id?: string | null
          created_at?: string
          direction?: string | null
          endpoint_type: string
          gear_id?: string | null
          id?: string
          is_default_input?: boolean | null
          is_default_output?: boolean | null
          metadata?: Json
          name: string
          observed_at?: string | null
          sample_rate_hz?: number | null
          transport?: string | null
        }
        Update: {
          active?: boolean | null
          channels_in?: number | null
          channels_out?: number | null
          computer_id?: string | null
          created_at?: string
          direction?: string | null
          endpoint_type?: string
          gear_id?: string | null
          id?: string
          is_default_input?: boolean | null
          is_default_output?: boolean | null
          metadata?: Json
          name?: string
          observed_at?: string | null
          sample_rate_hz?: number | null
          transport?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "endpoints_computer_id_fkey"
            columns: ["computer_id"]
            isOneToOne: false
            referencedRelation: "computers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "endpoints_gear_id_fkey"
            columns: ["gear_id"]
            isOneToOne: false
            referencedRelation: "gear"
            referencedColumns: ["id"]
          },
        ]
      }
      gear: {
        Row: {
          category: string
          created_at: string
          id: string
          io_summary: string | null
          make: string
          midi_channels: string | null
          model: string
          notes: string | null
          role_in_studio: string | null
          sync_capabilities: string | null
          synthesis_type: string | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          io_summary?: string | null
          make: string
          midi_channels?: string | null
          model: string
          notes?: string | null
          role_in_studio?: string | null
          sync_capabilities?: string | null
          synthesis_type?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          io_summary?: string | null
          make?: string
          midi_channels?: string | null
          model?: string
          notes?: string | null
          role_in_studio?: string | null
          sync_capabilities?: string | null
          synthesis_type?: string | null
        }
        Relationships: []
      }
      observations: {
        Row: {
          confidence: number | null
          created_at: string
          entity_id: string | null
          entity_type: string
          evidence_type: string
          fact_key: string
          fact_value: Json
          id: number
          notes: string | null
          observed_at: string
          observer: string
          source_document_id: string | null
          source_ref: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          evidence_type: string
          fact_key: string
          fact_value: Json
          id?: never
          notes?: string | null
          observed_at?: string
          observer: string
          source_document_id?: string | null
          source_ref?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          evidence_type?: string
          fact_key?: string
          fact_value?: Json
          id?: never
          notes?: string | null
          observed_at?: string
          observer?: string
          source_document_id?: string | null
          source_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "observations_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      plugins: {
        Row: {
          computer_id: string | null
          created_at: string
          format: string
          id: string
          name: string
          notes: string | null
          observed_at: string | null
          path: string | null
          vendor: string | null
          version: string | null
        }
        Insert: {
          computer_id?: string | null
          created_at?: string
          format: string
          id?: string
          name: string
          notes?: string | null
          observed_at?: string | null
          path?: string | null
          vendor?: string | null
          version?: string | null
        }
        Update: {
          computer_id?: string | null
          created_at?: string
          format?: string
          id?: string
          name?: string
          notes?: string | null
          observed_at?: string | null
          path?: string | null
          vendor?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plugins_computer_id_fkey"
            columns: ["computer_id"]
            isOneToOne: false
            referencedRelation: "computers"
            referencedColumns: ["id"]
          },
        ]
      }
      software: {
        Row: {
          bundle_id: string | null
          category: string | null
          computer_id: string | null
          created_at: string
          id: string
          install_path: string | null
          name: string
          notes: string | null
          observed_at: string | null
          vendor: string | null
          version: string | null
        }
        Insert: {
          bundle_id?: string | null
          category?: string | null
          computer_id?: string | null
          created_at?: string
          id?: string
          install_path?: string | null
          name: string
          notes?: string | null
          observed_at?: string | null
          vendor?: string | null
          version?: string | null
        }
        Update: {
          bundle_id?: string | null
          category?: string | null
          computer_id?: string | null
          created_at?: string
          id?: string
          install_path?: string | null
          name?: string
          notes?: string | null
          observed_at?: string | null
          vendor?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "software_computer_id_fkey"
            columns: ["computer_id"]
            isOneToOne: false
            referencedRelation: "computers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      internal_get_secret: { Args: { secret_name: string }; Returns: string }
      search_knowledge: {
        Args: {
          filter_gear?: string
          match_count?: number
          query_embedding: string
          query_text: string
        }
        Returns: {
          chunk_id: number
          content: string
          doc_type: string
          document_id: string
          document_title: string
          gear: string
          page_start: number
          score: number
          section: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
