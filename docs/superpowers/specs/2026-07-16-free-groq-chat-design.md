# Free Groq Chat Design

## Goal

Replace the paid OpenAI API dependency with Groq Free while preserving the approved visitor experience:

- the assistant answers normally inside the portfolio chat;
- the visitor never sees a notice that the turn was sent to Telegram;
- the verified visitor's question and the exact assistant reply are saved in account history;
- Eldos receives the verified contact, question, and exact assistant reply in Telegram.

The portfolio UI, authentication flow, Supabase schema, and Telegram bot remain unchanged.

## Provider choice

Use Groq's OpenAI-compatible Responses API at `POST https://api.groq.com/openai/v1/responses`.

Runtime configuration:

- `GROQ_API_KEY` — server-only secret;
- `GROQ_MODEL` — non-secret model id;
- default model — `llama-3.3-70b-versatile`.

Groq's free-plan limits are sufficient for a personal portfolio, but they are still rate limits rather than an unlimited guarantee. The model id stays configurable so it can be replaced without changing application code if Groq changes free-model availability.

## Architecture and data flow

The browser continues to call only the authenticated `/api/chat` route.

1. The worker verifies the Supabase access token and uses the verified user id.
2. It validates the incoming message and loads only that user's latest 12 stored messages.
3. It sends the existing assistant instructions, chronological history, and new question to Groq.
4. It extracts and constrains the reply to the current 1–1,200 character database limit.
5. It stores the user question and the exact Groq reply in Supabase.
6. It sends the verified name, email, phone, question, and the exact same reply to Telegram.
7. It returns that exact reply to the browser.

No password, Supabase token, service key, Telegram token, or Groq key is sent to Groq, Supabase messages, Telegram, browser assets, or logs.

## Error handling

- Missing `GROQ_API_KEY`: return a generic service-unavailable response without calling Groq.
- Groq rate limit, network error, invalid response, or empty reply: return a generic temporary error.
- Do not store either side of the turn or send Telegram when no valid AI reply was produced.
- Preserve the existing honeypot behavior so automated spam does not consume the free quota.

## Privacy and configuration

Update the privacy page to name Groq as the processor used to generate assistant replies. It must continue to explain that only the question and recent chat history are sent to the model, not the visitor's name, phone, password, or access tokens.

Replace the OpenAI environment contract in `.env.example` with blank `GROQ_API_KEY=` and `GROQ_MODEL=llama-3.3-70b-versatile`. After a successful Groq production test, remove the unused OpenAI runtime variables from Sites and the ignored local `.env` file.

## Testing and release

Use test-driven changes to prove:

- the Groq endpoint, authorization header, model, and chronological per-user context are correct;
- the reply returned to the browser is byte-for-byte identical to the reply saved in Supabase and sent to Telegram;
- no visible reply mentions Telegram, forwarding, Eldos, or a later human response;
- missing configuration and malformed Groq output fail safely without persistence or Telegram delivery;
- privacy text and `.env.example` describe Groq and contain no secret value.

Before publishing, run the full type check, test suite, production build, and a secret scan. Then deploy the exact validated commit and perform one temporary production-account test covering sign-in, a live Groq answer, stored history, Telegram delivery, and cleanup.

## Out of scope

- Voice, images, web search, tool calling, and streaming responses.
- Changes to the visual design or account screens.
- Paid Groq plans or automatic fallback to another provider.
