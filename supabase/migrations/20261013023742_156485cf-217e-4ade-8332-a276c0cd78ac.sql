create type public.app_role as enum ('super_admin');
create type public.store_status as enum ('trial','active','locked');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_name text not null,
  phone text not null,
  email text not null,
  business_field text not null,
  owner_id uuid not null,
  status public.store_status not null default 'trial',
  trial_ends_at timestamptz not null default (now() + interval '3 days'),
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.stores to authenticated;
grant all on public.stores to service_role;
alter table public.stores enable row level security;
create policy "Owners read own store" on public.stores for select to authenticated using (owner_id = auth.uid());
create policy "Super admins read stores" on public.stores for select to authenticated using (public.has_role(auth.uid(),'super_admin'));
create policy "Super admins update stores" on public.stores for update to authenticated using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));

create table public.store_members (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  unique (store_id, user_id)
);
grant select on public.store_members to authenticated;
grant all on public.store_members to service_role;
alter table public.store_members enable row level security;
create policy "Members read own membership" on public.store_members for select to authenticated using (user_id = auth.uid());

create table public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade,
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, update on public.admin_notifications to authenticated;
grant all on public.admin_notifications to service_role;
alter table public.admin_notifications enable row level security;
create policy "Super admins read notifications" on public.admin_notifications for select to authenticated using (public.has_role(auth.uid(),'super_admin'));
create policy "Super admins update notifications" on public.admin_notifications for update to authenticated using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));
alter publication supabase_realtime add table public.admin_notifications;

create or replace function public.update_updated_at_column() returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;
create trigger stores_updated_at before update on public.stores for each row execute function public.update_updated_at_column();

create or replace function public.grant_super_admin_verified() returns trigger language plpgsql security definer set search_path = public
as $$ begin
  if new.email_confirmed_at is not null and lower(new.email) in ('kennyphuong.vu@gmail.com','vuminhphuong2789@gmail.com') then
    insert into public.user_roles (user_id, role) values (new.id,'super_admin') on conflict do nothing;
  end if;
  return new;
end; $$;
create trigger on_auth_user_created_super_admin after insert on auth.users for each row execute function public.grant_super_admin_verified();
create trigger on_auth_user_confirmed_super_admin after update of email_confirmed_at on auth.users for each row
  when (old.email_confirmed_at is null and new.email_confirmed_at is not null) execute function public.grant_super_admin_verified();
insert into public.user_roles (user_id, role)
  select id, 'super_admin' from auth.users where email_confirmed_at is not null and lower(email) in ('kennyphuong.vu@gmail.com','vuminhphuong2789@gmail.com')
  on conflict do nothing;