export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          is_pro: boolean
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          is_pro?: boolean
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          is_pro?: boolean
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          user_id: string
          title: string
          type: 'PERSONAL_FINANCIAL_STATEMENT' | 'DEBT_SCHEDULE' | 'INCOME_STATEMENT' | 'BALANCE_SHEET'
          status: 'DRAFT' | 'COMPLETE'
          data: Json
          pdf_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          type: 'PERSONAL_FINANCIAL_STATEMENT' | 'DEBT_SCHEDULE' | 'INCOME_STATEMENT' | 'BALANCE_SHEET'
          status?: 'DRAFT' | 'COMPLETE'
          data: Json
          pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          type?: 'PERSONAL_FINANCIAL_STATEMENT' | 'DEBT_SCHEDULE' | 'INCOME_STATEMENT' | 'BALANCE_SHEET'
          status?: 'DRAFT' | 'COMPLETE'
          data?: Json
          pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      purchases: {
        Row: {
          id: string
          user_id: string
          document_id: string | null
          type: 'one-time' | 'subscription'
          stripe_payment_id: string | null
          amount: number
          status: 'pending' | 'completed' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          document_id?: string | null
          type: 'one-time' | 'subscription'
          stripe_payment_id?: string | null
          amount: number
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          document_id?: string | null
          type?: 'one-time' | 'subscription'
          stripe_payment_id?: string | null
          amount?: number
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
        }
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
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type Purchase = Database['public']['Tables']['purchases']['Row']
