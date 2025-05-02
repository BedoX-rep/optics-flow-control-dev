export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          Add: number | null;
          created_at: string | null;
          favorite: boolean;
          gender: string | null;
          id: string;
          is_deleted: boolean | null;
          left_eye_axe: number | null;
          left_eye_cyl: number | null;
          left_eye_sph: number | null;
          name: string;
          notes: string | null;
          phone: string;
          right_eye_axe: number | null;
          right_eye_cyl: number | null;
          right_eye_sph: number | null;
          user_id: string;
        };
        Insert: {
          Add?: number | null;
          created_at?: string | null;
          favorite?: boolean;
          gender?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          left_eye_axe?: number | null;
          left_eye_cyl?: number | null;
          left_eye_sph?: number | null;
          name: string;
          notes?: string | null;
          phone: string;
          right_eye_axe?: number | null;
          right_eye_cyl?: number | null;
          right_eye_sph?: number | null;
          user_id: string;
        };
        Update: {
          Add?: number | null;
          created_at?: string | null;
          favorite?: boolean;
          gender?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          left_eye_axe?: number | null;
          left_eye_cyl?: number | null;
          left_eye_sph?: number | null;
          name?: string;
          notes?: string | null;
          phone?: string;
          right_eye_axe?: number | null;
          right_eye_cyl?: number | null;
          right_eye_sph?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          display_name: string;
          store_name: string;
          referred_by: string | null;
          referral_code: string | null;
          subscription_status: "Active" | "Suspended" | "Cancelled" | "inActive" | "Expired";
          subscription_type: "Trial" | "Monthly" | "Quarterly" | "Lifetime";
          trial_used: boolean;
          is_admin: boolean;
          is_recurring: boolean;
          price: number;
          start_date: string | null;
          end_date: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          display_name: string;
          store_name: string;
          referred_by?: string | null;
          referral_code?: string | null;
          subscription_status?: "Active" | "Suspended" | "Cancelled" | "inActive" | "Expired";
          subscription_type?: "Trial" | "Monthly" | "Quarterly" | "Lifetime";
          trial_used?: boolean;
          is_admin?: boolean;
          is_recurring?: boolean;
          price?: number;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          display_name?: string;
          store_name?: string;
          referred_by?: string | null;
          referral_code?: string | null;
          subscription_status?: "Active" | "Suspended" | "Cancelled" | "inActive" | "Expired";
          subscription_type?: "Trial" | "Monthly" | "Quarterly" | "Lifetime";
          trial_used?: boolean;
          is_admin?: boolean;
          is_recurring?: boolean;
          price?: number;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          category: string | null;
          company: string | null;
          Cost: number;
          created_at: string | null;
          id: string;
          image: string | null;
          index: string | null;
          is_deleted: boolean | null;
          name: string;
          position: number;
          price: number;
          stock: number;
          treatment: string | null;
          user_id: string;
        };
        Insert: {
          category?: string | null;
          company?: string | null;
          Cost?: number;
          created_at?: string | null;
          id?: string;
          image?: string | null;
          index?: string | null;
          is_deleted?: boolean | null;
          name: string;
          position?: number;
          price: number;
          stock?: number;
          treatment?: string | null;
          user_id: string;
        };
        Update: {
          category?: string | null;
          company?: string | null;
          Cost?: number;
          created_at?: string | null;
          id?: string;
          image?: string | null;
          index?: string | null;
          is_deleted?: boolean | null;
          name?: string;
          position?: number;
          price?: number;
          stock?: number;
          treatment?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      receipt_items: {
        Row: {
          created_at: string | null;
          custom_item_name: string | null;
          id: string;
          is_deleted: boolean | null;
          price: number;
          product_id: string | null;
          quantity: number;
          receipt_id: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          custom_item_name?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          price: number;
          product_id?: string | null;
          quantity: number;
          receipt_id?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          custom_item_name?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          price?: number;
          product_id?: string | null;
          quantity?: number;
          receipt_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "receipt_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "receipt_items_receipt_id_fkey";
            columns: ["receipt_id"];
            isOneToOne: false;
            referencedRelation: "receipts";
            referencedColumns: ["id"];
          },
        ];
      };
      receipts: {
        Row: {
          add: number | null;
          advance_payment: number | null;
          balance: number;
          client_id: string | null;
          cost: number | null;
          created_at: string | null;
          delivery_status: string;
          discount_amount: number | null;
          discount_percentage: number | null;
          id: string;
          is_deleted: boolean | null;
          left_eye_axe: number | null;
          left_eye_cyl: number | null;
          left_eye_sph: number | null;
          montage_status: string;
          right_eye_axe: number | null;
          right_eye_cyl: number | null;
          right_eye_sph: number | null;
          subtotal: number;
          tax: number;
          total: number;
          user_id: string;
        };
        Insert: {
          add?: number | null;
          advance_payment?: number | null;
          balance?: number;
          client_id?: string | null;
          cost?: number | null;
          created_at?: string | null;
          delivery_status?: string;
          discount_amount?: number | null;
          discount_percentage?: number | null;
          id?: string;
          is_deleted?: boolean | null;
          left_eye_axe?: number | null;
          left_eye_cyl?: number | null;
          left_eye_sph?: number | null;
          montage_status?: string;
          right_eye_axe?: number | null;
          right_eye_cyl?: number | null;
          right_eye_sph?: number | null;
          subtotal: number;
          tax: number;
          total: number;
          user_id: string;
        };
        Update: {
          add?: number | null;
          advance_payment?: number | null;
          balance?: number;
          client_id?: string | null;
          cost?: number | null;
          created_at?: string | null;
          delivery_status?: string;
          discount_amount?: number | null;
          discount_percentage?: number | null;
          id?: string;
          is_deleted?: boolean | null;
          left_eye_axe?: number | null;
          left_eye_cyl?: number | null;
          left_eye_sph?: number | null;
          montage_status?: string;
          right_eye_axe?: number | null;
          right_eye_cyl?: number | null;
          right_eye_sph?: number | null;
          subtotal?: number;
          tax?: number;
          total?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "receipts_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      subscription_logs: {
        Row: {
          change_type: string;
          changed_by: string;
          created_at: string | null;
          id: string;
          new_data: Json | null;
          previous_data: Json | null;
          subscription_id: string;
        };
        Insert: {
          change_type: string;
          changed_by: string;
          created_at?: string | null;
          id?: string;
          new_data?: Json | null;
          previous_data?: Json | null;
          subscription_id: string;
        };
        Update: {
          change_type?: string;
          changed_by?: string;
          created_at?: string | null;
          id?: string;
          new_data?: Json | null;
          previous_data?: Json | null;
          subscription_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscription_logs_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
    }
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_and_renew_subscriptions: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      get_subscription_stats: {
        Args: Record<PropertyKey, never>;
        Returns: {
          active_count: number;
          total_revenue: number;
          monthly_revenue: number;
          quarterly_revenue: number;
          lifetime_revenue: number;
          trial_count: number;
        }[];
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      subscription_status: "Active" | "Suspended" | "Cancelled" | "inActive" | "Expired";
      subscription_type: "Trial" | "Monthly" | "Quarterly" | "Lifetime";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
          Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"]
      )
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"]
    )[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[
      DefaultSchemaTableNameOrOptions
    ] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][
      CompositeTypeName
    ]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {
      subscription_status: [
        "Active",
        "Suspended",
        "Cancelled",
        "inActive",
        "Expired",
      ],
      subscription_type: ["Trial", "Monthly", "Quarterly", "Lifetime"],
    },
  },
} as const;