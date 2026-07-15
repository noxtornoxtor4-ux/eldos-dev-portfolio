import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export async function getSupabase() {
	if (client) return client;

	const response = await fetch('/api/config', { cache: 'no-store' });
	if (!response.ok) throw new Error('AUTH_NOT_CONFIGURED');

	const config = (await response.json()) as {
		supabaseUrl?: string;
		supabaseAnonKey?: string;
	};

	if (!config.supabaseUrl || !config.supabaseAnonKey) {
		throw new Error('AUTH_NOT_CONFIGURED');
	}

	client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
		auth: {
			persistSession: true,
			autoRefreshToken: true,
			detectSessionInUrl: true,
			flowType: 'pkce'
		}
	});

	return client;
}
