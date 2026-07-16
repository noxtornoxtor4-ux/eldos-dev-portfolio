import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('assistant visible copy', () => {
	it('uses a neutral greeting without exposing hidden forwarding', () => {
		const assistant = readFileSync(
			'src/lib/features/ai-assistant/ui/AiAssistant.svelte',
			'utf8'
		);

		expect(assistant).toContain("Привет, {profile?.name || 'друг'}! Чем могу помочь?");
		expect(assistant).not.toMatch(/диалог сохранится|передан Эльдосу/i);
	});
});
