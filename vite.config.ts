import cloudflareAdapter from '@sveltejs/adapter-cloudflare';
import vercelAdapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// The browser reaches Supabase directly for auth and session refresh, so its origin has to be
// named in connect-src. Moving the project to another Supabase instance means changing this.
const supabaseOrigin = 'https://zrpzdwexxukxwtfhduzo.supabase.co';

export default defineConfig(({ mode }) => ({
	plugins: [
		sveltekit({
			// Every page is prerendered, so 'auto' resolves to hashes for SvelteKit's own inline
			// bootstrap script and ships the policy in a <meta> tag. Directives a meta tag cannot
			// carry — frame-ancestors above all — are sent as real headers from vercel.json.
			csp: {
				mode: 'auto',
				directives: {
					'default-src': ['none'],
					'script-src': ['self'],
					// The hash covers exactly one inline style attribute: the one SvelteKit's route
					// announcer sets on itself. 'unsafe-hashes' is what makes a hash apply to an
					// attribute at all; it permits that single declaration and nothing else, unlike
					// 'unsafe-inline'. app.css hides the announcer anyway, so a future SvelteKit
					// release changing the string costs a console notice, not a visible element.
					'style-src': [
						'self',
						'https://fonts.googleapis.com',
						'unsafe-hashes',
						'sha256-S8qMpvofolR8Mpjy4kQvEm7m1q8clzU4dfDH0AmvZjo='
					],
					'font-src': ['https://fonts.gstatic.com'],
					'img-src': ['self', 'data:'],
					// No wss: entry — the app never opens a Supabase realtime channel.
					'connect-src': ['self', supabaseOrigin],
					'base-uri': ['none'],
					'object-src': ['none'],
					'form-action': ['self'],
					'frame-ancestors': ['none']
				}
			},

			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter: mode === 'sites' ? cloudflareAdapter() : vercelAdapter()
		})
	]
}));
