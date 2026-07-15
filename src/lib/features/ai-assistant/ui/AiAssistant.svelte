<script lang="ts">
	type ChatMessage = {
		id: number;
		role: 'assistant' | 'user';
		text: string;
	};

	const quickPrompts = ['Хочу обсудить проект', 'Какие сроки?', 'Сколько стоит разработка?'];

	let isOpen = $state(false);
	let isSending = $state(false);
	let input = $state('');
	let name = $state('');
	let website = $state('');
	let error = $state('');
	let messageId = 1;
	let messages = $state<ChatMessage[]>([
		{
			id: 0,
			role: 'assistant',
			text: 'Привет! Я E/D Assistant. Расскажите о задаче — я передам сообщение Эльдосу прямо в Telegram.'
		}
	]);

	function choosePrompt(prompt: string) {
		input = prompt;
	}

	async function sendMessage() {
		const text = input.trim();
		if (!text || isSending) return;

		error = '';
		isSending = true;
		messages.push({ id: messageId++, role: 'user', text });
		input = '';

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ message: text, name, website })
			});
			const data = (await response.json()) as { ok?: boolean; reply?: string; error?: string };

			if (!response.ok || !data.ok) throw new Error(data.error || 'Не удалось отправить сообщение');

			messages.push({
				id: messageId++,
				role: 'assistant',
				text: data.reply || 'Сообщение передано Эльдосу.'
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
					<span><i></i> ONLINE / TELEGRAM LINK</span>
				</div>
				<button type="button" aria-label="Закрыть консультанта" onclick={() => (isOpen = false)}
					>×</button
				>
			</header>

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
				<label>
					<span>Как к вам обращаться? <small>необязательно</small></span>
					<input
						bind:value={name}
						maxlength="80"
						autocomplete="name"
						placeholder="Имя или @telegram"
					/>
				</label>
				<label class="ai-form__honeypot" aria-hidden="true">
					<span>Website</span><input bind:value={website} tabindex="-1" autocomplete="off" />
				</label>
				<div class="ai-form__composer">
					<textarea
						bind:value={input}
						maxlength="1200"
						rows="2"
						placeholder="Опишите задачу..."
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
					>Сообщение получит лично Эльдос · обычно отвечает за 24ч</small
				>
			</form>
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
