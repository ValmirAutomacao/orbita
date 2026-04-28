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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          cancelled_by: string | null
          cancelled_reason: string | null
          client_id: string
          created_at: string
          currency: string
          duration_min: number
          ends_at: string
          id: string
          notes: string | null
          price_snapshot: number
          professional_id: string
          service_id: string
          source: string | null
          starts_at: string
          status: string
          tenant_id: string
          updated_at: string
          wa_confirm_sent: boolean
          wa_remind_24h: boolean
          wa_remind_2h: boolean
          wa_remind_30m: boolean
        }
        Insert: {
          cancelled_by?: string | null
          cancelled_reason?: string | null
          client_id: string
          created_at?: string
          currency?: string
          duration_min: number
          ends_at: string
          id?: string
          notes?: string | null
          price_snapshot?: number
          professional_id: string
          service_id: string
          source?: string | null
          starts_at: string
          status?: string
          tenant_id: string
          updated_at?: string
          wa_confirm_sent?: boolean
          wa_remind_24h?: boolean
          wa_remind_2h?: boolean
          wa_remind_30m?: boolean
        }
        Update: {
          cancelled_by?: string | null
          cancelled_reason?: string | null
          client_id?: string
          created_at?: string
          currency?: string
          duration_min?: number
          ends_at?: string
          id?: string
          notes?: string | null
          price_snapshot?: number
          professional_id?: string
          service_id?: string
          source?: string | null
          starts_at?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          wa_confirm_sent?: boolean
          wa_remind_24h?: boolean
          wa_remind_2h?: boolean
          wa_remind_30m?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json | null
          resource: string | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          resource?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          resource?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          birth_date: string | null
          created_at: string
          email: string | null
          full_name: string
          gender: string | null
          id: string
          is_active: boolean
          loyalty_points: number
          notes: string | null
          phone: string | null
          source: string | null
          tenant_id: string
          updated_at: string
          whatsapp_optin: boolean
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          gender?: string | null
          id?: string
          is_active?: boolean
          loyalty_points?: number
          notes?: string | null
          phone?: string | null
          source?: string | null
          tenant_id: string
          updated_at?: string
          whatsapp_optin?: boolean
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          is_active?: boolean
          loyalty_points?: number
          notes?: string | null
          phone?: string | null
          source?: string | null
          tenant_id?: string
          updated_at?: string
          whatsapp_optin?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string
          client_id: string
          created_at: string
          currency: string
          id: string
          mb_ref: string | null
          method: string
          notes: string | null
          paid_at: string | null
          pix_qr_code: string | null
          refunded_at: string | null
          status: string
          stripe_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          appointment_id: string
          client_id: string
          created_at?: string
          currency?: string
          id?: string
          mb_ref?: string | null
          method: string
          notes?: string | null
          paid_at?: string | null
          pix_qr_code?: string | null
          refunded_at?: string | null
          status?: string
          stripe_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          appointment_id?: string
          client_id?: string
          created_at?: string
          currency?: string
          id?: string
          mb_ref?: string | null
          method?: string
          notes?: string | null
          paid_at?: string | null
          pix_qr_code?: string | null
          refunded_at?: string | null
          status?: string
          stripe_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          max_appointments: number
          max_professionals: number
          name: string
          price_brl: number | null
          price_eur: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_appointments?: number
          max_professionals?: number
          name: string
          price_brl?: number | null
          price_eur?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_appointments?: number
          max_professionals?: number
          name?: string
          price_brl?: number | null
          price_eur?: number | null
        }
        Relationships: []
      }
      professional_services: {
        Row: {
          professional_id: string
          service_id: string
          tenant_id: string
        }
        Insert: {
          professional_id: string
          service_id: string
          tenant_id: string
        }
        Update: {
          professional_id?: string
          service_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          avatar_url: string | null
          color: string | null
          commission_pct: number | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          license_no: string | null
          phone: string | null
          specialty: string | null
          tenant_id: string
          updated_at: string
          user_id: string | null
          work_hours: Json
        }
        Insert: {
          avatar_url?: string | null
          color?: string | null
          commission_pct?: number | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          license_no?: string | null
          phone?: string | null
          specialty?: string | null
          tenant_id: string
          updated_at?: string
          user_id?: string | null
          work_hours?: Json
        }
        Update: {
          avatar_url?: string | null
          color?: string | null
          commission_pct?: number | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          license_no?: string | null
          phone?: string | null
          specialty?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
          work_hours?: Json
        }
        Relationships: [
          {
            foreignKeyName: "professionals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professionals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          tenant_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          tenant_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category_id: string | null
          color: string | null
          created_at: string
          currency: string
          description: string | null
          duration_min: number
          id: string
          is_active: boolean
          is_template: boolean
          name: string
          price: number
          requires_plan: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          color?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          duration_min?: number
          id?: string
          is_active?: boolean
          is_template?: boolean
          name: string
          price?: number
          requires_plan?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          color?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          duration_min?: number
          id?: string
          is_active?: boolean
          is_template?: boolean
          name?: string
          price?: number
          requires_plan?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_settings: {
        Row: {
          address: Json
          business_hours: Json
          created_at: string
          id: string
          payment_methods: Json
          tenant_id: string
          tutorial_completed: boolean
          tutorial_step: number
          tutorial_video_aesthetic: string | null
          tutorial_video_barbershop: string | null
          tutorial_video_clinic: string | null
          tutorial_video_salon: string | null
          updated_at: string
          whatsapp_msg_template: string | null
          whatsapp_notify_on_status: boolean
          whatsapp_number: string | null
        }
        Insert: {
          address?: Json
          business_hours?: Json
          created_at?: string
          id?: string
          payment_methods?: Json
          tenant_id: string
          tutorial_completed?: boolean
          tutorial_step?: number
          tutorial_video_aesthetic?: string | null
          tutorial_video_barbershop?: string | null
          tutorial_video_clinic?: string | null
          tutorial_video_salon?: string | null
          updated_at?: string
          whatsapp_msg_template?: string | null
          whatsapp_notify_on_status?: boolean
          whatsapp_number?: string | null
        }
        Update: {
          address?: Json
          business_hours?: Json
          created_at?: string
          id?: string
          payment_methods?: Json
          tenant_id?: string
          tutorial_completed?: boolean
          tutorial_step?: number
          tutorial_video_aesthetic?: string | null
          tutorial_video_barbershop?: string | null
          tutorial_video_clinic?: string | null
          tutorial_video_salon?: string | null
          updated_at?: string
          whatsapp_msg_template?: string | null
          whatsapp_notify_on_status?: boolean
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_whatsapp_config: {
        Row: {
          confirmed_business: boolean
          connected_at: string | null
          created_at: string
          delay_max_s: number
          delay_min_s: number
          id: string
          instance_id: string | null
          instance_name: string | null
          instance_token: string | null
          is_business: boolean | null
          is_new_number: boolean
          last_disconnect_at: string | null
          last_disconnect_reason: string | null
          owner_jid: string | null
          phone_number: string | null
          profile_name: string | null
          proxy_enabled: boolean
          proxy_url: string | null
          status: string
          tenant_id: string
          updated_at: string
          warmup_msgs_today: number
          warmup_started_at: string | null
          warmup_week: number
          webhook_configured_at: string | null
          webhook_url: string | null
        }
        Insert: {
          confirmed_business?: boolean
          connected_at?: string | null
          created_at?: string
          delay_max_s?: number
          delay_min_s?: number
          id?: string
          instance_id?: string | null
          instance_name?: string | null
          instance_token?: string | null
          is_business?: boolean | null
          is_new_number?: boolean
          last_disconnect_at?: string | null
          last_disconnect_reason?: string | null
          owner_jid?: string | null
          phone_number?: string | null
          profile_name?: string | null
          proxy_enabled?: boolean
          proxy_url?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          warmup_msgs_today?: number
          warmup_started_at?: string | null
          warmup_week?: number
          webhook_configured_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          confirmed_business?: boolean
          connected_at?: string | null
          created_at?: string
          delay_max_s?: number
          delay_min_s?: number
          id?: string
          instance_id?: string | null
          instance_name?: string | null
          instance_token?: string | null
          is_business?: boolean | null
          is_new_number?: boolean
          last_disconnect_at?: string | null
          last_disconnect_reason?: string | null
          owner_jid?: string | null
          phone_number?: string | null
          profile_name?: string | null
          proxy_enabled?: boolean
          proxy_url?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          warmup_msgs_today?: number
          warmup_started_at?: string | null
          warmup_week?: number
          webhook_configured_at?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_whatsapp_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          business_name: string
          country: string
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          niche: string
          phone: string | null
          plan_id: string | null
          slug: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          business_name: string
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          niche?: string
          phone?: string | null
          plan_id?: string | null
          slug: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          business_name?: string
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          niche?: string
          phone?: string | null
          plan_id?: string | null
          slug?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          role_id: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          role_id?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          role_id?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_health_metrics: {
        Row: {
          block_count: number
          created_at: string
          date: string
          delivery_rate: number | null
          health_score: number | null
          id: string
          msgs_limit_hit: boolean
          msgs_received: number
          msgs_sent: number
          response_rate: number | null
          tenant_id: string
          unique_recipients: number
          warmup_week: number
        }
        Insert: {
          block_count?: number
          created_at?: string
          date: string
          delivery_rate?: number | null
          health_score?: number | null
          id?: string
          msgs_limit_hit?: boolean
          msgs_received?: number
          msgs_sent?: number
          response_rate?: number | null
          tenant_id: string
          unique_recipients?: number
          warmup_week?: number
        }
        Update: {
          block_count?: number
          created_at?: string
          date?: string
          delivery_rate?: number | null
          health_score?: number | null
          id?: string
          msgs_limit_hit?: boolean
          msgs_received?: number
          msgs_sent?: number
          response_rate?: number | null
          tenant_id?: string
          unique_recipients?: number
          warmup_week?: number
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_health_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages_log: {
        Row: {
          client_id: string | null
          content: string | null
          direction: string
          from_phone: string
          id: number
          media_url: string | null
          message_id: string
          status: string
          tenant_id: string
          timestamp: string
          to_phone: string
          track_id: string | null
          track_source: string | null
          triggered_optout: boolean
          type: string
        }
        Insert: {
          client_id?: string | null
          content?: string | null
          direction: string
          from_phone: string
          id?: number
          media_url?: string | null
          message_id: string
          status?: string
          tenant_id: string
          timestamp?: string
          to_phone: string
          track_id?: string | null
          track_source?: string | null
          triggered_optout?: boolean
          type?: string
        }
        Update: {
          client_id?: string | null
          content?: string | null
          direction?: string
          from_phone?: string
          id?: number
          media_url?: string | null
          message_id?: string
          status?: string
          tenant_id?: string
          timestamp?: string
          to_phone?: string
          track_id?: string | null
          track_source?: string | null
          triggered_optout?: boolean
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_optout: {
        Row: {
          id: string
          keyword_used: string | null
          opted_out_at: string
          phone: string
          reactivated_at: string | null
          tenant_id: string
        }
        Insert: {
          id?: string
          keyword_used?: string | null
          opted_out_at?: string
          phone: string
          reactivated_at?: string | null
          tenant_id: string
        }
        Update: {
          id?: string
          keyword_used?: string | null
          opted_out_at?: string
          phone?: string
          reactivated_at?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_optout_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      jwt_professional_id: { Args: never; Returns: string }
      jwt_tenant_id: { Args: never; Returns: string }
      jwt_user_role: { Args: never; Returns: string }
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
