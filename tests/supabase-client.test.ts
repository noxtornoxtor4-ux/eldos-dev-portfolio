import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
	vi.unstubAllGlobals();
	vi.resetModules();
});

describe('getSupabase', () => {
	it('loads the public runtime configuration before creating a client', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(
				JSON.stringify({
					supabaseUrl: 'https://example.supabase.co',
					supabaseAnonKey: 'public-anon-key'
				}),
				{ status: 200, headers: { 'content-type': 'application/json' } }
			)
		);
		vi.stubGlobal('fetch', fetchMock);

		const { getSupabase } = await import('../src/lib/shared/api/supabase/client');
		const client = await getSupabase();

		expect(fetchMock).toHaveBeenCalledWith('/api/config', { cache: 'no-store' });
		expect(client.auth).toBeDefined();
	});

	it('rejects unavailable configuration without exposing details', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

		const { getSupabase } = await import('../src/lib/shared/api/supabase/client');

		await expect(getSupabase()).rejects.toThrow('AUTH_NOT_CONFIGURED');
	});
});
