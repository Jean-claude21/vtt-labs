export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      lifeos_domains: {
        Row: {
          color: string
          created_at: string
          daily_target_minutes: number | null
          icon: string
          id: string
          is_default: boolean
          name: string
          sort_order: number
          updated_at: string
          user_id: string
          vision: string | null
          weekly_target_minutes: number | null
        }
        Insert: {
          color?: string
          created_at?: string
          daily_target_minutes?: number | null
          icon?: string
          id?: string
          is_default?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
          vision?: string | null
          weekly_target_minutes?: number | null
        }
        Update: {
          color?: string
          created_at?: string
          daily_target_minutes?: number | null
          icon?: string
          id?: string
          is_default?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
          vision?: string | null
          weekly_target_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lifeos_domains_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lifeos_generated_plans: {
        Row: {
          ai_model: string | null
          created_at: string
          date: string
          generation_params: Json | null
          id: string
          optimization_score: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          created_at?: string
          date: string
          generation_params?: Json | null
          id?: string
          optimization_score?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_model?: string | null
          created_at?: string
          date?: string
          generation_params?: Json | null
          id?: string
          optimization_score?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lifeos_generated_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lifeos_plan_slots: {
        Row: {
          ai_reasoning: string | null
          created_at: string
          end_time: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_locked: boolean
          plan_id: string
          slot_type: string
          sort_order: number
          start_time: string
          user_id: string
          was_executed: boolean
        }
        Insert: {
          ai_reasoning?: string | null
          created_at?: string
          end_time: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_locked?: boolean
          plan_id: string
          slot_type: string
          sort_order?: number
          start_time: string
          user_id: string
          was_executed?: boolean
        }
        Update: {
          ai_reasoning?: string | null
          created_at?: string
          end_time?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_locked?: boolean
          plan_id?: string
          slot_type?: string
          sort_order?: number
          start_time?: string
          user_id?: string
          was_executed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "lifeos_plan_slots_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "lifeos_generated_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lifeos_plan_slots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lifeos_projects: {
        Row: {
          created_at: string
          description: string | null
          domain_id: string | null
          id: string
          name: string
          start_date: string | null
          status: string
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          domain_id?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          domain_id?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lifeos_projects_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "lifeos_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lifeos_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lifeos_routine_instance_tasks: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          routine_instance_id: string
          task_id: string
          time_spent_minutes: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          routine_instance_id: string
          task_id: string
          time_spent_minutes?: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          routine_instance_id?: string
          task_id?: string
          time_spent_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "lifeos_routine_instance_tasks_routine_instance_id_fkey"
            columns: ["routine_instance_id"]
            isOneToOne: false
            referencedRelation: "lifeos_routine_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lifeos_routine_instance_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "lifeos_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      lifeos_routine_instances: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          actual_value: number | null
          completion_score: number | null
          created_at: string
          energy_level: number | null
          id: string
          mood_after: number | null
          mood_before: number | null
          notes: string | null
          scheduled_date: string
          scheduled_end: string | null
          scheduled_start: string | null
          skip_reason: string | null
          status: string
          template_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          actual_value?: number | null
          completion_score?: number | null
          created_at?: string
          energy_level?: number | null
          id?: string
          mood_after?: number | null
          mood_before?: number | null
          notes?: string | null
          scheduled_date: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          skip_reason?: string | null
          status?: string
          template_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          actual_value?: number | null
          completion_score?: number | null
          created_at?: string
          energy_level?: number | null
          id?: string
          mood_after?: number | null
          mood_before?: number | null
          notes?: string | null
          scheduled_date?: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          skip_reason?: string | null
          status?: string
          template_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lifeos_routine_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "lifeos_routine_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lifeos_routine_instances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lifeos_routine_templates: {
        Row: {
          category_moment: string | null
          category_type: string | null
          constraints: Json
          created_at: string
          description: string | null
          domain_id: string | null
          id: string
          is_active: boolean
          is_flexible: boolean
          name: string
          priority: string
          recurrence_config: Json
          recurrence_rule: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_moment?: string | null
          category_type?: string | null
          constraints?: Json
          created_at?: string
          description?: string | null
          domain_id?: string | null
          id?: string
          is_active?: boolean
          is_flexible?: boolean
          name: string
          priority?: string
          recurrence_config?: Json
          recurrence_rule: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_moment?: string | null
          category_type?: string | null
          constraints?: Json
          created_at?: string
          description?: string | null
          domain_id?: string | null
          id?: string
          is_active?: boolean
          is_flexible?: boolean
          name?: string
          priority?: string
          recurrence_config?: Json
          recurrence_rule?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lifeos_routine_templates_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "lifeos_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lifeos_routine_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lifeos_streaks: {
        Row: {
          current_streak: number
          id: string
          last_completed_date: string | null
          longest_streak: number
          routine_template_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          id?: string
          last_completed_date?: string | null
          longest_streak?: number
          routine_template_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          id?: string
          last_completed_date?: string | null
          longest_streak?: number
          routine_template_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lifeos_streaks_routine_template_id_fkey"
            columns: ["routine_template_id"]
            isOneToOne: true
            referencedRelation: "lifeos_routine_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lifeos_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lifeos_tasks: {
        Row: {
          actual_minutes: number | null
          created_at: string
          description: string | null
          domain_id: string | null
          due_date: string | null
          due_time: string | null
          estimated_minutes: number | null
          id: string
          is_deadline_strict: boolean
          parent_task_id: string | null
          priority: string
          project_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_minutes?: number | null
          created_at?: string
          description?: string | null
          domain_id?: string | null
          due_date?: string | null
          due_time?: string | null
          estimated_minutes?: number | null
          id?: string
          is_deadline_strict?: boolean
          parent_task_id?: string | null
          priority?: string
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_minutes?: number | null
          created_at?: string
          description?: string | null
          domain_id?: string | null
          due_date?: string | null
          due_time?: string | null
          estimated_minutes?: number | null
          id?: string
          is_deadline_strict?: boolean
          parent_task_id?: string | null
          priority?: string
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lifeos_tasks_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "lifeos_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lifeos_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "lifeos_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lifeos_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "lifeos_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lifeos_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      shared_access: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          owner_id: string
          permission: string | null
          resource_id: string | null
          resource_type: string
          shared_with_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          owner_id: string
          permission?: string | null
          resource_id?: string | null
          resource_type: string
          shared_with_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          owner_id?: string
          permission?: string | null
          resource_id?: string | null
          resource_type?: string
          shared_with_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_access_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_access_shared_with_id_fkey"
            columns: ["shared_with_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      todo_list: {
        Row: {
          created_at: string
          description: string | null
          done: boolean
          done_at: string | null
          id: number
          owner: string
          title: string
          urgent: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          done?: boolean
          done_at?: string | null
          id?: number
          owner: string
          title: string
          urgent?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          done?: boolean
          done_at?: string | null
          id?: number
          owner?: string
          title?: string
          urgent?: boolean
        }
        Relationships: []
      }
      user_module_access: {
        Row: {
          enabled: boolean | null
          granted_at: string | null
          granted_by: string | null
          module_slug: string
          user_id: string
        }
        Insert: {
          enabled?: boolean | null
          granted_at?: string | null
          granted_by?: string | null
          module_slug: string
          user_id: string
        }
        Update: {
          enabled?: boolean | null
          granted_at?: string | null
          granted_by?: string | null
          module_slug?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_access_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_module_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      lifeos_get_daily_analytics: {
        Args: { p_date: string; p_user_id: string }
        Returns: Json
      }
      lifeos_seed_default_domains: {
        Args: { p_user_id: string }
        Returns: {
          color: string
          created_at: string
          daily_target_minutes: number | null
          icon: string
          id: string
          is_default: boolean
          name: string
          sort_order: number
          updated_at: string
          user_id: string
          vision: string | null
          weekly_target_minutes: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "lifeos_domains"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      lifeos_update_streak: {
        Args: { p_completed_date: string; p_routine_template_id: string }
        Returns: {
          current_streak: number
          id: string
          last_completed_date: string | null
          longest_streak: number
          routine_template_id: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "lifeos_streaks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      user_has_module_access: {
        Args: { p_module_slug: string; p_user_id: string }
        Returns: boolean
      }
      user_has_shared_access: {
        Args: {
          p_min_permission?: string
          p_resource_id: string
          p_resource_type: string
          p_user_id: string
        }
        Returns: boolean
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

