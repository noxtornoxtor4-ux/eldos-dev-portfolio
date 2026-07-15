create table public.profiles (
	id uuid primary key references auth.users(id) on delete cascade,
	name text not null check (char_length(trim(name)) between 2 and 80),
	phone text not null check (
		char_length(regexp_replace(phone, '\D', '', 'g')) between 7 and 15
	),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.chat_messages (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	role text not null check (role in ('user', 'assistant')),
	content text not null check (char_length(content) between 1 and 1200),
	created_at timestamptz not null default now()
);

create index chat_messages_user_created_idx
	on public.chat_messages(user_id, created_at);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
	insert into public.profiles(id, name, phone)
	values (
		new.id,
		trim(new.raw_user_meta_data->>'name'),
		trim(new.raw_user_meta_data->>'phone')
	);
	return new;
end;
$$;

create trigger on_auth_user_created
	after insert on auth.users
	for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.chat_messages enable row level security;

create policy "profiles_select_own"
	on public.profiles
	for select
	to authenticated
	using ((select auth.uid()) = id);

create policy "profiles_update_own"
	on public.profiles
	for update
	to authenticated
	using ((select auth.uid()) = id)
	with check ((select auth.uid()) = id);

create policy "messages_select_own"
	on public.chat_messages
	for select
	to authenticated
	using ((select auth.uid()) = user_id);

grant select, update on public.profiles to authenticated;
grant select on public.chat_messages to authenticated;
