import type { ChatMessage, Profile } from '$lib/shared/model/auth';

export class AccountApiError extends Error {
	constructor(public status: number) {
		super('ACCOUNT_API_ERROR');
		this.name = 'AccountApiError';
	}
}

async function accountRequest<T>(path: string, token: string, init: RequestInit = {}) {
	const response = await fetch(path, {
		...init,
		headers: {
			authorization: `Bearer ${token}`,
			...(init.headers || {})
		}
	});
	if (!response.ok) throw new AccountApiError(response.status);
	return (await response.json()) as T;
}

export async function loadHistory(token: string) {
	const data = await accountRequest<{ ok: true; messages: ChatMessage[] }>('/api/history', token);
	return data.messages;
}

export async function loadProfile(token: string) {
	const data = await accountRequest<{ ok: true; profile: Profile }>('/api/profile', token);
	return data.profile;
}

export async function updateProfile(token: string, profile: Pick<Profile, 'name' | 'phone'>) {
	const data = await accountRequest<{ ok: true; profile: Profile }>('/api/profile', token, {
		method: 'PATCH',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(profile)
	});
	return data.profile;
}

export async function deleteAccount(token: string) {
	await accountRequest<{ ok: true }>('/api/account', token, { method: 'DELETE' });
}

export async function sendChatMessage(token: string, message: string, website: string) {
	const data = await accountRequest<{ ok: true; reply: string }>('/api/chat', token, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ message, website })
	});
	return data.reply;
}
