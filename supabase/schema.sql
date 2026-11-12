-- HOAVIEN AUTO v0.2.0 — PostgreSQL / Supabase
create extension if not exists pgcrypto;

create type public.app_role as enum ('customer','staff','admin');
create type public.task_status as enum ('queued','running','paused','completed','failed','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create table public.account_groups (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null check (char_length(name) between 1 and 80),
 created_at timestamptz not null default now()
);
create table public.game_accounts (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 group_id uuid references public.account_groups(id) on delete set null,
 label text not null check (char_length(label) between 1 and 120),
 game_uid text,
 credential_ciphertext text, -- chỉ lưu ciphertext được mã hóa ở server; không lưu mật khẩu rõ
 status text not null default 'inactive' check (status in ('active','inactive','checking','error')),
 notes text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.automation_workers (
 id uuid primary key default gen_random_uuid(),
 worker_key_hash text unique not null,
 name text not null,
 status text not null default 'offline' check(status in ('online','offline','error')),
 last_heartbeat timestamptz,
 capabilities jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create table public.automation_tasks (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 game_account_id uuid not null references public.game_accounts(id) on delete cascade,
 worker_id uuid references public.automation_workers(id) on delete set null,
 task_type text not null,
 config jsonb not null default '{}'::jsonb,
 status public.task_status not null default 'queued',
 scheduled_at timestamptz,
 started_at timestamptz,
 finished_at timestamptz,
 attempts int not null default 0 check(attempts >= 0),
 error_message text,
 created_at timestamptz not null default now()
);
create table public.automation_logs (
 id bigserial primary key,
 task_id uuid not null references public.automation_tasks(id) on delete cascade,
 level text not null default 'info' check(level in ('debug','info','warning','error')),
 message text not null,
 details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create table public.nurturing_orders (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 game_account_id uuid not null references public.game_accounts(id) on delete restrict,
 status text not null default 'pending',
 started_at timestamptz,
 completed_at timestamptz,
 created_at timestamptz not null default now()
);
create table public.guild_orders (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null,
 requirements jsonb not null default '{}'::jsonb,
 status text not null default 'pending',
 created_at timestamptz not null default now()
);
create table public.flower_products (
 id uuid primary key default gen_random_uuid(),
 seller_id uuid not null references auth.users(id) on delete cascade,
 name text not null,
 category text not null,
 description text,
 price numeric(14,2) not null check(price >= 0),
 quantity int not null default 0 check(quantity >= 0),
 status text not null default 'draft' check(status in ('draft','active','sold_out','hidden')),
 created_at timestamptz not null default now()
);
create table public.flower_orders (
 id uuid primary key default gen_random_uuid(),
 buyer_id uuid not null references auth.users(id) on delete restrict,
 product_id uuid not null references public.flower_products(id) on delete restrict,
 seller_id uuid not null references auth.users(id) on delete restrict,
 quantity int not null check(quantity > 0),
 unit_price numeric(14,2) not null check(unit_price >= 0),
 status text not null default 'pending',
 created_at timestamptz not null default now()
);
create table public.rental_accounts (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null,
 price_per_day numeric(14,2) not null check(price_per_day >= 0),
 available boolean not null default true,
 details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create table public.rental_orders (
 id uuid primary key default gen_random_uuid(),
 renter_id uuid not null references auth.users(id) on delete restrict,
 rental_account_id uuid not null references public.rental_accounts(id) on delete restrict,
 starts_at timestamptz not null,
 ends_at timestamptz not null,
 status text not null default 'pending',
 check(ends_at > starts_at),
 created_at timestamptz not null default now()
);
create table public.wallets (
 user_id uuid primary key references auth.users(id) on delete cascade,
 balance numeric(14,2) not null default 0 check(balance >= 0),
 updated_at timestamptz not null default now()
);
create table public.wallet_transactions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete restrict,
 amount numeric(14,2) not null check(amount > 0),
 direction text not null check(direction in ('credit','debit')),
 status text not null default 'pending',
 reference_code text unique not null,
 description text,
 created_at timestamptz not null default now()
);
create table public.payment_transactions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete restrict,
 provider text not null,
 provider_reference text unique,
 amount numeric(14,2) not null check(amount > 0),
 status text not null default 'pending',
 webhook_verified_at timestamptz,
 raw_event jsonb,
 created_at timestamptz not null default now()
);
create table public.support_tickets (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 subject text not null,
 status text not null default 'open' check(status in ('open','in_progress','resolved','closed')),
 created_at timestamptz not null default now()
);
create table public.support_messages (
 id uuid primary key default gen_random_uuid(),
 ticket_id uuid not null references public.support_tickets(id) on delete cascade,
 sender_id uuid not null references auth.users(id) on delete restrict,
 body text not null,
 created_at timestamptz not null default now()
);
create table public.notifications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null,
 body text not null,
 read_at timestamptz,
 created_at timestamptz not null default now()
);
create table public.system_settings (
 key text primary key,
 value jsonb not null,
 updated_at timestamptz not null default now()
);
create table public.audit_logs (
 id bigserial primary key,
 actor_id uuid references auth.users(id) on delete set null,
 action text not null,
 entity_type text not null,
 entity_id text,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);

create index idx_game_accounts_owner on public.game_accounts(owner_id);
create index idx_automation_tasks_owner_status on public.automation_tasks(owner_id,status);
create index idx_automation_tasks_schedule on public.automation_tasks(status,scheduled_at);
create index idx_automation_logs_task on public.automation_logs(task_id,created_at desc);
create index idx_flower_products_status on public.flower_products(status,category);
create index idx_support_tickets_owner on public.support_tickets(owner_id,status);
create index idx_notifications_user on public.notifications(user_id,created_at desc);

-- Helper role function; role changes are server/admin controlled.
create or replace function public.current_app_role()
returns public.app_role language sql stable security definer set search_path=public
as $$ select role from public.profiles where id=auth.uid() $$;

alter table public.profiles enable row level security;
alter table public.account_groups enable row level security;
alter table public.game_accounts enable row level security;
alter table public.automation_tasks enable row level security;
alter table public.automation_logs enable row level security;
alter table public.nurturing_orders enable row level security;
alter table public.guild_orders enable row level security;
alter table public.flower_products enable row level security;
alter table public.flower_orders enable row level security;
alter table public.rental_accounts enable row level security;
alter table public.rental_orders enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy "profile read self or staff" on public.profiles for select to authenticated
using (id=auth.uid() or public.current_app_role() in ('admin','staff'));
create policy "profile update self" on public.profiles for update to authenticated
using (id=auth.uid()) with check (id=auth.uid());
create policy "groups own all" on public.account_groups for all to authenticated
using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "game accounts own all" on public.game_accounts for all to authenticated
using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "tasks own read" on public.automation_tasks for select to authenticated
using(owner_id=auth.uid() or public.current_app_role() in ('admin','staff'));
create policy "tasks own insert" on public.automation_tasks for insert to authenticated
with check(owner_id=auth.uid());
create policy "tasks own update" on public.automation_tasks for update to authenticated
using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "logs via owned task" on public.automation_logs for select to authenticated
using(exists(select 1 from public.automation_tasks t where t.id=task_id and (t.owner_id=auth.uid() or public.current_app_role() in ('admin','staff'))));
create policy "nurturing own all" on public.nurturing_orders for all to authenticated
using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "guild own all" on public.guild_orders for all to authenticated
using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "products public read active" on public.flower_products for select to anon,authenticated
using(status='active' or seller_id=auth.uid());
create policy "products seller manage" on public.flower_products for all to authenticated
using(seller_id=auth.uid()) with check(seller_id=auth.uid());
create policy "flower orders buyer seller read" on public.flower_orders for select to authenticated
using(buyer_id=auth.uid() or seller_id=auth.uid() or public.current_app_role() in ('admin','staff'));
create policy "flower orders buyer create" on public.flower_orders for insert to authenticated
with check(buyer_id=auth.uid());
create policy "rental listings public read" on public.rental_accounts for select to anon,authenticated
using(available=true or owner_id=auth.uid());
create policy "rental owner manage" on public.rental_accounts for all to authenticated
using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "rental orders parties read" on public.rental_orders for select to authenticated
using(renter_id=auth.uid() or exists(select 1 from public.rental_accounts r where r.id=rental_account_id and r.owner_id=auth.uid()));
create policy "rental orders renter create" on public.rental_orders for insert to authenticated
with check(renter_id=auth.uid());
create policy "wallet own read" on public.wallets for select to authenticated using(user_id=auth.uid());
create policy "wallet transactions own read" on public.wallet_transactions for select to authenticated using(user_id=auth.uid());
create policy "payments own read" on public.payment_transactions for select to authenticated using(user_id=auth.uid());
create policy "tickets own all" on public.support_tickets for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "messages ticket parties read" on public.support_messages for select to authenticated
using(exists(select 1 from public.support_tickets t where t.id=ticket_id and (t.owner_id=auth.uid() or public.current_app_role() in ('admin','staff'))));
create policy "messages ticket owner insert" on public.support_messages for insert to authenticated
with check(sender_id=auth.uid() and exists(select 1 from public.support_tickets t where t.id=ticket_id and t.owner_id=auth.uid()));
create policy "notifications own all" on public.notifications for all to authenticated
using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "audit admin read" on public.audit_logs for select to authenticated
using(public.current_app_role()='admin');

-- Deliberately no client write policies for balances, payment confirmations, worker records,
-- system settings, or audit logs. These require trusted server-side service-role operations.
