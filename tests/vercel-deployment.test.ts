import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Vercel deployment contract', () => {
	it('uses the Vercel adapter by default and preserves the Sites build', () => {
		const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
		const viteConfig = readFileSync('vite.config.ts', 'utf8');

		expect(packageJson.devDependencies).toHaveProperty('@sveltejs/adapter-vercel');
		expect(packageJson.scripts.build).toBe('vite build');
		expect(packageJson.scripts['build:sites']).toContain('--mode sites');
		expect(viteConfig).toContain("from '@sveltejs/adapter-vercel'");
		expect(viteConfig).toContain("mode === 'sites'");
	});

	it('exposes the account and assistant APIs through SvelteKit server routes', () => {
		const routePath = 'src/routes/api/[...path]/+server.ts';
		expect(existsSync(routePath)).toBe(true);

		if (existsSync(routePath)) {
			const route = readFileSync(routePath, 'utf8');
			expect(route).toContain("from '$env/dynamic/private'");
			expect(route).toContain('worker.fetch');
			expect(route).toContain('export const prerender = false');
		}
	});
});
