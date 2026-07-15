import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from '../scripts/sites-worker.js';

const user = {
	id: '4b8fe06c-b621-49fd-88c9-4c17eef659ab',
	aud: 'authenticated',
	role: 'authenticated',
	email: 'person@example.com',
	email_confirmed_at: '2026-07-15T12:00:00.000Z',
	phone: '',
	app_metadata: { provider: 'email', providers: ['email'] },
	user_metadata: { name: 'Visitor', phone: '+7 700 000 00 00' },
	identities: [],
	created_at: '2026-07-15T12:00:00.000Z',
	updated_at: '2026-07-15T12:00:00.000Z'
};

const env = {
	SUPABASE_URL: 'https://project.supabase.co',
	SUPABASE_ANON_KEY: 'public-anon-key',
	SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_server-key',
	TELEGRAM_BOT_TOKEN: 'telegram-secret-token',
	TELEGRAM_CHAT_ID: '5892009410',
	ASSETS: { fetch: vi.fn() }
};

function request(path: string, init?: RequestInit) {
	return new Request(`https://eldos.dev${path}`, init);
}

function authHeaders(extra: Record<string, string> = {}) {
	return { authorization: 'Bearer visitor-access-token', ...extra };
}

beforeEach(() => {
	vi.clearAllMocks();
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('Sites worker account APIs', () => {
	it.each([
		['/privacy', '/privacy.html'],
		['/auth/callback', '/auth/callback.html'],
		['/auth/update-password', '/auth/update-password.html']
	])('maps the browser route %s to its prerendered page', async (path, assetPath) => {
		const assetFetch = vi.fn(async (assetRequest: Request) => new Response(assetRequest.url));
		const response = await worker.fetch(request(path), { ...env, ASSETS: { fetch: assetFetch } });

		expect(response.status).toBe(200);
		expect(new URL(assetFetch.mock.calls[0][0].url).pathname).toBe(assetPath);
	});

	it('returns public Supabase configuration without server secrets', async () => {
		const response = await worker.fetch(request('/api/config'), env);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toEqual({
			ok: true,
			supabaseUrl: env.SUPABASE_URL,
			supabaseAnonKey: env.SUPABASE_ANON_KEY
		});
		expect(JSON.stringify(data)).not.toContain(env.SUPABASE_SERVICE_ROLE_KEY);
	});

	it('rejects chat messages without an authenticated session', async () => {
		const response = await worker.fetch(
			request('/api/chat', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ message: 'Новый проект' })
			}),
			env
		);

		expect(response.status).toBe(401);
	});

	it('stores a verified chat turn and sends verified profile data to Telegram', async () => {
		const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			const url = String(input);
			if (url.endsWith('/auth/v1/user')) return Response.json(user);
			if (url.includes('/rest/v1/profiles')) {
				return Response.json([
					{ id: user.id, name: 'Verified Visitor', phone: '+7 700 000 00 00' }
				]);
			}
			if (url.endsWith('/rest/v1/chat_messages')) return new Response(null, { status: 201 });
			if (url.includes('api.telegram.org')) return Response.json({ ok: true, result: {} });
			return new Response(null, { status: 404 });
		});
		vi.stubGlobal('fetch', fetchMock);

		const response = await worker.fetch(
			request('/api/chat', {
				method: 'POST',
				headers: authHeaders({ 'content-type': 'application/json' }),
				body: JSON.stringify({
					message: 'Хочу обсудить проект',
					name: 'Forged name',
					phone: '000',
					password: 'must-never-leak'
				})
			}),
			env
		);

		expect(response.status).toBe(200);
		const insertCall = fetchMock.mock.calls.find(([url]) =>
			String(url).endsWith('/rest/v1/chat_messages')
		);
		expect(insertCall).toBeDefined();
		const inserted = JSON.parse(String(insertCall?.[1]?.body));
		expect(inserted).toHaveLength(2);
		expect(inserted.map((entry: { user_id: string }) => entry.user_id)).toEqual([user.id, user.id]);
		expect(inserted.map((entry: { role: string }) => entry.role)).toEqual(['user', 'assistant']);
		const insertHeaders = new Headers(insertCall?.[1]?.headers);
		expect(insertHeaders.get('apikey')).toBe(env.SUPABASE_SERVICE_ROLE_KEY);
		expect(insertHeaders.get('authorization')).toBe(`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`);

		const telegramCall = fetchMock.mock.calls.find(([url]) =>
			String(url).includes('api.telegram.org')
		);
		const telegramBody = JSON.parse(String(telegramCall?.[1]?.body));
		expect(telegramBody.text).toContain('Verified Visitor');
		expect(telegramBody.text).toContain('person@example.com');
		expect(telegramBody.text).toContain('+7 700 000 00 00');
		expect(telegramBody.text).not.toContain('Forged name');
		expect(telegramBody.text).not.toContain('must-never-leak');
		expect(telegramBody.text).not.toContain('visitor-access-token');
	});

	it('loads history only for the verified user', async () => {
		const rows = [
			{ id: 'message-1', role: 'user', content: 'Привет', created_at: '2026-07-15T12:00:00Z' }
		];
		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.endsWith('/auth/v1/user')) return Response.json(user);
			if (url.includes('/rest/v1/chat_messages')) return Response.json(rows);
			return new Response(null, { status: 404 });
		});
		vi.stubGlobal('fetch', fetchMock);

		const response = await worker.fetch(request('/api/history', { headers: authHeaders() }), env);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.messages).toEqual(rows);
		const historyUrl = fetchMock.mock.calls
			.map(([url]) => String(url))
			.find((url) => url.includes('/rest/v1/chat_messages'));
		expect(historyUrl).toContain(`user_id=eq.${user.id}`);
		expect(historyUrl).toContain('order=created_at.asc');
	});

	it('returns a profile scoped to the verified account', async () => {
		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.endsWith('/auth/v1/user')) return Response.json(user);
			if (url.includes('/rest/v1/profiles')) {
				return Response.json([
					{ id: user.id, name: 'Verified Visitor', phone: '+7 700 000 00 00' }
				]);
			}
			return new Response(null, { status: 404 });
		});
		vi.stubGlobal('fetch', fetchMock);

		const response = await worker.fetch(request('/api/profile', { headers: authHeaders() }), env);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.profile).toEqual({
			id: user.id,
			name: 'Verified Visitor',
			phone: '+7 700 000 00 00',
			email: user.email
		});
	});

	it('deletes only the authenticated account', async () => {
		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.endsWith('/auth/v1/user')) return Response.json(user);
			if (url.includes('/auth/v1/admin/users/')) return Response.json({ id: user.id });
			return new Response(null, { status: 404 });
		});
		vi.stubGlobal('fetch', fetchMock);

		const response = await worker.fetch(
			request('/api/account', { method: 'DELETE', headers: authHeaders() }),
			env
		);

		expect(response.status).toBe(200);
		expect(fetchMock.mock.calls.map(([url]) => String(url))).toContain(
			`${env.SUPABASE_URL}/auth/v1/admin/users/${user.id}`
		);
	});
});
