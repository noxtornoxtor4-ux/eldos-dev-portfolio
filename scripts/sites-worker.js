const jsonHeaders = {
	'content-type': 'application/json; charset=utf-8',
	'cache-control': 'no-store'
};

class HttpError extends Error {
	constructor(status, message) {
		super(message);
		this.status = status;
	}
}

function json(data, status = 200) {
	return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

function escapeHtml(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;');
}

function assistantReply(message) {
	const text = message.toLowerCase();

	if (/цен|стоим|бюджет|сколько/.test(text)) {
		return 'Стоимость зависит от масштаба и сроков. Эльдос уже получил сообщение и вернётся с уточняющими вопросами, чтобы дать честную оценку.';
	}
	if (/срок|когда|быстро|время/.test(text)) {
		return 'Небольшой MVP обычно можно спланировать за несколько недель. Эльдос получил запрос и поможет определить реалистичный срок именно для вашей задачи.';
	}
	if (/стек|технолог|svelte|node|backend|frontend/.test(text)) {
		return 'Основной стек — SvelteKit, TypeScript, Node.js и PostgreSQL. Конкретные технологии Эльдос подбирает под продукт, а не наоборот. Ваш вопрос уже отправлен ему.';
	}

	return 'Принял сообщение и передал его Эльдосу в Telegram. Обычно он отвечает в течение 24 часов.';
}

function requireSupabaseConfig(env, includeServiceRole = false) {
	if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
		throw new HttpError(503, 'Account service is not configured');
	}
	if (includeServiceRole && !env.SUPABASE_SERVICE_ROLE_KEY) {
		throw new HttpError(503, 'Account service is not configured');
	}
}

async function requireUser(request, env) {
	requireSupabaseConfig(env);
	const authorization = request.headers.get('authorization') || '';
	if (!authorization.startsWith('Bearer ')) {
		throw new HttpError(401, 'Authentication required');
	}

	const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
		headers: { apikey: env.SUPABASE_ANON_KEY, authorization }
	});
	if (!response.ok) throw new HttpError(401, 'Invalid session');

	const user = await response.json();
	if (!user?.id || !user?.email) throw new HttpError(401, 'Invalid session');
	if (!user.email_confirmed_at) throw new HttpError(403, 'Email confirmation required');

	return user;
}

async function serviceRequest(env, path, init = {}) {
	requireSupabaseConfig(env, true);
	const response = await fetch(`${env.SUPABASE_URL}${path}`, {
		...init,
		headers: {
			apikey: env.SUPABASE_SERVICE_ROLE_KEY,
			authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
			'content-type': 'application/json',
			...(init.headers || {})
		}
	});
	if (!response.ok) throw new HttpError(502, 'Account storage request failed');
	return response;
}

async function loadProfile(env, userId) {
	const response = await serviceRequest(
		env,
		`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,name,phone&limit=1`
	);
	const rows = await response.json();
	if (!Array.isArray(rows) || !rows[0]) throw new HttpError(409, 'Profile is not ready');
	return rows[0];
}

function handleConfig(request, env) {
	if (request.method !== 'GET') throw new HttpError(405, 'Method not allowed');
	requireSupabaseConfig(env);
	return json({
		ok: true,
		supabaseUrl: env.SUPABASE_URL,
		supabaseAnonKey: env.SUPABASE_ANON_KEY
	});
}

async function handleHistory(request, env) {
	if (request.method !== 'GET') throw new HttpError(405, 'Method not allowed');
	const user = await requireUser(request, env);
	const response = await serviceRequest(
		env,
		`/rest/v1/chat_messages?user_id=eq.${encodeURIComponent(user.id)}&select=id,role,content,created_at&order=created_at.asc`
	);
	return json({ ok: true, messages: await response.json() });
}

async function handleProfile(request, env) {
	if (request.method !== 'PATCH') throw new HttpError(405, 'Method not allowed');
	const user = await requireUser(request, env);
	let payload;
	try {
		payload = await request.json();
	} catch {
		throw new HttpError(400, 'Invalid request');
	}

	const name = typeof payload.name === 'string' ? payload.name.trim() : '';
	const phone = typeof payload.phone === 'string' ? payload.phone.trim() : '';
	const digits = phone.replace(/\D/g, '');
	if (name.length < 2 || name.length > 80) throw new HttpError(400, 'Valid name is required');
	if (phone.length > 32 || digits.length < 7 || digits.length > 15) {
		throw new HttpError(400, 'Valid phone number is required');
	}

	const response = await serviceRequest(
		env,
		`/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}`,
		{
			method: 'PATCH',
			headers: { prefer: 'return=representation' },
			body: JSON.stringify({ name, phone, updated_at: new Date().toISOString() })
		}
	);
	const rows = await response.json();
	return json({ ok: true, profile: { ...(rows[0] || { id: user.id, name, phone }), email: user.email } });
}

async function handleAccount(request, env) {
	if (request.method !== 'DELETE') throw new HttpError(405, 'Method not allowed');
	const user = await requireUser(request, env);
	await serviceRequest(env, `/auth/v1/admin/users/${encodeURIComponent(user.id)}`, {
		method: 'DELETE'
	});
	return json({ ok: true });
}

async function handleChat(request, env) {
	if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
	if (request.method !== 'POST') throw new HttpError(405, 'Method not allowed');
	if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
		throw new HttpError(503, 'Assistant is not configured');
	}

	const user = await requireUser(request, env);
	let payload;
	try {
		payload = await request.json();
	} catch {
		throw new HttpError(400, 'Invalid request');
	}

	const message = typeof payload.message === 'string' ? payload.message.trim() : '';
	const website = typeof payload.website === 'string' ? payload.website.trim() : '';
	const reply = assistantReply(message || 'сообщение');
	if (website) return json({ ok: true, reply });
	if (message.length < 2 || message.length > 1200) {
		throw new HttpError(400, 'Message must contain 2–1200 characters');
	}

	const profile = await loadProfile(env, user.id);
	await serviceRequest(env, '/rest/v1/chat_messages', {
		method: 'POST',
		headers: { prefer: 'return=minimal' },
		body: JSON.stringify([
			{ user_id: user.id, role: 'user', content: message },
			{ user_id: user.id, role: 'assistant', content: reply }
		])
	});

	const referer = request.headers.get('referer') || 'eldos.dev';
	const telegramText = [
		'<b>✦ Новое обращение с eldos.dev</b>',
		'',
		`<b>Контакт:</b> ${escapeHtml(profile.name)}`,
		`<b>Email:</b> <code>${escapeHtml(user.email)}</code>`,
		`<b>Телефон:</b> <code>${escapeHtml(profile.phone)}</code>`,
		'',
		`<b>Сообщение посетителя:</b>\n${escapeHtml(message)}`,
		'',
		`<b>Ответ E/D Assistant:</b>\n${escapeHtml(reply)}`,
		'',
		`<b>Страница:</b> ${escapeHtml(referer.slice(0, 300))}`,
		`<b>Время:</b> ${new Date().toISOString()}`
	].join('\n');

	const telegramResponse = await fetch(
		`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
		{
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				chat_id: env.TELEGRAM_CHAT_ID,
				text: telegramText,
				parse_mode: 'HTML',
				disable_web_page_preview: true
			})
		}
	);
	if (!telegramResponse.ok) throw new HttpError(502, 'Message delivery failed');

	return json({ ok: true, reply });
}

async function handleApi(request, env, pathname) {
	try {
		if (pathname === '/api/config') return handleConfig(request, env);
		if (pathname === '/api/history') return await handleHistory(request, env);
		if (pathname === '/api/profile') return await handleProfile(request, env);
		if (pathname === '/api/account') return await handleAccount(request, env);
		if (pathname === '/api/chat') return await handleChat(request, env);
		return json({ ok: false, error: 'Not found' }, 404);
	} catch (error) {
		if (error instanceof HttpError) return json({ ok: false, error: error.message }, error.status);
		return json({ ok: false, error: 'Unexpected server error' }, 500);
	}
}

const worker = {
	async fetch(request, env) {
		const url = new URL(request.url);
		if (url.pathname.startsWith('/api/')) return handleApi(request, env, url.pathname);
		if (url.pathname === '/') {
			url.pathname = '/site.html';
			return env.ASSETS.fetch(new Request(url, request));
		}
		return env.ASSETS.fetch(request);
	}
};

export default worker;
