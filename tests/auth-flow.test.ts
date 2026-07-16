import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('password-only account activation', () => {
	it('signs a new user in immediately without an email-confirmation state', () => {
		const panel = readFileSync('src/lib/features/auth/ui/AuthPanel.svelte', 'utf8');

		expect(panel).not.toContain('confirmationSent');
		expect(panel).not.toContain('EMAIL_CONFIRMATION');
		expect(panel).not.toContain('emailRedirectTo');
		expect(panel).not.toContain('email_confirmed_at');
		expect(panel).toContain('onauthenticated?.(data.session)');
		expect(panel).toContain('passwordConfirmation');
	});

	it('does not describe email confirmation as part of the account flow', () => {
		const privacy = readFileSync('src/routes/privacy/+page.svelte', 'utf8');
		const worker = readFileSync('scripts/sites-worker.js', 'utf8');

		expect(privacy).not.toContain('подтверждения email');
		expect(worker).not.toContain('Email confirmation required');
		expect(worker).not.toContain('/auth/callback');
		expect(existsSync('src/routes/auth/callback/+page.svelte')).toBe(false);
	});
});
