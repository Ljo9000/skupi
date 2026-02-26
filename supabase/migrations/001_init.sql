-- ============================================================
-- SKUPI — Initial Schema
-- Sprint 1: Owners, Events, Payments + RLS
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";

-- ============================================================
-- TABLES
-- ============================================================

-- Owners table (linked to Supabase Auth users)
create table public.owners (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  ime text not null,
  email text not null,
  stripe_account_id text,
  stripe_onboarding_complete boolean not null default false,
  created_at timestamptz not null default now()
);

-- Events table
create table public.events (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references public.owners(id) on delete cascade not null,
  slug text not null unique,           -- nanoid(6), e.g. 'abc123'
  naziv text not null,                 -- event name
  opis text,                           -- optional description
  datum timestamptz not null,          -- event date/time
  cijena_vlasnika integer not null,    -- price in cents (owner receives this)
  service_fee integer not null,        -- fee in cents (paid by guest on top)
  min_sudionika integer not null default 2,
  max_sudionika integer not null,
  rok_uplate timestamptz not null,     -- payment deadline
  status text not null default 'active'
    check (status in ('active', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint min_less_than_max check (min_sudionika <= max_sudionika),
  constraint positive_price check (cijena_vlasnika > 0),
  constraint positive_fee check (service_fee >= 0)
);

-- Payments table
create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events(id) on delete cascade not null,
  ime text not null,                   -- guest name
  email text not null,                 -- guest email
  iznos_total integer not null,        -- total charged to guest (cents)
  iznos_vlasnika integer not null,     -- amount owner receives (cents)
  iznos_fee integer not null,          -- skupi + stripe fee (cents)
  stripe_payment_intent_id text unique,
  stripe_charge_id text,
  capture_method text not null default 'automatic'
    check (capture_method in ('manual', 'automatic')),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'refunded')),
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index events_owner_id_idx on public.events(owner_id);
create index events_slug_idx on public.events(slug);
create index events_status_idx on public.events(status);
create index payments_event_id_idx on public.payments(event_id);
create index payments_status_idx on public.payments(status);
create index payments_stripe_pi_idx on public.payments(stripe_payment_intent_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.owners enable row level security;
alter table public.events enable row level security;
alter table public.payments enable row level security;

-- OWNERS: User can only see/modify their own owner record
create policy "owners_select_own"
  on public.owners for select
  using (auth.uid() = user_id);

create policy "owners_insert_own"
  on public.owners for insert
  with check (auth.uid() = user_id);

create policy "owners_update_own"
  on public.owners for update
  using (auth.uid() = user_id);

-- EVENTS: Owner sees only their events; public read for active events by slug
create policy "events_owner_all"
  on public.events for all
  using (
    owner_id in (
      select id from public.owners where user_id = auth.uid()
    )
  );

create policy "events_public_read"
  on public.events for select
  using (status = 'active');

-- PAYMENTS: Owner sees payments for their events; guests can insert
create policy "payments_owner_select"
  on public.payments for select
  using (
    event_id in (
      select e.id from public.events e
      join public.owners o on e.owner_id = o.id
      where o.user_id = auth.uid()
    )
  );

create policy "payments_public_insert"
  on public.payments for insert
  with check (true);  -- guests can pay; validation done in API route

-- ============================================================
-- TRIGGER: Auto-create owner record on user signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.owners (user_id, ime, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'ime', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- HELPER FUNCTION: Count paid participants for an event
-- ============================================================

create or replace function public.paid_count(event_id uuid)
returns integer
language sql
stable
as $$
  select count(*)::integer
  from public.payments
  where payments.event_id = paid_count.event_id
    and status = 'paid';
$$;
