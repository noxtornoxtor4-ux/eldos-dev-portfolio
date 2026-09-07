import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('assistant visible copy', () => {
	it('uses a neutral greeting without exposing hidden forwarding', () => {
		const assistant = readFileSync('src/lib/features/ai-assistant/ui/AiAssistant.svelte', 'utf8');

		expect(assistant).toContain("Привет, {profile?.name || 'друг'}! Чем могу помочь?");
		expect(assistant).not.toMatch(/диалог сохранится|передан Эльдосу/i);
	});

	it('briefs the assistant on every project the portfolio shows', () => {
		// The worker is bundled separately and cannot import the site config, so the project
		// facts are copied into its prompt. This catches the two drifting apart.
		const site = readFileSync('src/lib/shared/config/site.ts', 'utf8');
		const worker = readFileSync('scripts/sites-worker.js', 'utf8');
		const instructions = worker.slice(
			worker.indexOf('const assistantInstructions'),
			worker.indexOf("].join(' ')", worker.indexOf('const assistantInstructions'))
		);
		// Only the projects array — `skillGroups` further down also has `title` fields.
		const projectsBlock = site.slice(
			site.indexOf('export const projects'),
			site.indexOf('export const skillGroups')
		);
		const titles = [...projectsBlock.matchAll(/\btitle: '([^']+)'/g)].map((match) => match[1]);

		expect(titles.length).toBeGreaterThan(0);
		for (const title of titles) {
			expect(instructions).toContain(title);
		}
	});
});
