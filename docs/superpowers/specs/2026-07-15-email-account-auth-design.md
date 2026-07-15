# Email Accounts for E/D Assistant

Date: 2026-07-15

## Goal

Replace the temporary name-and-phone session form in E/D Assistant with real user accounts. A visitor can register with a name, email address, phone number, and password; confirm the email address; sign in again from another session; and see their saved conversation history.

## Scope

The feature includes:

- registration with name, email, phone, password, and password confirmation;
- email confirmation through Supabase Auth;
- sign-in and sign-out;
- password recovery and password update;
- profile display and profile editing;
- persistent chat history;
- a concise privacy-policy page linked from registration;
- account deletion with deletion of the user's profile and chat history;
- authenticated delivery of each visitor question and assistant reply to Eldos in Telegram.

The existing assistant response logic remains unchanged in this feature. Connecting a new generative AI provider is outside this scope.

## User Experience

### Anonymous visitor

Opening E/D Assistant shows two tabs: `Войти` and `Регистрация`.

The sign-in tab contains email, password, a submit button, and a `Забыли пароль?` action.

The registration tab contains name, email, phone, password, and password confirmation. Passwords must contain at least eight characters. The phone number must contain 7–15 digits after formatting characters are removed.

The consent checkbox from the current interface is removed. Under the registration button, concise copy states that creating an account means accepting the privacy policy, with a link to that policy.

### Registration and confirmation

After registration, the assistant shows a `Проверьте почту` state. The user follows the Supabase confirmation link and returns to the portfolio. Unconfirmed accounts cannot open the chat.

Duplicate email, invalid email, weak password, invalid phone, expired link, and network errors are shown as clear Russian-language messages without exposing internal details.

### Signed-in user

After sign-in, the assistant loads the user's saved message history in chronological order. The account header shows name and email and provides access to profile settings and sign-out.

Profile settings allow changing the display name and phone number. Email changes are not included in the first version because they require a second confirmation flow.

The user can recover a forgotten password by email, update the password on the protected recovery screen, sign out from all devices, or delete the account and all associated data.

## Architecture

The current SvelteKit project and FSD structure remain in place.

Suggested feature boundaries:

- `shared/api/supabase` owns Supabase client creation and typed API helpers;
- `entities/session` exposes the authenticated session state;
- `entities/profile` models the user's name, email, and phone;
- `entities/chat-message` models saved chat entries;
- `features/auth/sign-in`, `sign-up`, `password-recovery`, and `sign-out` own individual authentication actions;
- `features/profile/manage-profile` owns profile update and account deletion;
- `features/ai-assistant` renders authentication, profile, history, and chat states without owning persistence details.

Supabase Auth owns email/password credentials, email confirmation, access tokens, password recovery, and session revocation. Supabase Postgres stores profiles and chat messages. The public Supabase URL and anonymous key are safe client configuration; the service-role key is stored only as a hosted server secret and is never shipped to the browser or committed to source control.

## Data Model

### `profiles`

- `id uuid primary key` referencing `auth.users(id)` with cascade deletion;
- `name text not null`;
- `phone text not null`;
- `created_at timestamptz not null`;
- `updated_at timestamptz not null`.

A database trigger creates the profile from validated registration metadata when an Auth user is created.

### `chat_messages`

- `id uuid primary key`;
- `user_id uuid not null` referencing `auth.users(id)` with cascade deletion;
- `role text not null` restricted to `user` or `assistant`;
- `content text not null` with the existing 1,200-character limit for visitor messages;
- `created_at timestamptz not null`.

An index on `(user_id, created_at)` supports history loading.

Row Level Security is enabled on both tables. Authenticated users may read only their own profile and messages, and may update only their own name and phone. Chat writes are performed by the server route after identity validation, so clients cannot create forged assistant messages.

## Chat Data Flow

1. The signed-in client sends the visitor message to `/api/chat` with the Supabase access token in the authorization header.
2. The server validates the token with Supabase and derives the user id from the verified identity. It never trusts a client-supplied name, email, phone, or user id.
3. The server reads the verified profile, validates the message, and creates the assistant reply using the existing response logic.
4. The server saves the visitor message and assistant reply as two ordered records.
5. The server sends Eldos a Telegram message containing the verified name, email, phone, visitor question, and assistant reply. Passwords and access tokens are never included.
6. The API returns the same assistant reply to the browser. The client appends it to the visible history.

Unauthenticated, expired, or invalid sessions receive `401`. Validation errors receive `400`. Configuration or delivery failures use generic user-facing messages and do not leak secrets.

## Account and Privacy Behavior

- Authentication persists across browser sessions through Supabase's managed session.
- Sign-out clears the local session; global sign-out revokes all refresh tokens for the user.
- Password recovery uses a short-lived Supabase email link and a same-origin update-password route.
- Account deletion requires a fresh authenticated request and explicit confirmation in the UI. The server deletes the Auth user; database cascade rules remove the profile and message history.
- The privacy policy explains the storage of contact information and messages and their delivery to Eldos through Telegram.

## Supabase Configuration

Implementation requires a Supabase project with:

- email/password authentication enabled;
- email confirmation enabled;
- production Site URL and allowed redirect URLs configured for the deployed portfolio;
- SQL schema, trigger, indexes, and RLS policies applied;
- production SMTP configured before public launch so confirmation and recovery messages are reliably delivered.

Hosted environment values:

- public Supabase project URL;
- public Supabase anonymous key;
- server-only Supabase service-role key;
- existing server-only Telegram bot token and Telegram chat id.

No secret value is committed to the repository.

## Validation

The completed feature must verify:

- successful registration and email confirmation;
- rejection of duplicate email and invalid fields;
- sign-in rejection before email confirmation;
- successful sign-in and persistent session after confirmation;
- password recovery and update;
- profile update and global sign-out;
- history persistence after page reload and sign-in on a new session;
- server rejection of missing, invalid, and expired access tokens;
- RLS prevents one user from reading or editing another user's data;
- Telegram receives the verified contact, question, and exact assistant reply;
- account deletion removes the Auth user, profile, and history;
- Svelte checks, production build, and deployed API checks pass.

## Acceptance Criteria

The feature is complete when the old temporary identity form and consent checkbox are gone; the registration screen links to an accessible privacy policy; a new visitor can create and confirm an account; a returning user can sign in with email and password; saved history belongs only to that user; password recovery, sign-out, and account deletion work; and authenticated chat turns are stored and delivered to Eldos in Telegram without exposing passwords or tokens.
