-- DEW TOOL foundation migration. Run once in Supabase SQL Editor.
-- Safe additive setup: does not drop existing tables or enum types.
create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('customer','staff','admin');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  balance numeric(14,2) not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_days integer not null check (duration_days > 0),
  price numeric(14,2) not null check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(duration_days)
);

create table if not exists public.game_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  game_uid text,
  status text not null default 'inactive',
  auth_status text not null default 'not_linked'
    check (auth_status in ('not_linked','checking','linked','error')),
  auto_enabled boolean not null default false,
  auth_error_message text,
  last_auth_check_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nurturing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_account_id uuid not null references public.game_accounts(id) on delete restrict,
  package_id uuid references public.service_packages(id),
  package_name text not null,
  duration_days integer not null,
  total_paid numeric(14,2) not null check (total_paid >= 0),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.deposit_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(14,2) not null check (amount >= 10000),
  transfer_code text not null unique,
  status text not null default 'pending' check(status in ('pending','approved','rejected','cancelled')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.game_account_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  game_account_id uuid references public.game_accounts(id) on delete set null,
  account_label text,
  event_type text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.automation_workers (
  id uuid primary key default gen_random_uuid(),
  worker_name text not null unique,
  status text not null default 'offline' check(status in ('online','offline','paused','error')),
  last_heartbeat_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.automation_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  game_account_id uuid not null references public.game_accounts(id) on delete cascade,
  worker_id uuid references public.automation_workers(id),
  task_type text not null,
  status text not null default 'queued' check(status in ('queued','running','paused','completed','failed','cancelled')),
  scheduled_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  attempts integer not null default 0 check(attempts >= 0),
  max_attempts integer not null default 3 check(max_attempts between 0 and 10),
  payload jsonb not null default '{}'::jsonb,
  last_error text,
  created_at timestamptz not null default now()
);

create table if not exists public.automation_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.automation_tasks(id) on delete cascade,
  level text not null default 'info' check(level in ('info','warning','error')),
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(14,2) not null,
  transaction_type text not null,
  reference_id uuid,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_game_accounts_owner on public.game_accounts(owner_id,created_at desc);
create index if not exists idx_tasks_status_schedule on public.automation_tasks(status,scheduled_at);
create index if not exists idx_tasks_owner on public.automation_tasks(owner_id,created_at desc);
create index if not exists idx_deposits_owner on public.deposit_requests(user_id,created_at desc);
create index if not exists idx_events_owner on public.game_account_events(owner_id,created_at desc);

-- New profile and wallet records are created by trusted database trigger.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,display_name) values(new.id, coalesce(new.raw_user_meta_data->>'name',''))
  on conflict(id) do nothing;
  insert into public.wallets(user_id,balance) values(new.id,0) on conflict(user_id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created_dew on auth.users;
create trigger on_auth_user_created_dew after insert on auth.users
for each row execute function public.handle_new_user();

-- RLS enabled on user-facing tables. Admin operations must use verified server-side role.
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.service_packages enable row level security;
alter table public.game_accounts enable row level security;
alter table public.nurturing_subscriptions enable row level security;
alter table public.deposit_requests enable row level security;
alter table public.game_account_events enable row level security;
alter table public.automation_tasks enable row level security;
alter table public.automation_logs enable row level security;
alter table public.wallet_transactions enable row level security;

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles for select to authenticated using(id=auth.uid());
-- Profile role is intentionally immutable to customers. Profile editing is added
-- through a separate safe RPC in a later migration; never expose role updates.
drop policy if exists wallets_self_select on public.wallets;
create policy wallets_self_select on public.wallets for select to authenticated using(user_id=auth.uid());
drop policy if exists packages_active_select on public.service_packages;
create policy packages_active_select on public.service_packages for select to authenticated using(active=true);
drop policy if exists game_accounts_owner_all on public.game_accounts;
create policy game_accounts_owner_all on public.game_accounts for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
drop policy if exists subscriptions_self_select on public.nurturing_subscriptions;
create policy subscriptions_self_select on public.nurturing_subscriptions for select to authenticated using(user_id=auth.uid());
drop policy if exists deposits_self_select on public.deposit_requests;
create policy deposits_self_select on public.deposit_requests for select to authenticated using(user_id=auth.uid());
drop policy if exists events_self_select on public.game_account_events;
create policy events_self_select on public.game_account_events for select to authenticated using(owner_id=auth.uid());
drop policy if exists tasks_self_select on public.automation_tasks;
create policy tasks_self_select on public.automation_tasks for select to authenticated using(owner_id=auth.uid());
drop policy if exists logs_task_owner_select on public.automation_logs;
create policy logs_task_owner_select on public.automation_logs for select to authenticated using(exists(select 1 from public.automation_tasks t where t.id=task_id and t.owner_id=auth.uid()));
drop policy if exists wallet_transactions_self_select on public.wallet_transactions;
create policy wallet_transactions_self_select on public.wallet_transactions for select to authenticated using(user_id=auth.uid());

grant select on public.profiles,public.wallets,public.service_packages,public.game_accounts,
 public.nurturing_subscriptions,public.deposit_requests,public.game_account_events,
 public.automation_tasks,public.automation_logs,public.wallet_transactions to authenticated;
grant insert,update,delete on public.game_accounts to authenticated;

insert into public.service_packages(name,duration_days,price,active)
values ('Gói 30 ngày',30,75000,true),('Gói 60 ngày',60,135000,true),('Gói 150 ngày',150,260000,true)
on conflict(duration_days) do update set name=excluded.name,price=excluded.price,active=true;

-- Important: never grant customer access to change role or approve deposits.
-- Admin role assignment and payment approval belong to a protected server-side process.
