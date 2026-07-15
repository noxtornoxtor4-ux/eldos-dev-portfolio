import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Groq privacy and configuration', () => {
	it('discloses Groq processing and documents only a blank secret', () => {
		const privacy = readFileSync('src/routes/privacy/+page.svelte', 'utf8');
		const envExample = readFileSync('.env.example', 'utf8');

		expect(privacy).toContain('Groq');
		expect(privacy).toContain('вопрос');
		expect(privacy).toContain('истори');
		expect(privacy).not.toContain('OpenAI');
		expect(envExample).toContain('GROQ_API_KEY=');
		expect(envExample).toContain('GROQ_MODEL=llama-3.3-70b-versatile');
		expect(envExample).not.toMatch(/GROQ_API_KEY=.+/);
		expect(envExample).not.toContain('OPENAI_API_KEY');
	});
});
