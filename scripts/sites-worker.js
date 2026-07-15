const jsonHeaders = {
	'content-type': 'application/json; charset=utf-8',
	'cache-control': 'no-store'
};

function json(data, status = 200) {
	return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

function escapeHtml(value) {
	return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
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

async function handleChat(request, env) {
	if (request.method === 'OPTIONS') {
		return new Response(null, { status: 204 });
	}

	if (request.method !== 'POST') {
		return json({ ok: false, error: 'Method not allowed' }, 405);
	}

	if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
		return json({ ok: false, error: 'Assistant is not configured' }, 503);
	}

	let payload;
	try {
		payload = await request.json();
	} catch {
		return json({ ok: false, error: 'Invalid request' }, 400);
	}

	const message = typeof payload.message === 'string' ? payload.message.trim() : '';
	const name = typeof payload.name === 'string' ? payload.name.trim() : '';
	const website = typeof payload.website === 'string' ? payload.website.trim() : '';

	if (website) return json({ ok: true, reply: assistantReply(message || 'сообщение') });
	if (message.length < 2 || message.length > 1200) {
		return json({ ok: false, error: 'Message must contain 2–1200 characters' }, 400);
	}
	if (name.length > 80) return json({ ok: false, error: 'Name is too long' }, 400);

	const referer = request.headers.get('referer') || 'eldos.dev';
	const telegramText = [
		'<b>✦ Новое обращение с eldos.dev</b>',
		'',
		`<b>От:</b> ${escapeHtml(name || 'Не представился')}`,
		`<b>Сообщение:</b>\n${escapeHtml(message)}`,
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

	if (!telegramResponse.ok) {
		return json({ ok: false, error: 'Message delivery failed' }, 502);
	}

	return json({ ok: true, reply: assistantReply(message) });
}

const worker = {
	async fetch(request, env) {
		const url = new URL(request.url);

		if (url.pathname === '/api/chat') {
			return handleChat(request, env);
		}
		if (url.pathname === '/') {
			url.pathname = '/site.html';
			return env.ASSETS.fetch(new Request(url, request));
		}

		return env.ASSETS.fetch(request);
	}
};

export default worker;
