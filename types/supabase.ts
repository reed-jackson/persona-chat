export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender: string
          thread_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender: string
          thread_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      personas: {
        Row: {
          age: number
          created_at: string
          experience: string
          id: string
          is_deleted: boolean | null
          name: string
          pain_points: string
          personality: string
          system_prompt: string
          updated_at: string
          user_id: string
          values: string
        }
        Insert: {
          age: number
          created_at?: string
          experience: string
          id?: string
          is_deleted?: boolean | null
          name: string
          pain_points: string
          personality: string
          system_prompt: string
          updated_at?: string
          user_id: string
          values: string
        }
        Update: {
          age?: number
          created_at?: string
          experience?: string
          id?: string
          is_deleted?: boolean | null
          name?: string
          pain_points?: string
          personality?: string
          system_prompt?: string
          updated_at?: string
          user_id?: string
          values?: string
        }
        Relationships: []
      }
      threads: {
        Row: {
          created_at: string
          id: string
          persona_id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          persona_id: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          persona_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      workplace_context: {
        Row: {
          company_name: string
          created_at: string
          description: string
          id: string
          industry: string
          product_name: string
          target_audience: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string
          description: string
          id?: string
          industry: string
          product_name: string
          target_audience: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          description?: string
          id?: string
          industry?: string
          product_name?: string
          target_audience?: string
          updated_at?: string
          user_id?: string
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
