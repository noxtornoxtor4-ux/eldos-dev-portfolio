import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('OpenAI privacy and configuration', () => {
	it('discloses AI processing and documents only a blank secret', () => {
		const privacy = readFileSync('src/routes/privacy/+page.svelte', 'utf8');
		const envExample = readFileSync('.env.example', 'utf8');

		expect(privacy).toContain('OpenAI');
		expect(privacy).toContain('вопрос');
		expect(privacy).toContain('истори');
		expect(envExample).toContain('OPENAI_API_KEY=');
		expect(envExample).toContain('OPENAI_MODEL=gpt-5.4-mini');
		expect(envExample).not.toMatch(/OPENAI_API_KEY=.+/);
	});
});
