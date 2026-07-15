# E/D Assistant Email Accounts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Replace the temporary visitor form with verified Supabase email/password accounts and private, persistent chat history.

**Architecture:** The SvelteKit frontend uses Supabase Auth for registration, confirmation, recovery, and session management. The site worker validates access tokens, reads verified profiles, stores chat messages in Supabase Postgres, and forwards complete turns to Telegram. Supabase Row Level Security prevents users from reading another account's profile or history.

**Tech Stack:** SvelteKit 2, Svelte 5, TypeScript, FSD, Supabase Auth/Postgres, Vitest, Cloudflare Workers, Telegram Bot API.

## Global Constraints

- Registration fields are name, email, phone, password, and password confirmation.
- Email confirmation is required before chat access.
- Passwords contain at least eight characters; visitor messages contain 2–1,200 characters.
- The old consent checkbox is replaced by a privacy-policy link.
- Passwords, access tokens, refresh tokens, and service keys never enter Telegram, Git, or browser logs.
- Every profile and message read is scoped to the verified Supabase user id.
- The existing scenario-based assistant reply function remains unchanged.
- The current SvelteKit/FSD structure, package manager, build staging, and public Sites deployment are preserved.

## File Map

- Create src/lib/shared/api/supabase/client.ts: runtime Supabase client factory.
- Create src/lib/shared/model/auth.ts: shared account, profile, and message types.
- Create src/lib/features/auth/model/validation.ts: deterministic form validation.
- Create src/lib/features/auth/ui/AuthPanel.svelte: sign-in, registration, confirmation, and recovery entry.
- Create src/lib/features/profile/ui/ProfilePanel.svelte: profile editing, global sign-out, and account deletion.
- Modify src/lib/features/ai-assistant/ui/AiAssistant.svelte: session bootstrap, auth states, private history, authenticated chat.
- Create src/routes/auth/callback/+page.svelte: confirmation callback.
- Create src/routes/auth/update-password/+page.svelte: password update callback.
- Create src/routes/privacy/+page.svelte: privacy policy.
- Modify scripts/sites-worker.js: runtime config, token validation, profile/history/account APIs, persistence, and Telegram.
- Modify src/app.css: cyberpunk auth, profile, callback, and privacy styles.
- Create supabase/migrations/202607150001_accounts.sql: profiles, chat messages, trigger, indexes, and RLS.
- Create tests/auth-validation.test.ts and tests/sites-worker.test.ts: regression tests.
- Modify package.json, pnpm-lock.yaml, and .env.example: dependencies, test command, and empty configuration names.

---

### Task 1: Authentication validation and shared contracts

**Files:**
- Create: src/lib/shared/model/auth.ts
- Create: src/lib/features/auth/model/validation.ts
- Create: tests/auth-validation.test.ts
- Modify: package.json
- Modify: pnpm-lock.yaml

**Interfaces:**
- Produces: Profile, ChatMessage, RegistrationInput, validateRegistration(input), and validatePassword(password).

- [ ] **Step 1: Install exact dependencies**

~~~powershell
pnpm add @supabase/supabase-js
pnpm add -D vitest
~~~

Add "test": "vitest run" to package scripts.

- [ ] **Step 2: Write failing validation tests**

~~~ts
import { describe, expect, it } from 'vitest';
import { validateRegistration } from '../src/lib/features/auth/model/validation';

describe('validateRegistration', () => {
  it('accepts the agreed registration shape', () => {
    expect(validateRegistration({
      name: 'Эльдос',
      email: 'person@example.com',
      phone: '+7 700 000 00 00',
      password: 'strongpass',
      passwordConfirmation: 'strongpass'
    })).toEqual({});
  });

  it('rejects invalid and mismatched values', () => {
    const errors = validateRegistration({
      name: 'A',
      email: 'bad',
      phone: '123',
      password: 'short',
      passwordConfirmation: 'different'
    });
    expect(Object.keys(errors).sort()).toEqual(['email', 'name', 'password', 'passwordConfirmation', 'phone']);
  });
});
~~~

- [ ] **Step 3: Run the test and verify failure**

Run: pnpm test -- tests/auth-validation.test.ts

Expected: FAIL because validation.ts does not exist.

- [ ] **Step 4: Implement contracts and validators**

~~~ts
export type RegistrationInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
};
export type Profile = { id: string; name: string; email: string; phone: string };
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};
~~~

~~~ts
import type { RegistrationInput } from '$lib/shared/model/auth';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function validatePassword(password: string) {
  return password.length >= 8 ? null : 'Пароль должен содержать минимум 8 символов.';
}
export function validateRegistration(input: RegistrationInput) {
  const errors: Record<string, string> = {};
  if (input.name.trim().length < 2) errors.name = 'Введите имя.';
  if (!emailPattern.test(input.email.trim())) errors.email = 'Введите корректный email.';
  const digits = input.phone.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) errors.phone = 'Введите корректный телефон.';
  const passwordError = validatePassword(input.password);
  if (passwordError) errors.password = passwordError;
  if (input.password !== input.passwordConfirmation) errors.passwordConfirmation = 'Пароли не совпадают.';
  return errors;
}
~~~

- [ ] **Step 5: Run and commit**

Run: pnpm test -- tests/auth-validation.test.ts

Expected: 2 tests pass.

Commit: feat: add account validation contracts

---

### Task 2: Supabase schema and ownership policies

**Files:**
- Create: supabase/migrations/202607150001_accounts.sql

**Interfaces:**
- Produces: public.profiles and public.chat_messages tables used by server REST calls.

- [ ] **Step 1: Write the migration**

~~~sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 80),
  phone text not null check (char_length(regexp_replace(phone, '\D', '', 'g')) between 7 and 15),
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
create index chat_messages_user_created_idx on public.chat_messages(user_id, created_at);
create function public.handle_new_user() returns trigger language plpgsql security definer
set search_path = '' as $$
begin
  insert into public.profiles(id, name, phone)
  values (new.id, trim(new.raw_user_meta_data->>'name'), trim(new.raw_user_meta_data->>'phone'));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();
alter table public.profiles enable row level security;
alter table public.chat_messages enable row level security;
create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "messages_select_own" on public.chat_messages for select to authenticated using ((select auth.uid()) = user_id);
grant select, update on public.profiles to authenticated;
grant select on public.chat_messages to authenticated;
~~~

- [ ] **Step 2: Apply and inspect**

Run the migration in the selected Supabase project. Verify both tables show RLS enabled, the trigger exists, and authenticated users have no INSERT policy for chat_messages.

- [ ] **Step 3: Commit**

Commit: feat: add account and chat database schema

---

### Task 3: Runtime Supabase client and authentication screens

**Files:**
- Create: src/lib/shared/api/supabase/client.ts
- Create: src/lib/features/auth/ui/AuthPanel.svelte
- Create: src/routes/auth/callback/+page.svelte
- Create: src/routes/auth/update-password/+page.svelte
- Modify: .env.example

**Interfaces:**
- Consumes: RegistrationInput and validateRegistration.
- Produces: getSupabase(): Promise<SupabaseClient> and AuthPanel authenticated-state callbacks.

- [ ] **Step 1: Implement runtime client creation**

~~~ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
let client: SupabaseClient | null = null;
export async function getSupabase() {
  if (client) return client;
  const response = await fetch('/api/config', { cache: 'no-store' });
  if (!response.ok) throw new Error('AUTH_NOT_CONFIGURED');
  const { supabaseUrl, supabaseAnonKey } = await response.json();
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  return client;
}
~~~

Keep env example values empty:

~~~dotenv
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
~~~

- [ ] **Step 2: Implement AuthPanel**

Create accessible sign-in and registration tabs. Sign in calls signInWithPassword. Registration calls:

~~~ts
await supabase.auth.signUp({
  email: input.email.trim().toLowerCase(),
  password: input.password,
  options: {
    emailRedirectTo: location.origin + '/auth/callback',
    data: { name: input.name.trim(), phone: input.phone.trim() }
  }
});
~~~

Recovery calls resetPasswordForEmail(email, { redirectTo: location.origin + '/auth/update-password' }). Show Russian states for invalid credentials, duplicate email, weak password, confirmation sent, expired link, and unavailable service.

- [ ] **Step 3: Implement callback pages**

The confirmation page exchanges the code query parameter using exchangeCodeForSession(code), then navigates to /?assistant=open. The update-password page requires a recovery session, validates the new password, calls updateUser({ password }), and navigates home.

- [ ] **Step 4: Run and commit**

Run: pnpm test && pnpm run check

Expected: tests pass and Svelte reports 0 errors and 0 warnings.

Commit: feat: add Supabase account screens

---

### Task 4: Authenticated worker APIs and persistence

**Files:**
- Modify: scripts/sites-worker.js
- Create: tests/sites-worker.test.ts

**Interfaces:**
- Produces: GET /api/config, GET /api/history, PATCH /api/profile, DELETE /api/account, and authenticated POST /api/chat.

- [ ] **Step 1: Write failing worker tests**

Test that /api/chat returns 401 without a Bearer token; rejects an invalid token; uses the id returned by /auth/v1/user; stores one user row and one assistant row; sends verified profile data to Telegram; and never includes a password or token. Test that history filters user_id=eq.<verified-id> and account deletion calls /auth/v1/admin/users/<verified-id>.

Run: pnpm test -- tests/sites-worker.test.ts

Expected: FAIL because token validation and the new routes are absent.

- [ ] **Step 2: Add server authentication**

~~~js
async function requireUser(request, env) {
  const authorization = request.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) throw new HttpError(401, 'Authentication required');
  const response = await fetch(env.SUPABASE_URL + '/auth/v1/user', {
    headers: { apikey: env.SUPABASE_ANON_KEY, authorization }
  });
  if (!response.ok) throw new HttpError(401, 'Invalid session');
  return { user: await response.json(), authorization };
}
~~~

Add a server-only REST helper using SUPABASE_SERVICE_ROLE_KEY. It always filters user-owned reads by the verified id and returns generic failures.

- [ ] **Step 3: Add API routes**

- /api/config returns only SUPABASE_URL and SUPABASE_ANON_KEY.
- /api/history validates the token and selects the verified user's ordered messages.
- /api/profile validates the token, accepts only name and phone, and updates only the verified id.
- /api/account validates the token and deletes only that Auth user through the admin endpoint.
- /api/chat ignores client identity fields, loads the verified profile, inserts the question and reply, and sends verified name, email, phone, question, and reply to Telegram.

- [ ] **Step 4: Run and commit**

Run: pnpm test -- tests/sites-worker.test.ts

Expected: authorization, ownership, persistence, and Telegram assertions pass.

Commit: feat: secure assistant APIs with Supabase accounts

---

### Task 5: Private assistant history and profile

**Files:**
- Create: src/lib/features/profile/ui/ProfilePanel.svelte
- Modify: src/lib/features/ai-assistant/ui/AiAssistant.svelte
- Modify: src/app.css

**Interfaces:**
- Consumes: getSupabase, AuthPanel, Profile, ChatMessage, and authenticated worker APIs.

- [ ] **Step 1: Replace temporary identity state**

Remove VisitorIdentity, sessionStorage, identity submission, and the consent checkbox. On mount, initialize Supabase, subscribe to onAuthStateChange, and load history with:

~~~ts
const response = await fetch('/api/history', {
  headers: { authorization: 'Bearer ' + session.access_token }
});
~~~

Render AuthPanel without a session. Render the profile header, saved history, quick prompts, and composer with a confirmed session.

- [ ] **Step 2: Authenticate chat requests**

~~~ts
await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    authorization: 'Bearer ' + session.access_token
  },
  body: JSON.stringify({ message: text, website })
});
~~~

Handle 401 by refreshing once through Supabase, then return to sign-in if refresh fails.

- [ ] **Step 3: Add profile controls**

ProfilePanel edits name and phone through PATCH /api/profile, performs supabase.auth.signOut({ scope: 'global' }), and deletes through DELETE /api/account only after the user types УДАЛИТЬ.

- [ ] **Step 4: Style and validate**

Preserve the cyberpunk visual language, keyboard navigation, mobile layout, and visible focus states. Add styles for tabs, errors, confirmation, profile, history loading, destructive confirmation, and empty history.

Run: pnpm run check && pnpm test

Expected: 0 Svelte errors/warnings and all tests pass.

Commit: feat: add private assistant account experience

---

### Task 6: Privacy, static routing, production configuration, and deployment

**Files:**
- Create: src/routes/privacy/+page.svelte
- Modify: scripts/sites-worker.js
- Modify: src/app.css

**Interfaces:**
- Produces: public /privacy, /auth/callback, and /auth/update-password browser routes.

- [ ] **Step 1: Add privacy page**

State in Russian that the site stores name, email, phone, account identifiers, and chat history; sends contact details and complete chat turns to Eldos in Telegram; never stores plain-text passwords; uses Supabase for authentication/storage; and allows account deletion from the profile.

- [ ] **Step 2: Route prerendered pages**

After build, inspect dist/client and map extensionless browser paths to the exact emitted HTML files in the worker while preserving /api handling and env.ASSETS.fetch.

- [ ] **Step 3: Run full verification**

~~~powershell
pnpm run format
pnpm run check
pnpm test
pnpm run build
~~~

Expected: Svelte reports 0 errors and 0 warnings; tests pass; build exits 0; dist/server/index.js and required route HTML files exist.

- [ ] **Step 4: Configure production**

Enable Supabase email confirmation, configure the production Site URL and redirect allowlist, apply the migration, and configure SMTP. Store SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY as Sites environment values without exposing them.

- [ ] **Step 5: Publish and verify**

Commit: feat: publish authenticated assistant accounts

Push the exact validated commit, package the matching build, save a Sites version, deploy publicly, and poll until succeeded. Verify registration, confirmation, sign-in, recovery, history after reload, cross-user isolation, Telegram delivery, global sign-out, and account deletion in production.
