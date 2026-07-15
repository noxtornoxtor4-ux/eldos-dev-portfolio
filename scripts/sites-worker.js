const jsonHeaders = {
	'content-type': 'application/json; charset=utf-8',
	'cache-control': 'no-store'
};

/**
 * @typedef {{
 *   SUPABASE_URL?: string;
 *   SUPABASE_ANON_KEY?: string;
 *   SUPABASE_SERVICE_ROLE_KEY?: string;
 *   GROQ_API_KEY?: string;
 *   GROQ_MODEL?: string;
 *   TELEGRAM_BOT_TOKEN?: string;
 *   TELEGRAM_CHAT_ID?: string;
 *   ASSETS: { fetch(request: Request): Promise<Response> };
 * }} Env
 * @typedef {{ id: string; email: string; email_confirmed_at?: string | null }} AuthUser
 * @typedef {{ id: string; name: string; phone: string }} ProfileRow
 * @typedef {{ role: 'user' | 'assistant'; content: string }} MessageRow
 * @typedef {{ type?: string; text?: unknown }} ResponseContent
 * @typedef {{ content?: ResponseContent[] }} ResponseOutput
 * @typedef {{ output_text?: unknown; output?: ResponseOutput[] }} ResponsePayload
 */

class HttpError extends Error {
	/** @param {number} status @param {string} message */
	constructor(status, message) {
		super(message);
		this.status = status;
	}
}

/** @param {unknown} data @param {number} status */
function json(data, status = 200) {
	return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

/** @param {unknown} value */
function escapeHtml(value) {
	return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

const assistantInstructions = [
	'Ты E/D Assistant — дружелюбный AI-помощник на портфолио разработчика Эльдоса.',
	'Отвечай на языке пользователя, естественно, полезно и кратко.',
	'Если для точного ответа не хватает данных, задай один понятный уточняющий вопрос.',
	'Не говори, что сообщение пересылается в Telegram или Эльдосу.',
	'Не обещай, что Эльдос ответит позже, и не выдумывай личные факты о нём.',
	'Ограничь ответ 900 символами.'
].join(' ');

/** @param {Env} env @param {string} userId */
async function loadRecentMessages(env, userId) {
	const response = await serviceRequest(
		env,
		`/rest/v1/chat_messages?user_id=eq.${encodeURIComponent(userId)}&select=role,content&order=created_at.desc&limit=12`
	);
	/** @type {MessageRow[]} */
	const rows = await response.json();
	return Array.isArray(rows) ? rows.reverse() : [];
}

/** @param {unknown} payload */
function extractResponseText(payload) {
	const data = /** @type {ResponsePayload} */ (
		payload && typeof payload === 'object' ? payload : {}
	);
	if (typeof data.output_text === 'string') return data.output_text.trim();
	if (!Array.isArray(data.output)) return '';
	/** @type {string[]} */
	const parts = [];
	for (const output of data.output) {
		if (!Array.isArray(output.content)) continue;
		for (const item of output.content) {
			if (item.type === 'output_text' && typeof item.text === 'string') parts.push(item.text);
		}
	}
	return parts.join('\n').trim();
}

/** @param {string} reply */
function constrainReply(reply) {
	if (reply.length <= 1200) return reply;
	return `${reply.slice(0, 1199).trimEnd()}…`;
}

/** @param {Env} env @param {string} message @param {MessageRow[]} history */
async function generateAssistantReply(env, message, history) {
	if (!env.GROQ_API_KEY) throw new HttpError(503, 'AI service is not configured');
	const response = await fetch('https://api.groq.com/openai/v1/responses', {
		method: 'POST',
		headers: {
			authorization: `Bearer ${env.GROQ_API_KEY}`,
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			model: env.GROQ_MODEL || 'llama-3.3-70b-versatile',
			instructions: assistantInstructions,
			input: [...history, { role: 'user', content: message }],
			max_output_tokens: 500
		})
	});
	if (!response.ok) throw new HttpError(502, 'AI service is temporarily unavailable');
	const reply = extractResponseText(await response.json());
	if (!reply) throw new HttpError(502, 'AI service returned an empty response');
	return constrainReply(reply);
}

/** @param {Env} env @param {boolean} includeServiceRole */
function requireSupabaseConfig(env, includeServiceRole = false) {
	if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
		throw new HttpError(503, 'Account service is not configured');
	}
	if (includeServiceRole && !env.SUPABASE_SERVICE_ROLE_KEY) {
		throw new HttpError(503, 'Account service is not configured');
	}
}

/** @param {Request} request @param {Env} env */
async function requireUser(request, env) {
	requireSupabaseConfig(env);
	const supabaseUrl = /** @type {string} */ (env.SUPABASE_URL);
	const anonKey = /** @type {string} */ (env.SUPABASE_ANON_KEY);
	const authorization = request.headers.get('authorization') || '';
	if (!authorization.startsWith('Bearer ')) {
		throw new HttpError(401, 'Authentication required');
	}

	const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
		headers: { apikey: anonKey, authorization }
	});
	if (!response.ok) throw new HttpError(401, 'Invalid session');

	/** @type {AuthUser} */
	const user = await response.json();
	if (!user?.id || !user?.email) throw new HttpError(401, 'Invalid session');
	if (!user.email_confirmed_at) throw new HttpError(403, 'Email confirmation required');

	return user;
}

/** @param {Env} env @param {string} path @param {RequestInit} init */
async function serviceRequest(env, path, init = {}) {
	requireSupabaseConfig(env, true);
	const supabaseUrl = /** @type {string} */ (env.SUPABASE_URL);
	const serviceRoleKey = /** @type {string} */ (env.SUPABASE_SERVICE_ROLE_KEY);
	/** @type {Record<string, string>} */
	const serviceHeaders = {
		apikey: serviceRoleKey,
		authorization: `Bearer ${serviceRoleKey}`,
		'content-type': 'application/json'
	};
	const response = await fetch(`${supabaseUrl}${path}`, {
		...init,
		headers: {
			...serviceHeaders,
			...(init.headers || {})
		}
	});
	if (!response.ok) throw new HttpError(502, 'Account storage request failed');
	return response;
}

/** @param {Env} env @param {string} userId */
async function loadProfile(env, userId) {
	const response = await serviceRequest(
		env,
		`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,name,phone&limit=1`
	);
	/** @type {ProfileRow[]} */
	const rows = await response.json();
	if (!Array.isArray(rows) || !rows[0]) throw new HttpError(409, 'Profile is not ready');
	return rows[0];
}

/** @param {Request} request @param {Env} env */
function handleConfig(request, env) {
	if (request.method !== 'GET') throw new HttpError(405, 'Method not allowed');
	requireSupabaseConfig(env);
	return json({
		ok: true,
		supabaseUrl: env.SUPABASE_URL,
		supabaseAnonKey: env.SUPABASE_ANON_KEY
	});
}

/** @param {Request} request @param {Env} env */
async function handleHistory(request, env) {
	if (request.method !== 'GET') throw new HttpError(405, 'Method not allowed');
	const user = await requireUser(request, env);
	const response = await serviceRequest(
		env,
		`/rest/v1/chat_messages?user_id=eq.${encodeURIComponent(user.id)}&select=id,role,content,created_at&order=created_at.asc`
	);
	return json({ ok: true, messages: await response.json() });
}

/** @param {Request} request @param {Env} env */
async function handleProfile(request, env) {
	const user = await requireUser(request, env);
	if (request.method === 'GET') {
		const profile = await loadProfile(env, user.id);
		return json({ ok: true, profile: { ...profile, email: user.email } });
	}
	if (request.method !== 'PATCH') throw new HttpError(405, 'Method not allowed');
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
	return json({
		ok: true,
		profile: { ...(rows[0] || { id: user.id, name, phone }), email: user.email }
	});
}

/** @param {Request} request @param {Env} env */
async function handleAccount(request, env) {
	if (request.method !== 'DELETE') throw new HttpError(405, 'Method not allowed');
	const user = await requireUser(request, env);
	await serviceRequest(env, `/auth/v1/admin/users/${encodeURIComponent(user.id)}`, {
		method: 'DELETE'
	});
	return json({ ok: true });
}

/** @param {Request} request @param {Env} env */
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
	if (website) return json({ ok: true, reply: 'Спасибо.' });
	if (message.length < 2 || message.length > 1200) {
		throw new HttpError(400, 'Message must contain 2–1200 characters');
	}

	const [profile, history] = await Promise.all([
		loadProfile(env, user.id),
		loadRecentMessages(env, user.id)
	]);
	const reply = await generateAssistantReply(env, message, history);
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

/** @param {Request} request @param {Env} env @param {string} pathname */
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
	/** @param {Request} request @param {Env} env */
	async fetch(request, env) {
		const url = new URL(request.url);
		if (url.pathname.startsWith('/api/')) return handleApi(request, env, url.pathname);
		if (url.pathname === '/') {
			url.pathname = '/site';
			return env.ASSETS.fetch(new Request(url, request));
		}
		const prerenderedPage = {
			'/privacy': '/privacy.html',
			'/auth/callback': '/auth/callback.html',
			'/auth/update-password': '/auth/update-password.html'
		}[url.pathname];
		if (prerenderedPage) {
			url.pathname = prerenderedPage;
			return env.ASSETS.fetch(new Request(url, request));
		}
		return env.ASSETS.fetch(request);
	}
};

export default worker;
