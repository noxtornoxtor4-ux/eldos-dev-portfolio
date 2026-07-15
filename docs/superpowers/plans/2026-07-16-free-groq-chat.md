# Free Groq Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the paid OpenAI API dependency with Groq Free while preserving authenticated history and silent delivery of the verified question and exact AI reply to Telegram.

**Architecture:** Keep the authenticated `/api/chat` worker route and its current Supabase/Telegram flow. Change only the server-side Responses API provider and environment contract from OpenAI to Groq, then update the privacy disclosure and deploy the exact validated build.

**Tech Stack:** SvelteKit 2, Svelte 5, TypeScript, Cloudflare Workers, Supabase Auth/Postgres, Groq Responses API, Vitest, Telegram Bot API, Sites hosting.

## Global Constraints

- The assistant answers normally in the portfolio chat and never tells the visitor that a turn was sent to Telegram or Eldos.
- Telegram receives the verified contact, question, and exact assistant reply silently.
- The verified user's question and exact reply remain in private account history.
- Only the verified user's latest 12 stored messages may be model context.
- `GROQ_API_KEY` is server-only and never enters `/api/config`, browser assets, Supabase messages, Telegram, or logs.
- Use `POST https://api.groq.com/openai/v1/responses` with default model `llama-3.3-70b-versatile`.
- Visitor messages and assistant replies remain within the database's 1–1,200 character constraint.
- No streaming, voice, image, web-search, tool-calling, or paid fallback is added.

---

## File Map

- Modify `tests/sites-worker.test.ts`: make the existing provider contract prove Groq endpoint, key, model, context scoping, exact persistence, and safe failures.
- Modify `scripts/sites-worker.js`: replace the OpenAI environment names and endpoint with Groq while retaining the provider-independent response parsing and chat flow.
- Modify `tests/privacy-policy.test.ts`: require the Groq disclosure and blank Groq secret contract and reject stale OpenAI configuration.
- Modify `src/routes/privacy/+page.svelte`: name Groq as the AI processor.
- Modify `.env.example`: replace OpenAI variables with Groq variables.
- Rebuild `dist/**`: stage the exact production worker and Svelte assets for Sites.

---

### Task 1: Migrate the server-side Responses API contract to Groq

**Files:**

- Modify: `tests/sites-worker.test.ts`
- Modify: `scripts/sites-worker.js`

**Interfaces:**

- Consumes: `loadRecentMessages(env, userId)`, `assistantInstructions`, and the existing `handleChat(request, env)` flow.
- Produces: `generateAssistantReply(env, message, history): Promise<string>` backed by Groq and the unchanged exact-reply persistence/Telegram contract.

- [ ] **Step 1: Change the test environment to the Groq contract**

Replace the OpenAI entries in `env`:

```ts
const env = {
	SUPABASE_URL: 'https://project.supabase.co',
	SUPABASE_ANON_KEY: 'public-anon-key',
	SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_server-key',
	GROQ_API_KEY: 'groq-server-secret',
	GROQ_MODEL: 'llama-3.3-70b-versatile',
	TELEGRAM_BOT_TOKEN: 'telegram-secret-token',
	TELEGRAM_CHAT_ID: '5892009410',
	ASSETS: { fetch: vi.fn() }
};
```

In the successful chat test, replace the provider mock and assertions with:

```ts
if (url === 'https://api.groq.com/openai/v1/responses') {
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

const groqCall = fetchMock.mock.calls.find(
	([url]) => String(url) === 'https://api.groq.com/openai/v1/responses'
);
expect(groqCall).toBeDefined();
const groqHeaders = new Headers(groqCall?.[1]?.headers);
const groqBody = JSON.parse(String(groqCall?.[1]?.body));
expect(groqHeaders.get('authorization')).toBe(`Bearer ${env.GROQ_API_KEY}`);
expect(groqBody.model).toBe('llama-3.3-70b-versatile');
expect(groqBody.input).toEqual([
	{ role: 'user', content: 'Предыдущий вопрос' },
	{ role: 'assistant', content: 'Предыдущий ответ' },
	{ role: 'user', content: 'Хочу обсудить проект' }
]);
```

Replace the provider failure tests with:

```ts
it('rejects authenticated chat when Groq is not configured', async () => {
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
		{ ...env, GROQ_API_KEY: undefined }
	);

	expect(response.status).toBe(503);
	expect(fetchMock.mock.calls.some(([url]) => String(url).includes('api.groq.com'))).toBe(false);
});

it('returns a generic error for an empty Groq response', async () => {
	const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
		const url = String(input);
		if (url.endsWith('/auth/v1/user')) return Response.json(user);
		if (url.includes('/rest/v1/profiles')) {
			return Response.json([{ id: user.id, name: 'Visitor', phone: '+7 700 000 00 00' }]);
		}
		if (url.includes('/rest/v1/chat_messages?')) return Response.json([]);
		if (url === 'https://api.groq.com/openai/v1/responses') {
			return Response.json({ output: [] });
		}
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
	expect(fetchMock.mock.calls.some(([url]) => String(url).includes('api.telegram.org'))).toBe(false);
	expect(JSON.stringify(await response.json())).not.toContain(env.GROQ_API_KEY);
});
```

- [ ] **Step 2: Run the worker test and verify RED**

Run:

```powershell
pnpm exec vitest run tests/sites-worker.test.ts
```

Expected: the successful and provider-failure tests fail because the worker still calls `api.openai.com` and reads `OPENAI_API_KEY`.

- [ ] **Step 3: Replace the worker environment and provider call**

Change the environment fields and provider-neutral response types at the top of `scripts/sites-worker.js`:

```js
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
```

Update the cast in `extractResponseText`:

```js
const data = /** @type {ResponsePayload} */ (
	payload && typeof payload === 'object' ? payload : {}
);
```

Replace `generateAssistantReply` with:

```js
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
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```powershell
pnpm exec vitest run tests/sites-worker.test.ts
```

Expected: all worker tests pass and prove the browser, Supabase insert, and Telegram body receive the exact same Groq reply.

- [ ] **Step 5: Commit the Groq provider migration**

```powershell
git add scripts/sites-worker.js tests/sites-worker.test.ts
git commit -m "feat: answer assistant chats with Groq"
```

---

### Task 2: Replace the privacy and environment contract

**Files:**

- Modify: `tests/privacy-policy.test.ts`
- Modify: `src/routes/privacy/+page.svelte`
- Modify: `.env.example`

**Interfaces:**

- Consumes: the Groq behavior from Task 1.
- Produces: public disclosure of Groq processing and exact runtime names `GROQ_API_KEY` and `GROQ_MODEL`.

- [ ] **Step 1: Write the failing privacy/configuration test**

Replace `tests/privacy-policy.test.ts` with:

```ts
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
```

- [ ] **Step 2: Run the privacy test and verify RED**

Run:

```powershell
pnpm exec vitest run tests/privacy-policy.test.ts
```

Expected: FAIL because the page and example still name OpenAI.

- [ ] **Step 3: Update the privacy disclosure and example environment**

In `src/routes/privacy/+page.svelte`, replace section 03 with:

```svelte
<section>
	<span>03</span>
	<div>
		<h2>Ответы нейросети</h2>
		<p>
			Ваш вопрос и последние сообщения из истории передаются Groq только для создания
			ответа E/D Assistant. Имя, телефон, пароль и токены доступа в запрос модели не
			включаются.
		</p>
	</div>
</section>
```

Replace the final two lines of `.env.example` with:

```dotenv
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
```

- [ ] **Step 4: Run the privacy test, type check, and full suite**

Run:

```powershell
pnpm exec vitest run tests/privacy-policy.test.ts
pnpm run check
pnpm test
```

Expected: privacy test passes, Svelte reports `0 errors and 0 warnings`, and the complete suite has zero failures.

- [ ] **Step 5: Commit the disclosure and runtime contract**

```powershell
git add .env.example src/routes/privacy/+page.svelte tests/privacy-policy.test.ts
git commit -m "docs: disclose Groq chat processing"
```

---

### Task 3: Configure Groq Free, build, publish, and verify production

**Files:**

- Modify through build: `dist/**`
- Modify ignored local runtime file: `.env`
- Modify hosted runtime values through Sites; no secret is committed.

**Interfaces:**

- Consumes: `GROQ_API_KEY`, optional `GROQ_MODEL`, the validated source commit, and `.openai/hosting.json` project id.
- Produces: the public deployment whose authenticated `/api/chat` uses Groq and retains history plus silent Telegram delivery.

- [ ] **Step 1: Create and store the free Groq key**

Open `https://console.groq.com/keys`, sign in, create one key named `eldos.dev`, and copy it once. Store it only in the ignored local `.env` file:

Paste the copied value after the first equals sign without printing it:

```dotenv
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
```

Add the same values to Sites with `GROQ_API_KEY` marked secret and `GROQ_MODEL` marked non-secret. Preserve all Supabase and Telegram values.

- [ ] **Step 2: Prove the free provider works before deployment**

Send one minimal authenticated request to `https://api.groq.com/openai/v1/responses` with:

```json
{
  "model": "llama-3.3-70b-versatile",
  "input": "[CONFIG TEST] Reply with OK only.",
  "max_output_tokens": 16
}
```

Expected: HTTP `200`, a non-empty text output, and no billing setup.

- [ ] **Step 3: Remove the unused OpenAI runtime values**

After Step 2 succeeds, remove `OPENAI_API_KEY` and `OPENAI_MODEL` from the ignored local `.env` file and from Sites. Keep the OpenAI dashboard key itself untouched so no external credential is deleted without a separate explicit action.

- [ ] **Step 4: Run fresh verification and the production build**

Run:

```powershell
pnpm run check
pnpm test
pnpm run build
```

Expected: Svelte reports `0 errors and 0 warnings`; all tests pass; build exits `0`; `dist/server/index.js`, `dist/client/site.html`, and `dist/client/privacy.html` exist.

- [ ] **Step 5: Prove secrets are absent from build output**

Scan `dist/**` in memory for the configured values of `GROQ_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `TELEGRAM_BOT_TOKEN`. Print only secret names and matching file paths, never values.

Expected:

```text
secretLeaks: []
```

- [ ] **Step 6: Commit the exact staged build**

```powershell
git add dist
git commit -m "build: stage Groq assistant release"
git status --short
```

Expected: commit succeeds and the final status is empty.

- [ ] **Step 7: Publish the exact validated commit through Sites**

Push the exact `HEAD` to the configured Sites source branch with a short-lived per-command credential. Package `dist/` plus `.openai/hosting.json`, save one version using the pushed `HEAD` SHA, deploy that saved version publicly under the user's existing approval, and poll until deployment status is `succeeded` with the environment revision containing Groq values and no OpenAI values.

- [ ] **Step 8: Verify public routes and authorization**

Verify:

```text
GET /                          -> 200 text/html, no redirect
GET /privacy                   -> 200 text/html
GET /api/config                -> 200, no Groq/service/Telegram secret
POST /api/chat without bearer  -> 401
```

- [ ] **Step 9: Run a temporary production account test and clean it up**

Create one temporary confirmed Supabase user with non-personal test metadata. Sign in and send `[E2E TEST] Ответь одним коротким предложением` through production `/api/chat`. Verify:

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

- [ ] **Step 10: Final verification on the integrated branch**

Run:

```powershell
pnpm run check
pnpm test
git status --short
```

Expected: `0 errors and 0 warnings`, all tests pass, and the repository is clean.
