<script lang="ts">
	import { onMount } from 'svelte';

	type ChatMessage = {
		id: number;
		role: 'assistant' | 'user';
		text: string;
	};

	type VisitorIdentity = {
		name: string;
		phone: string;
	};

	const storageKey = 'eldos-assistant-identity';
	const quickPrompts = ['Хочу обсудить проект', 'Какие сроки?', 'Сколько стоит разработка?'];

	let isOpen = $state(false);
	let isIdentified = $state(false);
	let isSending = $state(false);
	let input = $state('');
	let name = $state('');
	let phone = $state('');
	let consent = $state(false);
	let website = $state('');
	let error = $state('');
	let identityError = $state('');
	let messageId = 1;
	let messages = $state<ChatMessage[]>([]);

	onMount(() => {
		const savedIdentity = sessionStorage.getItem(storageKey);
		if (!savedIdentity) return;

		try {
			const identity = JSON.parse(savedIdentity) as VisitorIdentity;
			if (identity.name && identity.phone) {
				name = identity.name;
				phone = identity.phone;
				consent = true;
				startConversation();
			}
		} catch {
			sessionStorage.removeItem(storageKey);
		}
	});

	function startConversation() {
		isIdentified = true;
		messages = [
			{
				id: 0,
				role: 'assistant',
				text: `Привет, ${name}! Я E/D Assistant. Расскажите о задаче — я отвечу и передам весь диалог Эльдосу в Telegram.`
			}
		];
	}

	function submitIdentity() {
		identityError = '';
		const cleanName = name.trim();
		const phoneDigits = phone.replace(/\D/g, '');

		if (cleanName.length < 2) {
			identityError = 'Введите имя — минимум 2 символа.';
			return;
		}
		if (phoneDigits.length < 7 || phoneDigits.length > 15) {
			identityError = 'Введите корректный номер телефона.';
			return;
		}
		if (!consent) {
			identityError = 'Нужно подтвердить передачу контактных данных.';
			return;
		}

		name = cleanName;
		phone = phone.trim();
		sessionStorage.setItem(storageKey, JSON.stringify({ name, phone } satisfies VisitorIdentity));
		startConversation();
	}

	function resetIdentity() {
		sessionStorage.removeItem(storageKey);
		isIdentified = false;
		name = '';
		phone = '';
		consent = false;
		input = '';
		messages = [];
		error = '';
	}

	function choosePrompt(prompt: string) {
		input = prompt;
	}

	async function sendMessage() {
		const text = input.trim();
		if (!text || isSending || !isIdentified) return;

		error = '';
		isSending = true;
		messages.push({ id: messageId++, role: 'user', text });
		input = '';

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ message: text, name, phone, website })
			});
			const data = (await response.json()) as { ok?: boolean; reply?: string; error?: string };

			if (!response.ok || !data.ok) throw new Error(data.error || 'Не удалось отправить сообщение');

			messages.push({
				id: messageId++,
				role: 'assistant',
				text: data.reply || 'Сообщение и ответ переданы Эльдосу.'
			});
		} catch {
			error = 'Связь временно недоступна. Напишите на hello@eldos.dev';
		} finally {
			isSending = false;
		}
	}
</script>

<div class="ai-assistant" class:ai-assistant--open={isOpen}>
	{#if isOpen}
		<div class="ai-panel" role="dialog" aria-label="AI-консультант Эльдоса">
			<header class="ai-panel__header">
				<div class="ai-avatar" aria-hidden="true">E/D</div>
				<div>
					<strong>E/D ASSISTANT</strong>
					<span><i></i> {isIdentified ? 'IDENTIFIED / ONLINE' : 'IDENTITY REQUIRED'}</span>
				</div>
				<button type="button" aria-label="Закрыть консультанта" onclick={() => (isOpen = false)}
					>×</button
				>
			</header>

			{#if !isIdentified}
				<form
					class="ai-login"
					onsubmit={(event) => {
						event.preventDefault();
						submitIdentity();
					}}
				>
					<div class="ai-login__visual" aria-hidden="true">
						<div class="ai-login__rings"><i></i><i></i><i></i></div>
						<strong>ID</strong>
						<span>SECURE SESSION</span>
					</div>

					<div class="ai-login__intro">
						<span>ACCOUNT_LINK / 01</span>
						<h3>Представьтесь,<br />чтобы начать диалог.</h3>
						<p>Контакты нужны Эльдосу, чтобы лично ответить на ваше обращение.</p>
					</div>

					<label class="ai-login__field">
						<span>01 / ИМЯ</span>
						<input
							bind:value={name}
							required
							minlength="2"
							maxlength="80"
							autocomplete="name"
							placeholder="Как к вам обращаться?"
						/>
					</label>

					<label class="ai-login__field">
						<span>02 / НОМЕР ТЕЛЕФОНА</span>
						<input
							bind:value={phone}
							required
							type="tel"
							maxlength="32"
							autocomplete="tel"
							inputmode="tel"
							placeholder="+7 700 000 00 00"
						/>
					</label>

					<label class="ai-login__consent">
						<input type="checkbox" bind:checked={consent} required />
						<span>
							<i aria-hidden="true">✓</i>
							Я согласен на передачу имени, телефона и переписки Эльдосу в Telegram для ответа на обращение.
						</span>
					</label>

					{#if identityError}<p class="ai-login__error">{identityError}</p>{/if}

					<button class="ai-login__submit" type="submit">
						<span>ВОЙТИ В ДИАЛОГ</span><i aria-hidden="true">↗</i>
					</button>
					<small class="ai-login__note">Данные хранятся только до закрытия вкладки</small>
				</form>
			{:else}
				<div class="ai-identity">
					<div><span>CONNECTED AS</span><strong>{name}</strong></div>
					<div><span>PHONE</span><strong>{phone}</strong></div>
					<button type="button" onclick={resetIdentity}>Сменить</button>
				</div>

				<div class="ai-panel__messages" aria-live="polite">
					<div class="ai-system-line"><span>SECURE_CHANNEL</span><i></i><span>ACTIVE</span></div>
					{#each messages as message (message.id)}
						<div class:ai-message--user={message.role === 'user'} class="ai-message">
							<span>{message.role === 'assistant' ? 'AI' : 'YOU'}</span>
							<p>{message.text}</p>
						</div>
					{/each}
					{#if isSending}
						<div class="ai-typing" aria-label="Ассистент печатает"><i></i><i></i><i></i></div>
					{/if}
				</div>

				<div class="ai-quick-prompts" aria-label="Быстрые вопросы">
					{#each quickPrompts as prompt}
						<button type="button" onclick={() => choosePrompt(prompt)}>{prompt}</button>
					{/each}
				</div>

				<form
					class="ai-form"
					onsubmit={(event) => {
						event.preventDefault();
						sendMessage();
					}}
				>
					<label class="ai-form__honeypot" aria-hidden="true">
						<span>Website</span><input bind:value={website} tabindex="-1" autocomplete="off" />
					</label>
					<div class="ai-form__composer">
						<textarea
							bind:value={input}
							maxlength="1200"
							rows="2"
							placeholder="Напишите сообщение..."
							aria-label="Сообщение"
							onkeydown={(event) => {
								if (event.key === 'Enter' && !event.shiftKey) {
									event.preventDefault();
									sendMessage();
								}
							}}></textarea>
						<button
							type="submit"
							disabled={!input.trim() || isSending}
							aria-label="Отправить сообщение">↗</button
						>
					</div>
					{#if error}<p class="ai-form__error">{error}</p>{/if}
					<small class="ai-form__privacy"
						>Вам и Эльдосу сохраняется полная пара: вопрос + ответ</small
					>
				</form>
			{/if}
		</div>
	{/if}

	<button
		type="button"
		class="ai-launcher"
		aria-label={isOpen ? 'Закрыть AI-консультанта' : 'Открыть AI-консультанта'}
		aria-expanded={isOpen}
		onclick={() => (isOpen = !isOpen)}
	>
		<span class="ai-launcher__pulse"></span>
		<span class="ai-launcher__icon">{isOpen ? '×' : 'AI'}</span>
		<span class="ai-launcher__label">ASK E/D</span>
	</button>
</div>
