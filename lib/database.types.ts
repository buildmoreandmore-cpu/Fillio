export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type SubmissionStatus =
  | 'in_progress'
  | 'submitted'
  | 'under_review'
  | 'needs_info'
  | 'confirmed'
  | 'report_released'

export type ScorecardEntityType =
  | 'scorp'
  | 'partnership'
  | 'llc_scorp'
  | 'llc_ccorp'
  | 'ccorp'
  | 'sole_prop'

export type PropertySituationType =
  | 'rents'
  | 'owns_same_entity'
  | 'owns_separate_entity'
  | 'remote'

export type DocumentUploadType =
  | 'business_tax_return'
  | 'personal_tax_return_1040'
  | 'personal_financial_statement'
  | 'business_tax_return_prior_year'
  | 'personal_tax_return_prior_year'
  | 'debt_schedule'
  | 'other'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          is_pro: boolean
          is_admin: boolean
          has_paid: boolean
          paid_at: string | null
          stripe_customer_id: string | null
          stripe_session_id: string | null
          business_name: string | null
          tier: string | null
          is_priority: boolean
          admin_notes: string | null
          lender_recommendations: Json | null
          action_plan: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          is_pro?: boolean
          is_admin?: boolean
          has_paid?: boolean
          paid_at?: string | null
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          business_name?: string | null
          tier?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          is_pro?: boolean
          is_admin?: boolean
          has_paid?: boolean
          paid_at?: string | null
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          business_name?: string | null
          tier?: string | null
          is_priority?: boolean
          admin_notes?: string | null
          lender_recommendations?: Json | null
          action_plan?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      scorecard_submissions: {
        Row: {
          id: string
          user_id: string
          business_name: string | null
          entity_type: ScorecardEntityType | null
          industry: string | null
          naics_code: string | null
          time_in_business_years: number | null
          state_code: string | null
          zip_code: string | null
          loan_amount_requested: number | null
          loan_purpose: string | null
          loan_term_years: number | null
          tax_year: number | null
          net_profit_cy: number
          interest_expense_cy: number
          depreciation_amortization_cy: number
          amortization_cy: number
          one_time_income_cy: number
          one_time_expenses_cy: number
          rent_expense_cy: number
          property_situation: PropertySituationType | null
          rent_appears_on_financials: boolean
          owner_withdrawals_cy: number
          net_profit_py: number | null
          interest_expense_py: number | null
          depreciation_amortization_py: number | null
          amortization_py: number
          one_time_income_py: number
          one_time_expenses_py: number
          rent_expense_py: number
          owner_withdrawals_py: number
          debt_obligations: Json
          primary_owner_pct: number | null
          has_co_owners: boolean
          co_owners: Json
          is_married: boolean
          spouse_has_vested_interest: boolean
          files_jointly: boolean
          experian_score: number | null
          transunion_score: number | null
          has_bankruptcy_last_7_years: boolean
          has_judgments_or_liens: boolean
          has_existing_bank_relationship: boolean
          guarantor_w2_income: number
          guarantor_social_security: number
          guarantor_schedule_c_income: number
          is_borrowing_entity_schedule_c: boolean
          guarantor_rental_income_schedule_e: number
          guarantor_farm_income_schedule_f: number
          guarantor_alimony: number
          guarantor_distributions: number
          guarantor_other_income: number
          mortgage_monthly_payment: number
          home_equity_line_balance: number
          personal_cc_balance: number
          other_term_debt_monthly: number
          total_liabilities: number | null
          total_equity: number | null
          intangible_assets: number
          accounts_receivable: number
          inventory: number
          equipment_value: number
          owns_real_estate: boolean
          ebida_cy: number | null
          tax_adjustment_cy: number
          rent_addback_cy: number
          business_cash_flow_cy: number | null
          business_cash_flow_py: number | null
          business_debt_service: number | null
          dscr_cy: number | null
          dscr_py: number | null
          leverage_ratio: number | null
          personal_cash_flow_available: number | null
          personal_debt_service: number | null
          personal_discretionary_cf: number | null
          capacity_score: number
          character_score: number
          capital_score: number
          collateral_score: number
          conditions_score: number
          overall_score: number
          status: SubmissionStatus
          admin_notes: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          confirmed_overrides: Json
          started_at: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name?: string | null
          entity_type?: ScorecardEntityType | null
          tax_year?: number | null
          net_profit_cy?: number
          interest_expense_cy?: number
          depreciation_amortization_cy?: number
          amortization_cy?: number
          rent_expense_cy?: number
          property_situation?: PropertySituationType | null
          rent_appears_on_financials?: boolean
          debt_obligations?: Json
          status?: SubmissionStatus
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
      }
      document_uploads: {
        Row: {
          id: string
          user_id: string
          submission_id: string | null
          document_type: DocumentUploadType
          file_name: string
          file_path: string
          file_size: number | null
          uploaded_at: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          submission_id?: string | null
          document_type: DocumentUploadType
          file_name: string
          file_path: string
          file_size?: number | null
        }
        Update: {
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          [key: string]: unknown
        }
      }
      readiness_reports: {
        Row: {
          id: string
          user_id: string
          submission_id: string | null
          overall_score: number | null
          score_band: string | null
          report_json: Json | null
          hard_flags: Json
          generated_at: string
          released_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          submission_id?: string | null
          overall_score?: number | null
          score_band?: string | null
          report_json?: Json | null
          hard_flags?: Json
        }
        Update: {
          overall_score?: number | null
          score_band?: string | null
          report_json?: Json | null
          released_at?: string | null
          [key: string]: unknown
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
          type: 'one-time' | 'subscription' | 'tier_purchase'
          stripe_payment_id: string | null
          amount: number
          status: 'pending' | 'completed' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          document_id?: string | null
          type: 'one-time' | 'subscription' | 'tier_purchase'
          stripe_payment_id?: string | null
          amount: number
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          document_id?: string | null
          type?: 'one-time' | 'subscription' | 'tier_purchase'
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
export type ScorecardSubmission = Database['public']['Tables']['scorecard_submissions']['Row']
export type DocumentUpload = Database['public']['Tables']['document_uploads']['Row']
export type ReadinessReport = Database['public']['Tables']['readiness_reports']['Row']
