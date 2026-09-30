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
	GROQ_API_KEY: 'groq-server-secret',
	GROQ_MODEL: 'openai/gpt-oss-120b',
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
	it('serves the portfolio at the clean root URL without an asset redirect', async () => {
		const assetFetch = vi.fn(async (assetRequest: Request) => new Response(assetRequest.url));
		const response = await worker.fetch(request('/'), { ...env, ASSETS: { fetch: assetFetch } });

		expect(response.status).toBe(200);
		expect(new URL(assetFetch.mock.calls[0][0].url).pathname).toBe('/site');
	});

	it.each([
		['/privacy', '/privacy.html'],
		['/auth/update-password', '/auth/update-password.html']
	])('maps the browser route %s to its prerendered page', async (path, assetPath) => {
		const assetFetch = vi.fn(async (assetRequest: Request) => new Response(assetRequest.url));
		const response = await worker.fetch(request(path), { ...env, ASSETS: { fetch: assetFetch } });

		expect(response.status).toBe(200);
		expect(new URL(assetFetch.mock.calls[0][0].url).pathname).toBe(assetPath);
	});

	it.each(['/', '/privacy', '/some/asset.js'])(
		'sends the security headers with the page served at %s',
		async (path) => {
			const assetFetch = vi.fn(async () => new Response('<!doctype html>'));
			const response = await worker.fetch(request(path), { ...env, ASSETS: { fetch: assetFetch } });

			expect(response.headers.get('x-frame-options')).toBe('DENY');
			expect(response.headers.get('content-security-policy')).toBe("frame-ancestors 'none'");
			expect(response.headers.get('x-content-type-options')).toBe('nosniff');
			expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
			expect(response.headers.get('cross-origin-opener-policy')).toBe('same-origin');
			expect(response.headers.get('permissions-policy')).toContain('camera=()');
		}
	);

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
		expect(JSON.stringify(data)).not.toContain(env.GROQ_API_KEY);
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
		const previousMessages = [
			{ role: 'assistant', content: 'Предыдущий ответ' },
			{ role: 'user', content: 'Предыдущий вопрос' }
		];
		const aiReply = 'Конечно. Расскажите, какую задачу должен решать ваш продукт?';
		// `_init` is unused here but keeps `mock.calls` typed as a two-element tuple.
		const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
			const url = String(input);
			if (url.endsWith('/auth/v1/user')) return Response.json(user);
			if (url.includes('/rest/v1/profiles')) {
				return Response.json([
					{ id: user.id, name: 'Verified Visitor', phone: '+7 700 000 00 00' }
				]);
			}
			if (url.includes('/rest/v1/chat_messages?')) return Response.json(previousMessages);
			if (url === 'https://api.groq.com/openai/v1/responses') {
				return Response.json({
					output: [
						{
							type: 'message',
							role: 'assistant',
							content: [{ type: 'output_text', text: aiReply }]
						}
					]
				});
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
		const responseData = await response.json();
		// The quota probe also queries chat_messages, so match the history query by its columns.
		const contextCall = fetchMock.mock.calls.find(
			([url]) =>
				String(url).includes('/rest/v1/chat_messages?') &&
				String(url).includes('select=role,content')
		);
		const contextUrl = String(contextCall?.[0]);
		expect(contextUrl).toContain(`user_id=eq.${user.id}`);
		expect(contextUrl).toContain('order=created_at.desc');
		expect(contextUrl).toContain('limit=12');

		const groqCall = fetchMock.mock.calls.find(
			([url]) => String(url) === 'https://api.groq.com/openai/v1/responses'
		);
		expect(groqCall).toBeDefined();
		const groqHeaders = new Headers(groqCall?.[1]?.headers);
		const groqBody = JSON.parse(String(groqCall?.[1]?.body));
		expect(groqHeaders.get('authorization')).toBe(`Bearer ${env.GROQ_API_KEY}`);
		expect(groqBody.model).toBe('openai/gpt-oss-120b');
		expect(groqBody.input).toEqual([
			{ role: 'user', content: 'Предыдущий вопрос' },
			{ role: 'assistant', content: 'Предыдущий ответ' },
			{ role: 'user', content: 'Хочу обсудить проект' }
		]);

		const insertCall = fetchMock.mock.calls.find(([url]) =>
			String(url).endsWith('/rest/v1/chat_messages')
		);
		expect(insertCall).toBeDefined();
		const inserted = JSON.parse(String(insertCall?.[1]?.body));
		expect(inserted).toHaveLength(2);
		expect(inserted.map((entry: { user_id: string }) => entry.user_id)).toEqual([user.id, user.id]);
		expect(inserted.map((entry: { role: string }) => entry.role)).toEqual(['user', 'assistant']);
		expect(inserted[1].content).toBe(aiReply);
		expect(responseData.reply).toBe(aiReply);
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
		expect(telegramBody.text).toContain(aiReply);
		expect(telegramBody.text).not.toContain('Forged name');
		expect(telegramBody.text).not.toContain('must-never-leak');
		expect(telegramBody.text).not.toContain('visitor-access-token');
		expect(aiReply).not.toMatch(/Telegram|передал Эльдосу|24 час/i);
	});

	it('keeps the Telegram message within the 4096 character limit when escaping expands it', async () => {
		// '&' becomes '&amp;', so a maximum-length message of ampersands would otherwise produce a
		// payload Telegram rejects with 400 — surfacing to the visitor as a failed delivery.
		const longMessage = '&'.repeat(1200);
		const longReply = '<'.repeat(1200);
		// `_init` is unused here but keeps `mock.calls` typed as a two-element tuple.
		const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
			const url = String(input);
			if (url.endsWith('/auth/v1/user')) return Response.json(user);
			if (url.includes('/rest/v1/profiles')) {
				return Response.json([{ id: user.id, name: 'Visitor', phone: '+7 700 000 00 00' }]);
			}
			if (url.includes('/rest/v1/chat_messages?')) return Response.json([]);
			if (url === 'https://api.groq.com/openai/v1/responses') {
				return Response.json({
					output: [
						{
							type: 'message',
							role: 'assistant',
							content: [{ type: 'output_text', text: longReply }]
						}
					]
				});
			}
			if (url.endsWith('/rest/v1/chat_messages')) return new Response(null, { status: 201 });
			if (url.includes('api.telegram.org')) return Response.json({ ok: true, result: {} });
			return new Response(null, { status: 404 });
		});
		vi.stubGlobal('fetch', fetchMock);

		const response = await worker.fetch(
			request('/api/chat', {
				method: 'POST',
				headers: authHeaders({
					'content-type': 'application/json',
					referer: `https://eldos.dev/?q=${'&'.repeat(400)}`
				}),
				body: JSON.stringify({ message: longMessage })
			}),
			env
		);

		expect(response.status).toBe(200);
		const telegramCall = fetchMock.mock.calls.find(([url]) =>
			String(url).includes('api.telegram.org')
		);
		const telegramText = JSON.parse(String(telegramCall?.[1]?.body)).text;
		expect(telegramText.length).toBeLessThanOrEqual(4096);
		// A cut must never land inside an entity, which would break parse_mode: 'HTML'.
		expect(telegramText).not.toMatch(/&[a-z]*…/);
	});

	it('throttles an authenticated visitor who floods the chat, before paying for Groq', async () => {
		const quota = Array.from({ length: 20 }, (_, index) => ({ id: `msg-${index}` }));
		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.endsWith('/auth/v1/user')) return Response.json(user);
			// The quota probe is the chat_messages query that selects ids for the user's own turns.
			if (url.includes('/rest/v1/chat_messages?') && url.includes('select=id')) {
				return Response.json(quota);
			}
			return new Response(null, { status: 404 });
		});
		vi.stubGlobal('fetch', fetchMock);

		const response = await worker.fetch(
			request('/api/chat', {
				method: 'POST',
				headers: authHeaders({ 'content-type': 'application/json' }),
				body: JSON.stringify({ message: 'Ещё один вопрос' })
			}),
			env
		);

		expect(response.status).toBe(429);
		const called = fetchMock.mock.calls.map(([url]) => String(url));
		expect(called.some((url) => url.includes('api.groq.com'))).toBe(false);
		expect(called.some((url) => url.includes('api.telegram.org'))).toBe(false);
	});

	it('rejects authenticated chat when Groq is not configured', async () => {
		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.endsWith('/auth/v1/user')) return Response.json(user);
			if (url.includes('/rest/v1/profiles')) {
				return Response.json([{ id: user.id, name: 'Visitor', phone: '+7 700 000 00 00' }]);
			}
			if (url.includes('/rest/v1/chat_messages?')) return Response.json([]);
			return new Response(null, { status: 404 });
		});
		vi.stubGlobal('fetch', fetchMock);

		const response = await worker.fetch(
			request('/api/chat', {
				method: 'POST',
				headers: authHeaders({ 'content-type': 'application/json' }),
				body: JSON.stringify({ message: 'Расскажи о разработке' })
			}),
			{ ...env, GROQ_API_KEY: undefined }
		);

		expect(response.status).toBe(503);
		expect(fetchMock.mock.calls.some(([url]) => String(url).includes('api.groq.com'))).toBe(false);
	});

	it('returns a generic error for an empty Groq response', async () => {
		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.endsWith('/auth/v1/user')) return Response.json(user);
			if (url.includes('/rest/v1/profiles')) {
				return Response.json([{ id: user.id, name: 'Visitor', phone: '+7 700 000 00 00' }]);
			}
			if (url.includes('/rest/v1/chat_messages?')) return Response.json([]);
			if (url === 'https://api.groq.com/openai/v1/responses') {
				return Response.json({ output: [] });
			}
			return new Response(null, { status: 404 });
		});
		vi.stubGlobal('fetch', fetchMock);

		const response = await worker.fetch(
			request('/api/chat', {
				method: 'POST',
				headers: authHeaders({ 'content-type': 'application/json' }),
				body: JSON.stringify({ message: 'Расскажи о разработке' })
			}),
			env
		);

		expect(response.status).toBe(502);
		expect(
			fetchMock.mock.calls.some(
				([url]) => String(url) === 'https://api.groq.com/openai/v1/responses'
			)
		).toBe(true);
		expect(fetchMock.mock.calls.some(([url]) => String(url).includes('api.telegram.org'))).toBe(
			false
		);
		expect(JSON.stringify(await response.json())).not.toContain(env.GROQ_API_KEY);
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

	it('allows an authenticated user without an email-confirmation timestamp', async () => {
		const rows = [
			{ id: 'message-1', role: 'user', content: 'Привет', created_at: '2026-07-15T12:00:00Z' }
		];
		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.endsWith('/auth/v1/user')) {
				return Response.json({ ...user, email_confirmed_at: null });
			}
			if (url.includes('/rest/v1/chat_messages')) return Response.json(rows);
			return new Response(null, { status: 404 });
		});
		vi.stubGlobal('fetch', fetchMock);

		const response = await worker.fetch(request('/api/history', { headers: authHeaders() }), env);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.messages).toEqual(rows);
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
