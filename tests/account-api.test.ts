import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('account API client', () => {
	it('loads private history with the access token', async () => {
		const messages = [{ id: 'm1', role: 'user', content: 'Привет', created_at: '2026-07-15T12:00:00Z' }];
		const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true, messages }));
		vi.stubGlobal('fetch', fetchMock);
		const { loadHistory } = await import('../src/lib/shared/api/account/client');

		await expect(loadHistory('access-token')).resolves.toEqual(messages);
		expect(fetchMock).toHaveBeenCalledWith('/api/history', {
			headers: { authorization: 'Bearer access-token' }
		});
	});

	it('sends only chat content and the anti-spam field', async () => {
		const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true, reply: 'Ответ' }));
		vi.stubGlobal('fetch', fetchMock);
		const { sendChatMessage } = await import('../src/lib/shared/api/account/client');

		await expect(sendChatMessage('access-token', 'Вопрос', '')).resolves.toBe('Ответ');
		const [, init] = fetchMock.mock.calls[0];
		expect(JSON.parse(String(init.body))).toEqual({ message: 'Вопрос', website: '' });
		expect(String(init.body)).not.toContain('phone');
		expect(String(init.body)).not.toContain('name');
	});

	it('surfaces an authentication status without leaking a response body', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'internal detail' }, { status: 401 })));
		const { AccountApiError, loadProfile } = await import('../src/lib/shared/api/account/client');

		await expect(loadProfile('expired-token')).rejects.toEqual(new AccountApiError(401));
	});
});
