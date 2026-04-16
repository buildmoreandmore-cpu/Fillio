-- ═══════════════════════════════════════════════════════════════
-- BankReadyDocs — Admin Dashboard Migration
-- Run this AFTER the base schema (schema.sql) is in place.
-- ═══════════════════════════════════════════════════════════════

-- ── Scorecard Results table (new) ──────────────────────────────
-- Stores the full capacity worksheet output + admin review state.

create table if not exists scorecard_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,

  -- Capacity worksheet data (JSONB — full snapshot)
  business_cash_flow jsonb default '{}'::jsonb,
  business_debt_service jsonb default '{}'::jsonb,
  personal_cash_flow jsonb default '{}'::jsonb,
  personal_debt_service jsonb default '{}'::jsonb,

  -- Derived scores
  business_dscr numeric(6,2),
  personal_discretionary_cf numeric(12,2),
  capacity_score integer default 0,

  -- Five C's scores (admin can override)
  character_score integer default 0,
  capital_score integer default 0,
  collateral_score integer default 0,
  conditions_score integer default 0,
  overall_score integer default 0,

  -- Admin review
  status text check (status in ('provisional', 'confirmed', 'needs_revision')) default 'provisional',
  admin_notes text,
  reviewed_by text,
  reviewed_at timestamptz,
  flags jsonb default '[]'::jsonb,

  -- Confirmed overrides (admin adjustments stored separately)
  confirmed_overrides jsonb default '{}'::jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table scorecard_results enable row level security;

-- Clients can only see their own scorecard
create policy "Users can view own scorecard"
  on scorecard_results for select
  using (auth.uid() = user_id);

-- Clients can insert their own scorecard
create policy "Users can create own scorecard"
  on scorecard_results for insert
  with check (auth.uid() = user_id);

-- Clients can update their own scorecard (for re-submission)
create policy "Users can update own scorecard"
  on scorecard_results for update
  using (auth.uid() = user_id);

-- ── Admin flags table ──────────────────────────────────────────

create table if not exists admin_flags (
  id uuid primary key default gen_random_uuid(),
  scorecard_id uuid references scorecard_results(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,

  flag_type text not null,
  flag_description text,
  client_input jsonb,

  -- Admin resolution
  admin_resolution text,  -- 'confirmed' | 'override' | 'request_info' | null
  admin_note text,
  override_value jsonb,   -- if admin overrides, the new value
  resolved boolean default false,
  resolved_at timestamptz,

  created_at timestamptz default now()
);

alter table admin_flags enable row level security;

-- Admin can see all flags (RLS bypassed via service key in API)
-- Clients can see flags on their own scorecard (read-only)
create policy "Users can view own flags"
  on admin_flags for select
  using (auth.uid() = user_id);

-- ── Profiles additions ─────────────────────────────────────────

alter table profiles
  add column if not exists business_name text,
  add column if not exists tier text check (tier in ('bank_ready', 'loan_ready', 'approved')),
  add column if not exists is_priority boolean default false,
  add column if not exists admin_notes text,
  add column if not exists lender_recommendations jsonb default '[]'::jsonb,
  add column if not exists action_plan text;

-- ── Messages table (admin <-> client) ──────────────────────────

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  sender_type text check (sender_type in ('admin', 'client')) not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table messages enable row level security;

create policy "Users can view own messages"
  on messages for select
  using (auth.uid() = user_id);

create policy "Users can send messages"
  on messages for insert
  with check (auth.uid() = user_id and sender_type = 'client');

-- ── Indexes ────────────────────────────────────────────────────

create index if not exists idx_scorecard_results_user_id on scorecard_results(user_id);
create index if not exists idx_scorecard_results_status on scorecard_results(status);
create index if not exists idx_admin_flags_scorecard_id on admin_flags(scorecard_id);
create index if not exists idx_admin_flags_user_id on admin_flags(user_id);
create index if not exists idx_admin_flags_resolved on admin_flags(resolved);
create index if not exists idx_messages_user_id on messages(user_id);
create index if not exists idx_profiles_tier on profiles(tier);

-- ── Updated-at trigger for scorecard_results ───────────────────

create trigger set_scorecard_results_updated_at
  before update on scorecard_results
  for each row
  execute function update_updated_at();
