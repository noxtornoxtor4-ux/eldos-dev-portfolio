# Real AI Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the rule-based E/D Assistant replies with real OpenAI responses while preserving private account history and silent Telegram delivery.

**Architecture:** The existing authenticated `/api/chat` worker route remains the only browser entrypoint. After verifying the Supabase session, the worker loads the current user's last 12 messages, calls the OpenAI Responses API with server-only credentials, stores the question and exact AI reply in Supabase, and sends the same turn to Telegram without mentioning that delivery in the browser response.

**Tech Stack:** SvelteKit 2, Svelte 5, TypeScript, Cloudflare Workers, Supabase Auth/Postgres, OpenAI Responses API, Vitest, Telegram Bot API, Sites hosting.

## Global Constraints

- The AI replies normally in the chat and never tells the visitor that the message was forwarded to Telegram or Eldos.
- Telegram receives the verified contact, visitor question, and exact AI reply silently.
- The visitor question and exact AI reply remain in the authenticated user's persistent history.
- Only the verified user's last 12 messages may be used as model context.
- `OPENAI_API_KEY` remains server-only and never enters `/api/config`, browser assets, Supabase messages, Telegram, or logs.
- The first production model is `gpt-5.4-mini` through `POST https://api.openai.com/v1/responses`.
- Visitor messages and stored assistant replies remain within the existing 1–1,200 character database constraint.
- No voice, image, web-search, or tool-calling features are added.

---

## File Map

- Modify `scripts/sites-worker.js`: load per-user context, call OpenAI, extract and constrain the reply, then persist and forward the exact turn.
- Modify `tests/sites-worker.test.ts`: prove verified-user scoping, OpenAI request shape, exact persistence, silent Telegram delivery, and configuration failures.
- Modify `src/routes/privacy/+page.svelte`: disclose that chat content is processed by OpenAI to generate replies.
- Create `tests/privacy-policy.test.ts`: prevent removal of the OpenAI disclosure.
- Modify `.env.example`: document the server-only OpenAI key and selected model name.
- Rebuild `dist/**`: stage the exact production worker and Svelte assets for Sites.

---

### Task 1: Authenticated OpenAI responses with private conversation context

**Files:**

- Modify: `tests/sites-worker.test.ts`
- Modify: `scripts/sites-worker.js`

**Interfaces:**

- Consumes: `serviceRequest(env, path, init)`, the verified `AuthUser.id`, and the existing `handleChat(request, env)` request flow.
- Produces: `loadRecentMessages(env, userId): Promise<MessageRow[]>`, `generateAssistantReply(env, message, history): Promise<string>`, and a `/api/chat` response whose `reply` is the exact normalized OpenAI output.

- [ ] **Step 1: Extend the test environment and write the failing OpenAI integration test**

Add server-only configuration to the test environment:

```ts
const env = {
	SUPABASE_URL: 'https://project.supabase.co',
	SUPABASE_ANON_KEY: 'public-anon-key',
	SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_server-key',
	OPENAI_API_KEY: 'openai-server-secret',
	OPENAI_MODEL: 'gpt-5.4-mini',
	TELEGRAM_BOT_TOKEN: 'telegram-secret-token',
	TELEGRAM_CHAT_ID: '5892009410',
	ASSETS: { fetch: vi.fn() }
};
```

Replace the current successful chat mock with a context row and a raw Responses API payload:

```ts
const previousMessages = [
	{ role: 'assistant', content: 'Предыдущий ответ' },
	{ role: 'user', content: 'Предыдущий вопрос' }
];
const aiReply = 'Конечно. Расскажите, какую задачу должен решать ваш продукт?';

if (url.includes('/rest/v1/chat_messages?')) return Response.json(previousMessages);
if (url === 'https://api.openai.com/v1/responses') {
	return Response.json({
		output: [
			{
				type: 'message',
				role: 'assistant',
				content: [{ type: 'output_text', text: aiReply }]
			}
		]
	});
}
```

Assert the verified user filter, chronological model input, model name, server authorization, and exact saved reply:

```ts
const contextCall = fetchMock.mock.calls.find(([url]) =>
	String(url).includes('/rest/v1/chat_messages?')
);
const contextUrl = String(contextCall?.[0]);
expect(contextUrl).toContain(`user_id=eq.${user.id}`);
expect(contextUrl).toContain('order=created_at.desc');
expect(contextUrl).toContain('limit=12');

const openAiCall = fetchMock.mock.calls.find(
	([url]) => String(url) === 'https://api.openai.com/v1/responses'
);
const openAiHeaders = new Headers(openAiCall?.[1]?.headers);
const openAiBody = JSON.parse(String(openAiCall?.[1]?.body));
expect(openAiHeaders.get('authorization')).toBe(`Bearer ${env.OPENAI_API_KEY}`);
expect(openAiBody.model).toBe('gpt-5.4-mini');
expect(openAiBody.input).toEqual([
	{ role: 'user', content: 'Предыдущий вопрос' },
	{ role: 'assistant', content: 'Предыдущий ответ' },
	{ role: 'user', content: 'Хочу обсудить проект' }
]);

expect(inserted[1].content).toBe(aiReply);
expect((await response.json()).reply).toBe(aiReply);
expect(telegramBody.text).toContain(aiReply);
expect(aiReply).not.toMatch(/Telegram|передал Эльдосу|24 час/i);
```

- [ ] **Step 2: Add failing configuration and invalid-output tests**

Add one test that calls authenticated `/api/chat` with `OPENAI_API_KEY` omitted and expects status `503` without an OpenAI request:

```ts
it('rejects authenticated chat when OpenAI is not configured', async () => {
	const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
		const url = String(input);
		if (url.endsWith('/auth/v1/user')) return Response.json(user);
		if (url.includes('/rest/v1/profiles')) {
			return Response.json([{ id: user.id, name: 'Visitor', phone: '+7 700 000 00 00' }]);
		}
		if (url.includes('/rest/v1/chat_messages?')) return Response.json([]);
		return new Response(null, { status: 404 });
	});
	vi.stubGlobal('fetch', fetchMock);

	const response = await worker.fetch(
		request('/api/chat', {
			method: 'POST',
			headers: authHeaders({ 'content-type': 'application/json' }),
			body: JSON.stringify({ message: 'Расскажи о разработке' })
		}),
		{ ...env, OPENAI_API_KEY: undefined }
	);

expect(response.status).toBe(503);
expect(fetchMock.mock.calls.some(([url]) => String(url).includes('api.openai.com'))).toBe(false);
});
```

Add one test whose OpenAI response has an empty `output` array and expect status `502` with a generic JSON error that does not contain the key or upstream response body:

```ts
it('returns a generic error for an empty OpenAI response', async () => {
	const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
		const url = String(input);
		if (url.endsWith('/auth/v1/user')) return Response.json(user);
		if (url.includes('/rest/v1/profiles')) {
			return Response.json([{ id: user.id, name: 'Visitor', phone: '+7 700 000 00 00' }]);
		}
		if (url.includes('/rest/v1/chat_messages?')) return Response.json([]);
		if (url === 'https://api.openai.com/v1/responses') return Response.json({ output: [] });
		return new Response(null, { status: 404 });
	});
	vi.stubGlobal('fetch', fetchMock);

	const response = await worker.fetch(
		request('/api/chat', {
			method: 'POST',
			headers: authHeaders({ 'content-type': 'application/json' }),
			body: JSON.stringify({ message: 'Расскажи о разработке' })
		}),
		env
	);

expect(response.status).toBe(502);
expect(JSON.stringify(await response.json())).not.toContain(env.OPENAI_API_KEY);
});
```

- [ ] **Step 3: Run the focused test and verify RED**

Run:

```powershell
pnpm exec vitest run tests/sites-worker.test.ts
```

Expected: FAIL because the worker does not request conversation context or OpenAI and still returns a rule-based reply.

- [ ] **Step 4: Replace the rule-based function with OpenAI helpers**

Extend the worker environment and types:

```js
/**
 * @typedef {{
 *   SUPABASE_URL?: string;
 *   SUPABASE_ANON_KEY?: string;
 *   SUPABASE_SERVICE_ROLE_KEY?: string;
 *   OPENAI_API_KEY?: string;
 *   OPENAI_MODEL?: string;
 *   TELEGRAM_BOT_TOKEN?: string;
 *   TELEGRAM_CHAT_ID?: string;
 *   ASSETS: { fetch(request: Request): Promise<Response> };
 * }} Env
 * @typedef {{ id: string; email: string; email_confirmed_at?: string | null }} AuthUser
 * @typedef {{ id: string; name: string; phone: string }} ProfileRow
 * @typedef {{ role: 'user' | 'assistant'; content: string }} MessageRow
 */
```

Remove `assistantReply(message)` and add:

```js
const assistantInstructions = [
	'Ты E/D Assistant — дружелюбный AI-помощник на портфолио разработчика Эльдоса.',
	'Отвечай на языке пользователя, естественно, полезно и кратко.',
	'Если для точного ответа не хватает данных, задай один понятный уточняющий вопрос.',
	'Не говори, что сообщение пересылается в Telegram или Эльдосу.',
	'Не обещай, что Эльдос ответит позже, и не выдумывай личные факты о нём.',
	'Ограничь ответ 900 символами.'
].join(' ');

async function loadRecentMessages(env, userId) {
	const response = await serviceRequest(
		env,
		`/rest/v1/chat_messages?user_id=eq.${encodeURIComponent(userId)}&select=role,content&order=created_at.desc&limit=12`
	);
	/** @type {MessageRow[]} */
	const rows = await response.json();
	return Array.isArray(rows) ? rows.reverse() : [];
}

function extractResponseText(payload) {
	if (typeof payload?.output_text === 'string') return payload.output_text.trim();
	if (!Array.isArray(payload?.output)) return '';
	return payload.output
		.flatMap((item) => (Array.isArray(item?.content) ? item.content : []))
		.filter((item) => item?.type === 'output_text' && typeof item.text === 'string')
		.map((item) => item.text)
		.join('\n')
		.trim();
}

function constrainReply(reply) {
	if (reply.length <= 1200) return reply;
	return `${reply.slice(0, 1199).trimEnd()}…`;
}

async function generateAssistantReply(env, message, history) {
	if (!env.OPENAI_API_KEY) throw new HttpError(503, 'AI service is not configured');
	const response = await fetch('https://api.openai.com/v1/responses', {
		method: 'POST',
		headers: {
			authorization: `Bearer ${env.OPENAI_API_KEY}`,
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			model: env.OPENAI_MODEL || 'gpt-5.4-mini',
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
```

- [ ] **Step 5: Integrate the helpers into `handleChat`**

Validate the message and honeypot before paid work. Then load only the verified user's context and request the AI reply:

```js
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
```

Keep the existing Supabase insert and Telegram body, using the returned `reply` unchanged in both places.

- [ ] **Step 6: Run the focused test and verify GREEN**

Run:

```powershell
pnpm exec vitest run tests/sites-worker.test.ts
```

Expected: all worker tests pass; the successful test proves the OpenAI reply is identical in the browser response, database insert, and Telegram body.

- [ ] **Step 7: Commit the core behavior**

```powershell
git add scripts/sites-worker.js tests/sites-worker.test.ts
git commit -m "feat: answer assistant chats with OpenAI"
```

---

### Task 2: Privacy disclosure and runtime configuration contract

**Files:**

- Create: `tests/privacy-policy.test.ts`
- Modify: `src/routes/privacy/+page.svelte`
- Modify: `.env.example`

**Interfaces:**

- Consumes: the new OpenAI processing behavior from Task 1.
- Produces: a public privacy disclosure and the exact local/hosted environment key names `OPENAI_API_KEY` and `OPENAI_MODEL`.

- [ ] **Step 1: Write the failing privacy/configuration test**

```ts
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
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
pnpm exec vitest run tests/privacy-policy.test.ts
```

Expected: FAIL because neither the disclosure nor OpenAI environment keys exist.

- [ ] **Step 3: Add the OpenAI disclosure**

Update the page date to `PRIVACY / 2026-07-16` and add a section before Telegram:

```svelte
<section>
	<span>03</span>
	<div>
		<h2>Ответы нейросети</h2>
		<p>
			Ваш вопрос и последние сообщения из истории передаются OpenAI только для создания ответа
			E/D Assistant. Имя, телефон, пароль и токены доступа в запрос модели не включаются.
		</p>
	</div>
</section>
```

Renumber the later visual section labels to remain sequential.

- [ ] **Step 4: Document the environment contract**

Append to `.env.example`:

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
```

- [ ] **Step 5: Run the privacy test, Svelte check, and full suite**

Run:

```powershell
pnpm exec vitest run tests/privacy-policy.test.ts
pnpm run check
pnpm test
```

Expected: privacy test passes, Svelte reports `0 errors and 0 warnings`, and the complete suite has zero failures.

- [ ] **Step 6: Commit the disclosure**

```powershell
git add .env.example src/routes/privacy/+page.svelte tests/privacy-policy.test.ts
git commit -m "docs: disclose OpenAI chat processing"
```

---

### Task 3: Production secret, build, deployment, and end-to-end verification

**Files:**

- Modify through build: `dist/**`
- No secret file is committed.

**Interfaces:**

- Consumes: `OPENAI_API_KEY`, optional `OPENAI_MODEL`, the validated source commit, and the existing Sites project in `.openai/hosting.json`.
- Produces: a public deployment whose authenticated `/api/chat` uses OpenAI and retains the same account, history, and Telegram behavior.

- [ ] **Step 1: Configure OpenAI credentials without exposing them**

Create an OpenAI API key in the OpenAI API dashboard. Add its value locally after the equals sign in the ignored `.env` file; the committed example remains blank:

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
```

Update the Sites environment with `OPENAI_API_KEY` marked secret and `OPENAI_MODEL` marked non-secret. Preserve all Supabase and Telegram values.

- [ ] **Step 2: Run fresh verification and the production build**

Run:

```powershell
pnpm run check
pnpm test
pnpm run build
```

Expected: Svelte reports `0 errors and 0 warnings`; all tests pass; build exits `0`; `dist/server/index.js`, `dist/client/site.html`, and `dist/client/privacy.html` exist.

- [ ] **Step 3: Prove secrets are absent from build output**

Scan `dist/**` in memory for the configured values of `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `TELEGRAM_BOT_TOKEN`. Print only secret names and matching file paths, never the values.

Expected:

```text
secretLeaks: []
```

- [ ] **Step 4: Commit the exact staged build**

```powershell
git add dist
git commit -m "build: stage OpenAI assistant release"
git status --short
```

Expected: the commit succeeds and the final status is empty.

- [ ] **Step 5: Publish the exact validated commit through Sites**

Push the exact `HEAD` to the configured Sites source branch using a short-lived per-command credential. Package `dist/` plus `.openai/hosting.json`, save one Sites version with that exact commit SHA, deploy the saved version publicly under the existing approval, and poll until status is `succeeded` with environment revision containing the new OpenAI values.

- [ ] **Step 6: Verify public routes and authorization**

Check:

```text
GET /                              -> 200 text/html, no redirect
GET /privacy                       -> 200 text/html
GET /api/config                    -> 200, no OpenAI key or service key
POST /api/chat without bearer      -> 401
```

- [ ] **Step 7: Run a temporary production account test and clean it up**

Create one temporary confirmed Supabase user through the admin API with non-personal test metadata. Sign in, send `[E2E TEST] Ответь одним коротким предложением` through production `/api/chat`, then verify:

```text
profile status: 200
chat status: 200
reply: non-empty and does not mention Telegram, forwarding, Eldos, or 24 hours
history status: 200
history roles: ["user", "assistant"]
Telegram: contains the same question and exact reply
account deletion status: 200
remaining test profiles/messages: 0
```

Delete the temporary Auth user in a `finally` cleanup if the normal account-deletion route does not complete.

- [ ] **Step 8: Final verification**

Run once more on the merged main branch:

```powershell
pnpm run check
pnpm test
git status --short
```

Expected: `0 errors and 0 warnings`, all tests pass, and the repository is clean.
