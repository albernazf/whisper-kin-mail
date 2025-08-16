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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      conversations: {
        Row: {
          created_at: string
          creature_id: string | null
          id: string
          last_message_at: string
          started_by: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          creature_id?: string | null
          id?: string
          last_message_at?: string
          started_by: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          creature_id?: string | null
          id?: string
          last_message_at?: string
          started_by?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_creature_id_fkey"
            columns: ["creature_id"]
            isOneToOne: false
            referencedRelation: "creatures"
            referencedColumns: ["id"]
          },
        ]
      }
      creatures: {
        Row: {
          backstory: string | null
          conversation_state: string | null
          created_at: string
          id: string
          image_url: string | null
          name: string
          user_id: string | null
        }
        Insert: {
          backstory?: string | null
          conversation_state?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          user_id?: string | null
        }
        Update: {
          backstory?: string | null
          conversation_state?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      credit_purchases: {
        Row: {
          amount_paid: number
          completed_at: string | null
          created_at: string
          credit_type: string
          credits_purchased: number
          currency: string | null
          id: string
          status: string | null
          stripe_session_id: string | null
          user_id: string | null
        }
        Insert: {
          amount_paid: number
          completed_at?: string | null
          created_at?: string
          credit_type: string
          credits_purchased: number
          currency?: string | null
          id?: string
          status?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount_paid?: number
          completed_at?: string | null
          created_at?: string
          credit_type?: string
          credits_purchased?: number
          currency?: string | null
          id?: string
          status?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          ai_summary: string | null
          content: string | null
          context_notes: string | null
          conversation_id: string | null
          created_at: string
          credits_required: number | null
          delivery_type: string
          generation_cost: number | null
          id: string
          mailed_at: string | null
          physical_letter_image_url: string | null
          physical_mail_status: string | null
          sender_type: string
          status: string | null
        }
        Insert: {
          ai_summary?: string | null
          content?: string | null
          context_notes?: string | null
          conversation_id?: string | null
          created_at?: string
          credits_required?: number | null
          delivery_type: string
          generation_cost?: number | null
          id?: string
          mailed_at?: string | null
          physical_letter_image_url?: string | null
          physical_mail_status?: string | null
          sender_type: string
          status?: string | null
        }
        Update: {
          ai_summary?: string | null
          content?: string | null
          context_notes?: string | null
          conversation_id?: string | null
          created_at?: string
          credits_required?: number | null
          delivery_type?: string
          generation_cost?: number | null
          id?: string
          mailed_at?: string | null
          physical_letter_image_url?: string | null
          physical_mail_status?: string | null
          sender_type?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          assigned_mailing_address: string | null
          created_at: string
          credits_digital: number | null
          credits_physical: number | null
          daily_digital_replies_reset_date: string | null
          daily_digital_replies_used: number | null
          email: string
          id: string
          last_digital_reply_date: string | null
          name: string | null
          parent_email: string | null
          physical_address: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_mailing_address?: string | null
          created_at?: string
          credits_digital?: number | null
          credits_physical?: number | null
          daily_digital_replies_reset_date?: string | null
          daily_digital_replies_used?: number | null
          email: string
          id?: string
          last_digital_reply_date?: string | null
          name?: string | null
          parent_email?: string | null
          physical_address?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_mailing_address?: string | null
          created_at?: string
          credits_digital?: number | null
          credits_physical?: number | null
          daily_digital_replies_reset_date?: string | null
          daily_digital_replies_used?: number | null
          email?: string
          id?: string
          last_digital_reply_date?: string | null
          name?: string | null
          parent_email?: string | null
          physical_address?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number | null
          created_at: string
          credit_type: string
          credits_purchased: number | null
          id: string
          stripe_payment_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          credit_type: string
          credits_purchased?: number | null
          id?: string
          stripe_payment_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          credit_type?: string
          credits_purchased?: number | null
          id?: string
          stripe_payment_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_use_free_digital_reply: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      reset_daily_digital_replies: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
