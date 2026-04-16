-- ═══════════════════════════════════════════════════════════════
-- BankReadyDocs — Pipeline Migration
-- Run this AFTER admin-migration.sql is in place.
--
-- Creates the end-to-end pipeline tables:
--   1. scorecard_submissions — comprehensive client input + results
--   2. document_uploads — file tracking for uploaded tax returns / PFS
--   3. readiness_reports — AI-generated True Readiness Score reports
--
-- Also adds admin RLS bypass policies and updates admin_flags to
-- reference scorecard_submissions.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Scorecard Submissions ──────────────────────────────────

create table if not exists scorecard_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Business identity
  business_name text,
  entity_type text check (entity_type in (
    'scorp', 'partnership', 'llc_scorp', 'llc_ccorp', 'ccorp', 'sole_prop'
  )),
  industry text,
  naics_code text,
  time_in_business_years numeric,
  state_code text,
  zip_code text,

  -- Loan request
  loan_amount_requested numeric,
  loan_purpose text,
  loan_term_years int,

  -- Business cash flow inputs (current year)
  tax_year int,
  net_profit_cy numeric default 0,
  interest_expense_cy numeric default 0,
  depreciation_amortization_cy numeric default 0,
  amortization_cy numeric default 0,
  one_time_income_cy numeric default 0,
  one_time_expenses_cy numeric default 0,
  rent_expense_cy numeric default 0,
  property_situation text check (property_situation in (
    'rents', 'owns_same_entity', 'owns_separate_entity', 'remote'
  )),
  rent_appears_on_financials boolean default false,
  owner_withdrawals_cy numeric default 0,

  -- Business cash flow inputs (prior year)
  net_profit_py numeric,
  interest_expense_py numeric,
  depreciation_amortization_py numeric,
  amortization_py numeric default 0,
  one_time_income_py numeric default 0,
  one_time_expenses_py numeric default 0,
  rent_expense_py numeric default 0,
  owner_withdrawals_py numeric default 0,

  -- Debt obligations (JSON array of debt objects)
  debt_obligations jsonb default '[]'::jsonb,

  -- Ownership
  primary_owner_pct numeric,
  has_co_owners boolean default false,
  co_owners jsonb default '[]'::jsonb,

  -- Guarantor info
  is_married boolean default false,
  spouse_has_vested_interest boolean default false,
  files_jointly boolean default false,

  -- Credit
  experian_score int,
  transunion_score int,
  has_bankruptcy_last_7_years boolean default false,
  has_judgments_or_liens boolean default false,
  has_existing_bank_relationship boolean default false,

  -- Personal cash flow inputs (guarantor only)
  guarantor_w2_income numeric default 0,
  guarantor_social_security numeric default 0,
  guarantor_schedule_c_income numeric default 0,
  is_borrowing_entity_schedule_c boolean default false,
  guarantor_rental_income_schedule_e numeric default 0,
  guarantor_farm_income_schedule_f numeric default 0,
  guarantor_alimony numeric default 0,
  guarantor_distributions numeric default 0,
  guarantor_other_income numeric default 0,

  -- Personal debt service
  mortgage_monthly_payment numeric default 0,
  home_equity_line_balance numeric default 0,
  personal_cc_balance numeric default 0,
  other_term_debt_monthly numeric default 0,

  -- Balance sheet
  total_liabilities numeric,
  total_equity numeric,
  intangible_assets numeric default 0,
  accounts_receivable numeric default 0,
  inventory numeric default 0,
  equipment_value numeric default 0,
  owns_real_estate boolean default false,

  -- Calculated results (stored after calculation)
  ebida_cy numeric,
  tax_adjustment_cy numeric default 0,
  rent_addback_cy numeric default 0,
  business_cash_flow_cy numeric,
  business_cash_flow_py numeric,
  business_debt_service numeric,
  dscr_cy numeric,
  dscr_py numeric,
  leverage_ratio numeric,
  personal_cash_flow_available numeric,
  personal_debt_service numeric,
  personal_discretionary_cf numeric,

  -- Scores
  capacity_score int default 0,
  character_score int default 0,
  capital_score int default 0,
  collateral_score int default 0,
  conditions_score int default 0,
  overall_score int default 0,

  -- Status
  status text check (status in (
    'in_progress',
    'submitted',
    'under_review',
    'needs_info',
    'confirmed',
    'report_released'
  )) default 'in_progress',

  -- Admin review
  admin_notes text,
  reviewed_by text,
  reviewed_at timestamptz,
  confirmed_overrides jsonb default '{}'::jsonb,

  -- Timestamps
  started_at timestamptz default now(),
  submitted_at timestamptz,
  updated_at timestamptz default now()
);

alter table scorecard_submissions enable row level security;

create policy "Users can view own scorecard submission"
  on scorecard_submissions for select
  using (auth.uid() = user_id);

create policy "Users can insert own scorecard submission"
  on scorecard_submissions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own scorecard submission"
  on scorecard_submissions for update
  using (auth.uid() = user_id);

-- Admin bypass: admin users (is_admin flag on profiles) can read all submissions
-- NOTE: Add is_admin column to profiles if not already present
alter table profiles add column if not exists is_admin boolean default false;

create policy "Admins can view all scorecard submissions"
  on scorecard_submissions for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

create policy "Admins can update all scorecard submissions"
  on scorecard_submissions for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- ── 2. Update admin_flags to also reference scorecard_submissions ──

-- Add scorecard_submission_id column to admin_flags if it exists,
-- or create fresh if the table doesn't exist yet.
-- If admin_flags already exists from admin-migration.sql, add the column:
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'admin_flags' and table_schema = 'public') then
    -- Table exists — add submission reference if not present
    if not exists (select 1 from information_schema.columns where table_name = 'admin_flags' and column_name = 'submission_id') then
      alter table admin_flags add column submission_id uuid references scorecard_submissions(id) on delete cascade;
    end if;
  else
    -- Table doesn't exist — create it
    create table admin_flags (
      id uuid primary key default gen_random_uuid(),
      scorecard_id uuid references scorecard_results(id) on delete cascade,
      submission_id uuid references scorecard_submissions(id) on delete cascade,
      user_id uuid references auth.users(id) on delete cascade not null,
      flag_type text not null,
      flag_description text,
      client_input jsonb,
      admin_resolution text,
      admin_note text,
      override_value jsonb,
      resolved boolean default false,
      resolved_at timestamptz,
      created_at timestamptz default now()
    );

    alter table admin_flags enable row level security;

    create policy "Users can view own flags"
      on admin_flags for select
      using (auth.uid() = user_id);
  end if;
end $$;

-- Admin bypass for flags
create policy "Admins can view all flags"
  on admin_flags for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

create policy "Admins can update all flags"
  on admin_flags for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

create policy "Admins can insert flags"
  on admin_flags for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- Allow client insert for auto-generated flags on submission
create policy "Users can insert own flags"
  on admin_flags for insert
  with check (auth.uid() = user_id);

-- ── 3. Document Uploads ──────────────────────────────────────

create table if not exists document_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  submission_id uuid references scorecard_submissions(id) on delete cascade,
  document_type text check (document_type in (
    'business_tax_return',
    'personal_tax_return_1040',
    'personal_financial_statement',
    'business_tax_return_prior_year',
    'personal_tax_return_prior_year',
    'debt_schedule',
    'other'
  )) not null,
  file_name text not null,
  file_path text not null,
  file_size int,
  uploaded_at timestamptz default now(),
  verified boolean default false,
  verified_at timestamptz,
  verified_by text
);

alter table document_uploads enable row level security;

create policy "Users can view own documents"
  on document_uploads for select
  using (auth.uid() = user_id);

create policy "Users can upload own documents"
  on document_uploads for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all documents"
  on document_uploads for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

create policy "Admins can update documents"
  on document_uploads for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- ── 4. Readiness Reports ─────────────────────────────────────

create table if not exists readiness_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  submission_id uuid references scorecard_submissions(id),
  overall_score int,
  score_band text,
  report_json jsonb,
  hard_flags jsonb default '[]'::jsonb,
  generated_at timestamptz default now(),
  released_at timestamptz
);

alter table readiness_reports enable row level security;

create policy "Users can view own reports"
  on readiness_reports for select
  using (auth.uid() = user_id);

create policy "Admins can manage all reports"
  on readiness_reports for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- ── 5. Indexes ───────────────────────────────────────────────

create index if not exists idx_submissions_user_id on scorecard_submissions(user_id);
create index if not exists idx_submissions_status on scorecard_submissions(status);
create index if not exists idx_submissions_submitted_at on scorecard_submissions(submitted_at desc);
create index if not exists idx_document_uploads_user_id on document_uploads(user_id);
create index if not exists idx_document_uploads_submission_id on document_uploads(submission_id);
create index if not exists idx_readiness_reports_user_id on readiness_reports(user_id);
create index if not exists idx_readiness_reports_submission_id on readiness_reports(submission_id);

-- ── 6. Updated-at trigger ────────────────────────────────────

create trigger set_submissions_updated_at
  before update on scorecard_submissions
  for each row
  execute function update_updated_at();

-- ── 7. Admin helper function (SECURITY DEFINER to avoid RLS recursion) ─

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ── 8. Admin RLS for profiles (uses is_admin() to avoid recursion) ─

create policy "Admins can view all profiles"
  on profiles for select
  using (public.is_admin());

create policy "Admins can update all profiles"
  on profiles for update
  using (public.is_admin());
