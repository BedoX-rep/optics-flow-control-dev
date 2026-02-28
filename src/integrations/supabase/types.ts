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
      clients: {
        Row: {
          Add: number | null
          assurance: string | null
          created_at: string | null
          favorite: boolean
          gender: string | null
          id: string
          is_deleted: boolean | null
          last_prescription_update: string | null
          left_eye_axe: number
          left_eye_cyl: number
          left_eye_sph: number
          name: string
          need_renewal: boolean | null
          notes: string | null
          phone: string
          renewal_date: string | null
          renewal_times: number | null
          right_eye_axe: number
          right_eye_cyl: number
          right_eye_sph: number
          user_id: string
        }
        Insert: {
          Add?: number | null
          assurance?: string | null
          created_at?: string | null
          favorite?: boolean
          gender?: string | null
          id?: string
          is_deleted?: boolean | null
          last_prescription_update?: string | null
          left_eye_axe?: number | null
          left_eye_cyl?: number | null
          left_eye_sph?: number | null
          name: string
          need_renewal?: boolean | null
          notes?: string | null
          phone: string
          renewal_date?: string | null
          renewal_times?: number | null
          right_eye_axe?: number | null
          right_eye_cyl?: number | null
          right_eye_sph?: number | null
          user_id: string
        }
        Update: {
          Add?: number | null
          assurance?: string | null
          created_at?: string | null
          favorite?: boolean
          gender?: string | null
          id?: string
          is_deleted?: boolean | null
          last_prescription_update?: string | null
          left_eye_axe?: number | null
          left_eye_cyl?: number | null
          left_eye_sph?: number | null
          name?: string
          need_renewal?: boolean | null
          notes?: string | null
          phone?: string
          renewal_date?: string | null
          renewal_times?: number | null
          right_eye_axe?: number | null
          right_eye_cyl?: number | null
          right_eye_sph?: number | null
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          automated_name: boolean | null
          category: string | null
          company: string | null
          cost_ttc: number
          created_at: string | null
          gamma: string | null
          id: string
          image: string | null
          index: string | null
          is_deleted: boolean | null
          name: string
          position: number
          price: number
          stock: number
          stock_status: string | null
          treatment: string | null
          user_id: string
        }
        Insert: {
          automated_name?: boolean | null
          category?: string | null
          company?: string | null
          cost_ttc?: number
          created_at?: string | null
          gamma?: string | null
          id?: string
          image?: string | null
          index?: string | null
          is_deleted?: boolean | null
          name: string
          position?: number
          price: number
          stock?: number
          stock_status?: string | null
          treatment?: string | null
          user_id: string
        }
        Update: {
          automated_name?: boolean | null
          category?: string | null
          company?: string | null
          cost_ttc?: number
          created_at?: string | null
          gamma?: string | null
          id?: string
          image?: string | null
          index?: string | null
          is_deleted?: boolean | null
          name?: string
          position?: number
          price?: number
          stock?: number
          stock_status?: string | null
          treatment?: string | null
          user_id?: string
        }
        Relationships: []
      }
      receipt_items: {
        Row: {
          applied_markup: number | null
          cost: number
          created_at: string | null
          custom_item_name: string | null
          id: string
          is_deleted: boolean | null
          linked_eye: string | null
          paid_at_delivery: boolean | null
          price: number
          product_id: string | null
          profit: number
          quantity: number
          receipt_id: string | null
          user_id: string
        }
        Insert: {
          applied_markup?: number | null
          cost?: number
          created_at?: string | null
          custom_item_name?: string | null
          id?: string
          is_deleted?: boolean | null
          linked_eye?: string | null
          paid_at_delivery?: boolean | null
          price: number
          product_id?: string | null
          profit?: number
          quantity: number
          receipt_id?: string | null
          user_id: string
        }
        Update: {
          applied_markup?: number | null
          cost?: number
          created_at?: string | null
          custom_item_name?: string | null
          id?: string
          is_deleted?: boolean | null
          linked_eye?: string | null
          paid_at_delivery?: boolean | null
          price?: number
          product_id?: string | null
          profit?: number
          quantity?: number
          receipt_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          add: number | null
          advance_payment: number | null
          balance: number
          client_id: string | null
          cost: number | null
          cost_ttc: number | null
          created_at: string | null
          delivery_status: string
          discount_amount: number | null
          discount_percentage: number | null
          id: string
          is_deleted: boolean | null
          left_eye_axe: number | null
          left_eye_cyl: number | null
          left_eye_sph: number | null
          montage_costs: number | null
          montage_status: string
          paid_at_delivery_cost: number | null
          payment_status: string | null
          products_cost: number | null
          profit: number | null
          right_eye_axe: number | null
          right_eye_cyl: number | null
          right_eye_sph: number | null
          subtotal: number
          tax: number
          tax_base: number | null
          total: number
          user_id: string
          order_type: string | null
          note: string | null
          call_status: string | null
          time_called: string | null
        }
        Insert: {
          add?: number | null
          advance_payment?: number | null
          balance?: number
          client_id?: string | null
          cost?: number | null
          cost_ttc?: number | null
          created_at?: string | null
          delivery_status?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          is_deleted?: boolean | null
          left_eye_axe?: number | null
          left_eye_cyl?: number | null
          left_eye_sph?: number | null
          montage_costs?: number | null
          montage_status?: string
          paid_at_delivery_cost?: number | null
          payment_status?: string | null
          products_cost?: number | null
          profit?: number | null
          right_eye_axe?: number | null
          right_eye_cyl?: number | null
          right_eye_sph?: number | null
          subtotal: number
          tax: number
          tax_base?: number | null
          total: number
          user_id: string
          order_type?: string | null
          call_status: string
          time_called?: string | null
        }
        Update: {
          add?: number | null
          advance_payment?: number | null
          balance?: number
          client_id?: string | null
          cost?: number | null
          cost_ttc?: number | null
          created_at?: string | null
          delivery_status?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          is_deleted?: boolean | null
          left_eye_axe?: number | null
          left_eye_cyl?: number | null
          left_eye_sph?: number | null
          montage_costs?: number | null
          montage_status?: string
          paid_at_delivery_cost?: number | null
          payment_status?: string | null
          products_cost?: number | null
          profit?: number | null
          right_eye_axe?: number | null
          right_eye_cyl?: number | null
          right_eye_sph?: number | null
          subtotal?: number
          tax?: number
          tax_base?: number | null
          total?: number
          user_id?: string
          order_type?: string | null
          note?: string | null
          call_status?: string | null
          time_called?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_logs: {
        Row: {
          change_type: string
          changed_by: string
          created_at: string | null
          id: string
          new_data: Json | null
          previous_data: Json | null
          subscription_id: string
        }
        Insert: {
          change_type: string
          changed_by: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          previous_data?: Json | null
          subscription_id: string
        }
        Update: {
          change_type?: string
          changed_by?: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          previous_data?: Json | null
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          id: string
          name: string
          contact_person: string | null
          phone: string | null
          email: string | null
          address: string | null
          notes: string | null
          is_deleted: boolean | null
          created_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          notes?: string | null
          is_deleted?: boolean | null
          created_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          notes?: string | null
          is_deleted?: boolean | null
          created_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          id: string
          supplier_id: string | null
          description: string
          amount: number
          amount_ht: number
          amount_ttc: number
          category: string | null
          purchase_date: string | null
          receipt_number: string | null
          payment_method: string | null
          notes: string | null
          is_deleted: boolean | null
          created_at: string | null
          user_id: string
          purchase_type: string | null
          advance_payment: number | null
          balance: number | null
          payment_status: string | null
          payment_urgency: string | null
          recurring_type: string | null
          next_recurring_date: string | null
          linked_receipts: string[] | null
          link_date_from: string | null
          link_date_to: string | null
          already_recurred: boolean | null
          tax_percentage: number | null
        }
        Insert: {
          id?: string
          supplier_id?: string | null
          description: string
          amount: number
          amount_ht?: number
          amount_ttc?: number
          category?: string | null
          purchase_date?: string | null
          receipt_number?: string | null
          payment_method?: string | null
          notes?: string | null
          is_deleted?: boolean | null
          created_at?: string | null
          user_id: string
          purchase_type?: string | null
          advance_payment?: number | null
          balance?: number | null
          payment_status?: string | null
          payment_urgency?: string | null
          recurring_type?: string | null
          next_recurring_date?: string | null
          linked_receipts?: string[] | null
          link_date_from?: string | null
          link_date_to?: string | null
          already_recurred?: boolean | null
          tax_percentage?: number | null
        }
        Update: {
          id?: string
          supplier_id?: string | null
          description?: string
          amount?: number
          amount_ht?: number
          amount_ttc?: number
          category?: string | null
          purchase_date?: string | null
          receipt_number?: string | null
          payment_method?: string | null
          notes?: string | null
          is_deleted?: boolean | null
          created_at?: string | null
          user_id?: string
          purchase_type?: string | null
          advance_payment?: number | null
          balance?: number | null
          payment_status?: string | null
          payment_urgency?: string | null
          recurring_type?: string | null
          next_recurring_date?: string | null
          linked_receipts?: string[] | null
          link_date_from?: string | null
          link_date_to?: string | null
          already_recurred?: boolean | null
          tax_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_balance_history: {
        Row: {
          id: string
          purchase_id: string
          old_balance: number
          new_balance: number
          change_amount: number
          change_reason: string | null
          change_date: string | null
          user_id: string
        }
        Insert: {
          id?: string
          purchase_id: string
          old_balance: number
          new_balance: number
          change_amount: number
          change_reason?: string | null
          change_date?: string | null
          user_id: string
        }
        Update: {
          id?: string
          purchase_id?: string
          old_balance?: number
          new_balance?: number
          change_amount?: number
          change_reason?: string | null
          change_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_balance_history_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          display_name: string
          email: string
          end_date: string | null
          id: string
          is_admin: boolean
          is_recurring: boolean | null
          price: number | null
          referral_code: string | null
          referred_by: string | null
          start_date: string | null
          store_name: string
          subscription_status:
          | Database["public"]["Enums"]["subscription_status"]
          | null
          subscription_type:
          | Database["public"]["Enums"]["subscription_type"]
          | null
          trial_used: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string
          email?: string
          end_date?: string | null
          id?: string
          is_admin?: boolean
          is_recurring?: boolean | null
          price?: number | null
          referral_code?: string | null
          referred_by?: string | null
          start_date?: string | null
          store_name?: string
          subscription_status?:
          | Database["public"]["Enums"]["subscription_status"]
          | null
          subscription_type?:
          | Database["public"]["Enums"]["subscription_type"]
          | null
          trial_used?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string
          email?: string
          end_date?: string | null
          id?: string
          is_admin?: boolean
          is_recurring?: boolean | null
          price?: number | null
          referral_code?: string | null
          referred_by?: string | null
          start_date?: string | null
          store_name?: string
          subscription_status?:
          | Database["public"]["Enums"]["subscription_status"]
          | null
          subscription_type?:
          | Database["public"]["Enums"]["subscription_type"]
          | null
          trial_used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      user_information: {
        Row: {
          address: string | null
          company_legal_status: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          ice: string | null
          inpe: string | null
          logo_url: string | null
          phone: string | null
          store_name: string | null
          updated_at: string
          user_id: string
          vat_number: string | null
          website: string | null
          auto_additional_costs: boolean | null
          sv_lens_cost: number | null
          progressive_lens_cost: number | null
          frames_cost: number | null
          markup_sph_range_1_min: number | null
          markup_sph_range_1_max: number | null
          markup_sph_range_1_markup: number | null
          markup_sph_range_2_min: number | null
          markup_sph_range_2_max: number | null
          markup_sph_range_2_markup: number | null
          markup_sph_range_3_min: number | null
          markup_sph_range_3_max: number | null
          markup_sph_range_3_markup: number | null
          markup_cyl_range_1_min: number | null
          markup_cyl_range_1_max: number | null
          markup_cyl_range_1_markup: number | null
          markup_cyl_range_2_min: number | null
          markup_cyl_range_2_max: number | null
          markup_cyl_range_2_markup: number | null
          markup_cyl_range_3_min: number | null
          markup_cyl_range_3_max: number | null
          markup_cyl_range_3_markup: number | null
        }
        Insert: {
          address?: string | null
          company_legal_status?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          ice?: string | null
          inpe?: string | null
          logo_url?: string | null
          phone?: string | null
          store_name?: string | null
          updated_at?: string
          user_id: string
          vat_number?: string | null
          website?: string | null
          auto_additional_costs?: boolean | null
          sv_lens_cost?: number | null
          progressive_lens_cost?: number | null
          frames_cost?: number | null
          markup_sph_range_1_min?: number | null
          markup_sph_range_1_max?: number | null
          markup_sph_range_1_markup?: number | null
          markup_sph_range_2_min?: number | null
          markup_sph_range_2_max?: number | null
          markup_sph_range_2_markup?: number | null
          markup_sph_range_3_min?: number | null
          markup_sph_range_3_max?: number | null
          markup_sph_range_3_markup?: number | null
          markup_cyl_range_1_min?: number | null
          markup_cyl_range_1_max?: number | null
          markup_cyl_range_1_markup?: number | null
          markup_cyl_range_2_min?: number | null
          markup_cyl_range_2_max?: number | null
          markup_cyl_range_2_markup?: number | null
          markup_cyl_range_3_min?: number | null
          markup_cyl_range_3_max?: number | null
          markup_cyl_range_3_markup?: number | null
        }
        Update: {
          address?: string | null
          company_legal_status?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          ice?: string | null
          inpe?: string | null
          logo_url?: string | null
          phone?: string | null
          store_name?: string | null
          updated_at?: string
          user_id?: string
          vat_number?: string | null
          website?: string | null
          auto_additional_costs?: boolean | null
          sv_lens_cost?: number | null
          progressive_lens_cost?: number | null
          frames_cost?: number | null
          markup_sph_range_1_min?: number | null
          markup_sph_range_1_max?: number | null
          markup_sph_range_1_markup?: number | null
          markup_sph_range_2_min?: number | null
          markup_sph_range_2_max?: number | null
          markup_sph_range_2_markup?: number | null
          markup_sph_range_3_min?: number | null
          markup_sph_range_3_max?: number | null
          markup_sph_range_3_markup?: number | null
          markup_cyl_range_1_min?: number | null
          markup_cyl_range_1_max?: number | null
          markup_cyl_range_1_markup?: number | null
          markup_cyl_range_2_min?: number | null
          markup_cyl_range_2_max?: number | null
          markup_cyl_range_2_markup?: number | null
          markup_cyl_range_3_min?: number | null
          markup_cyl_range_3_max?: number | null
          markup_cyl_range_3_markup?: number | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          advance_payment: number | null
          balance: number | null
          client_address: string | null
          client_assurance: string | null
          client_name: string
          client_phone: string | null
          created_at: string | null
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          is_deleted: boolean | null
          notes: string | null
          status: string | null
          subtotal: number
          tax_amount: number | null
          tax_percentage: number | null
          total: number
          updated_at: string | null
          user_id: string
          right_eye_sph: number | null
          right_eye_cyl: number | null
          right_eye_axe: number | null
          left_eye_sph: number | null
          left_eye_cyl: number | null
          left_eye_axe: number | null
          add_value: number | null
        }
        Insert: {
          advance_payment?: number | null
          balance?: number | null
          client_address?: string | null
          client_assurance?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          is_deleted?: boolean | null
          notes?: string | null
          status?: string | null
          subtotal: number
          tax_amount?: number | null
          tax_percentage?: number | null
          total: number
          updated_at?: string | null
          user_id: string
          right_eye_sph?: number | null
          right_eye_cyl?: number | null
          right_eye_axe?: number | null
          left_eye_sph?: number | null
          left_eye_cyl?: number | null
          left_eye_axe?: number | null
          add_value?: number | null
        }
        Update: {
          advance_payment?: number | null
          balance?: number | null
          client_address?: string | null
          client_assurance?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          is_deleted?: boolean | null
          notes?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_percentage?: number | null
          total?: number
          updated_at?: string | null
          user_id?: string
          right_eye_sph?: number | null
          right_eye_cyl?: number | null
          right_eye_axe?: number | null
          left_eye_sph?: number | null
          left_eye_cyl?: number | null
          left_eye_axe?: number | null
          add_value?: number | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          invoice_id: string
          is_deleted: boolean | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          invoice_id: string
          is_deleted?: boolean | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string
          is_deleted?: boolean | null
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          id: string
          user_id: string
          can_manage_products: boolean
          can_manage_clients: boolean
          can_manage_receipts: boolean
          can_view_financial: boolean
          can_manage_purchases: boolean
          can_access_dashboard: boolean
          can_manage_invoices: boolean
          can_access_appointments: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          can_manage_products?: boolean
          can_manage_clients?: boolean
          can_manage_receipts?: boolean
          can_view_financial?: boolean
          can_manage_purchases?: boolean
          can_access_dashboard?: boolean
          can_manage_invoices?: boolean
          can_access_appointments?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          can_manage_products?: boolean
          can_manage_clients?: boolean
          can_manage_receipts?: boolean
          can_view_financial?: boolean
          can_manage_purchases?: boolean
          can_access_dashboard?: boolean
          can_manage_invoices?: boolean
          can_access_appointments?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      appointments: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          client_name: string
          client_phone: string | null
          appointment_date: string
          appointment_time: string
          status: string
          notes: string | null
          examiner_name: string | null
          right_eye_sph: number | null
          right_eye_cyl: number | null
          right_eye_axe: number | null
          left_eye_sph: number | null
          left_eye_cyl: number | null
          left_eye_axe: number | null
          add_value: number | null
          is_deleted: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          client_name: string
          client_phone?: string | null
          appointment_date: string
          appointment_time: string
          status?: string
          notes?: string | null
          examiner_name?: string | null
          right_eye_sph?: number | null
          right_eye_cyl?: number | null
          right_eye_axe?: number | null
          left_eye_sph?: number | null
          left_eye_cyl?: number | null
          left_eye_axe?: number | null
          add_value?: number | null
          is_deleted?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          appointment_date?: string
          appointment_time?: string
          status?: string
          notes?: string | null
          examiner_name?: string | null
          right_eye_sph?: number | null
          right_eye_cyl?: number | null
          right_eye_axe?: number | null
          left_eye_sph?: number | null
          left_eye_cyl?: number | null
          left_eye_axe?: number | null
          add_value?: number | null
          is_deleted?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_access_code: {
        Args: {
          input_access_code: string
        }
        Returns: {
          valid: boolean
          message: string
        }[]
      }
      check_and_renew_subscriptions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_unique_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_admin_permissions: {
        Args: Record<PropertyKey, never>
        Returns: {
          can_manage_products: boolean
          can_manage_clients: boolean
          can_manage_receipts: boolean
          can_view_financial: boolean
          can_manage_purchases: boolean
          can_access_dashboard: boolean
        }[]
      }
      get_subscription_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_count: number
          total_revenue: number
          monthly_revenue: number
          quarterly_revenue: number
          lifetime_revenue: number
          trial_count: number
        }[]
      }
      initialize_user_information: {
        Args: {
          user_uuid: string
        }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      subscription_status:
      | "Active"
      | "Suspended"
      | "Cancelled"
      | "inActive"
      | "Expired"
      subscription_type: "Trial" | "Monthly" | "Quarterly" | "Lifetime"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
  | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

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
} as const

export interface Product {
  id: string;
  user_id: string;
  name: string;
  price: number;
  cost_ttc: number;
  stock: number;
  position: number;
  category?: string;
  company?: string;
  treatment?: string;
  stock_status?: string;
  index?: string;
  image?: string;
  gamma?: string;
  created_at: string;
  updated_at: string;
  automated_name?: boolean;
  is_deleted?: boolean;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  gender?: string;
  assurance?: string;
  notes?: string;
  left_eye_sph: number;
  left_eye_cyl: number;
  left_eye_axe: number;
  right_eye_sph: number;
  right_eye_cyl: number;
  right_eye_axe: number;
  add?: number;
  favorite: boolean;
  created_at: string;
  updated_at: string;
  last_prescription_update?: string;
  is_deleted?: boolean;
  need_renewal: boolean | null
  renewal_date: string | null
  renewal_times: number | null
}

export interface Receipt {
  id: string;
  user_id: string;
  client_id?: string;
  client_name?: string;
  client_phone?: string;
  right_eye_sph?: number;
  right_eye_cyl?: number;
  right_eye_axe?: number;
  left_eye_sph?: number;
  left_eye_cyl?: number;
  left_eye_axe?: number;
  add?: number;
  montage_costs?: number;
  total_discount?: number;
  tax?: number;
  advance_payment?: number;
  balance?: number;
  total?: number;
  products_cost?: number;
  cost_ttc?: number;
  paid_at_delivery_cost?: number;
  delivery_status?: string;
  montage_status?: string;
  order_type?: string;
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
  receipt_items?: ReceiptItem[];
  client?: {
    id: string;
    name: string;
    phone?: string;
  };
}

export interface ReceiptItem {
  id: string;
  user_id: string;
  receipt_id: string;
  product_id?: string;
  custom_item_name?: string;
  quantity: number;
  price: number;
  cost?: number;
  profit?: number;
  linked_eye?: string;
  applied_markup?: number;
  paid_at_delivery?: boolean;
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
  product?: Product;
}
export interface UserInformation {
  id: string;
  user_id: string;
  store_name?: string;
  display_name?: string;
  address?: string;
  vat_number?: string;
  ice?: string;
  inpe?: string;
  company_legal_status?: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  website?: string;
  created_at: string;
  updated_at: string;
  auto_additional_costs?: boolean;
  sv_lens_cost?: number;
  progressive_lens_cost?: number;
  frames_cost?: number;
  markup_sph_range_1_min?: number;
  markup_sph_range_1_max?: number;
  markup_sph_range_1_markup?: number;
  markup_sph_range_2_min?: number;
  markup_sph_range_2_max?: number;
  markup_sph_range_2_markup?: number;
  markup_sph_range_3_min?: number;
  markup_sph_range_3_max?: number;
  markup_sph_range_3_markup?: number;
  markup_cyl_range_1_min?: number;
  markup_cyl_range_1_max?: number;
  markup_cyl_range_1_markup?: number;
  markup_cyl_range_2_min?: number;
  markup_cyl_range_2_max?: number;
  markup_cyl_range_2_markup?: number;
  markup_cyl_range_3_min?: number;
  markup_cyl_range_3_max?: number;
  markup_cyl_range_3_markup?: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  client_name: string;
  client_phone?: string;
  client_address?: string;
  client_assurance?: string;
  subtotal: number;
  tax_percentage: number;
  tax_amount: number;
  total: number;
  invoice_date: string;
  due_date?: string;
  status: string;
  notes?: string;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
  invoice_items?: InvoiceItem[];
  advance_payment?: number;
  balance?: number;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  user_id: string;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  client_id?: string | null;
  client_name: string;
  client_phone?: string | null;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes?: string | null;
  examiner_name?: string | null;
  right_eye_sph?: number | null;
  right_eye_cyl?: number | null;
  right_eye_axe?: number | null;
  left_eye_sph?: number | null;
  left_eye_cyl?: number | null;
  left_eye_axe?: number | null;
  add_value?: number | null;
  is_deleted?: boolean | null;
  created_at: string;
  updated_at: string;
}

