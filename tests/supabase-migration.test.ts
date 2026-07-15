import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202607150001_accounts.sql'), 'utf8');

describe('Supabase account migration', () => {
	it('creates cascading user-owned tables with RLS', () => {
		expect(migration).toContain('create table public.profiles');
		expect(migration).toContain('create table public.chat_messages');
		expect(migration.match(/on delete cascade/g)).toHaveLength(2);
		expect(migration).toContain('alter table public.profiles enable row level security');
		expect(migration).toContain('alter table public.chat_messages enable row level security');
	});

	it('allows users to read only their own records', () => {
		expect(migration).toContain('create policy "profiles_select_own"');
		expect(migration).toContain('create policy "messages_select_own"');
		expect(migration).toContain('(select auth.uid()) = id');
		expect(migration).toContain('(select auth.uid()) = user_id');
		expect(migration).not.toMatch(/create policy[^;]+chat_messages[^;]+for insert/is);
	});

	it('creates a profile from verified registration metadata', () => {
		expect(migration).toContain('create function public.handle_new_user()');
		expect(migration).toContain('new.raw_user_meta_data');
		expect(migration).toContain('create trigger on_auth_user_created');
	});
});
