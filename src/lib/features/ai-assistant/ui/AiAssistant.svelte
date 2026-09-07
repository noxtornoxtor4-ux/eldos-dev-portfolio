<script lang="ts">
	import { onMount } from 'svelte';
	import type { Session, SupabaseClient } from '@supabase/supabase-js';
	import { resolve } from '$app/paths';
	import AuthPanel from '$lib/features/auth/ui/AuthPanel.svelte';
	import ProfilePanel from '$lib/features/profile/ui/ProfilePanel.svelte';
	import {
		AccountApiError,
		loadHistory,
		loadProfile,
		sendChatMessage
	} from '$lib/shared/api/account/client';
	import { getSupabase } from '$lib/shared/api/supabase/client';
	import type { ChatMessage, Profile } from '$lib/shared/model/auth';

	const quickPrompts = ['Хочу обсудить проект', 'Какие сроки?', 'Сколько стоит разработка?'];
	let isOpen = $state(false);
	let isLoadingSession = $state(true);
	let isLoadingHistory = $state(false);
	let isSending = $state(false);
	let isProfileOpen = $state(false);
	let input = $state('');
	let website = $state('');
	let error = $state('');
	let session = $state<Session | null>(null);
	let profile = $state<Profile | null>(null);
	let messages = $state<ChatMessage[]>([]);
	let supabase: SupabaseClient | null = null;

	onMount(() => {
		let active = true;
		let unsubscribe = () => {};
		if (new URL(location.href).searchParams.get('assistant') === 'open') isOpen = true;

		async function initialize() {
			try {
				supabase = await getSupabase();
				const result = await supabase.auth.getSession();
				if (active && result.data.session) await useSession(result.data.session);
				const listener = supabase.auth.onAuthStateChange((_event, nextSession) => {
					if (!active) return;
					if (!nextSession) resetAccount();
					else if (nextSession.access_token !== session?.access_token) void useSession(nextSession);
				});
				unsubscribe = () => listener.data.subscription.unsubscribe();
			} catch {
				error = 'Сервис аккаунтов временно недоступен.';
			} finally {
				isLoadingSession = false;
			}
		}

		void initialize();
		return () => {
			active = false;
			unsubscribe();
		};
	});

	async function useSession(nextSession: Session) {
		session = nextSession;
		isLoadingHistory = true;
		error = '';
		try {
			const [nextProfile, history] = await Promise.all([
				loadProfile(nextSession.access_token),
				loadHistory(nextSession.access_token)
			]);
			profile = nextProfile;
			messages = history;
		} catch (reason) {
			if (reason instanceof AccountApiError && reason.status === 401) {
				await signOut(false);
			} else {
				error = 'Не удалось загрузить аккаунт и историю.';
			}
		} finally {
			isLoadingHistory = false;
		}
	}

	function resetAccount() {
		session = null;
		profile = null;
		messages = [];
		isProfileOpen = false;
		input = '';
	}

	async function signOut(global = true) {
		if (supabase) await supabase.auth.signOut({ scope: global ? 'global' : 'local' });
		resetAccount();
	}

	async function accountDeleted() {
		if (supabase) await supabase.auth.signOut({ scope: 'local' });
		resetAccount();
	}

	function choosePrompt(prompt: string) {
		input = prompt;
	}

	async function sendMessage() {
		const text = input.trim();
		if (!text || isSending || !session) return;
		error = '';
		isSending = true;
		messages.push({
			id: `local-user-${Date.now()}`,
			role: 'user',
			content: text,
			created_at: new Date().toISOString()
		});
		input = '';

		try {
			let activeSession = session;
			let reply: string;
			try {
				reply = await sendChatMessage(activeSession.access_token, text, website);
			} catch (reason) {
				if (!(reason instanceof AccountApiError) || reason.status !== 401 || !supabase)
					throw reason;
				const refreshed = await supabase.auth.refreshSession();
				if (!refreshed.data.session) throw reason;
				activeSession = refreshed.data.session;
				session = activeSession;
				reply = await sendChatMessage(activeSession.access_token, text, website);
			}
			messages.push({
				id: `local-assistant-${Date.now()}`,
				role: 'assistant',
				content: reply,
				created_at: new Date().toISOString()
			});
		} catch (reason) {
			error =
				reason instanceof AccountApiError && reason.status === 401
					? 'Сессия завершена. Войдите снова.'
					: 'Связь временно недоступна. Напишите на noxtornoxtor4@gmail.com';
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
					<strong>E/D ASSISTANT</strong><span
						><i></i> {session ? 'ACCOUNT / ONLINE' : 'SIGN IN REQUIRED'}</span
					>
				</div>
				<button type="button" aria-label="Закрыть консультанта" onclick={() => (isOpen = false)}
					>×</button
				>
			</header>

			{#if isLoadingSession}
				<div class="ai-account-loading">
					<span>SECURE SESSION</span><strong>Проверяем аккаунт...</strong><i></i>
				</div>
			{:else if !session}
				<AuthPanel onauthenticated={useSession} />
			{:else if isProfileOpen && profile}
				<ProfilePanel
					{profile}
					token={session.access_token}
					onclose={() => (isProfileOpen = false)}
					onsaved={(updated) => (profile = updated)}
					onsignout={() => signOut(true)}
					ondeleted={accountDeleted}
				/>
			{:else}
				<div class="ai-identity">
					<div><span>CONNECTED AS</span><strong>{profile?.name || session.user.email}</strong></div>
					<div><span>VERIFIED EMAIL</span><strong>{session.user.email}</strong></div>
					<button type="button" onclick={() => (isProfileOpen = true)}>Профиль</button>
				</div>

				<div class="ai-panel__messages" aria-live="polite">
					<div class="ai-system-line"><span>PRIVATE_HISTORY</span><i></i><span>ACTIVE</span></div>
					{#if isLoadingHistory}
						<div class="ai-history-state">Загружаем историю...</div>
					{:else if messages.length === 0}
						<div class="ai-message">
							<span>AI</span>
							<p>Привет, {profile?.name || 'друг'}! Чем могу помочь?</p>
						</div>
					{:else}
						{#each messages as message (message.id)}
							<div class:ai-message--user={message.role === 'user'} class="ai-message">
								<span>{message.role === 'assistant' ? 'AI' : 'YOU'}</span>
								<p>{message.content}</p>
							</div>
						{/each}
					{/if}
					{#if isSending}<div class="ai-typing" aria-label="Ассистент печатает">
							<i></i><i></i><i></i>
						</div>{/if}
				</div>

				<div class="ai-quick-prompts" aria-label="Быстрые вопросы">
					{#each quickPrompts as prompt (prompt)}<button
							type="button"
							onclick={() => choosePrompt(prompt)}>{prompt}</button
						>{/each}
				</div>
				<form
					class="ai-form"
					onsubmit={(event) => {
						event.preventDefault();
						sendMessage();
					}}
				>
					<label class="ai-form__honeypot" aria-hidden="true"
						><span>Website</span><input
							bind:value={website}
							tabindex="-1"
							autocomplete="off"
						/></label
					>
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
					{#if error}<p class="ai-form__error" role="alert">{error}</p>{/if}
					<small class="ai-form__privacy"
						>История сохранена в вашем аккаунте. <a href={resolve('/privacy')} target="_blank"
							>Конфиденциальность</a
						></small
					>
				</form>
			{/if}
			{#if error && !session}<p class="auth-form__error" role="alert">{error}</p>{/if}
		</div>
	{/if}

	<button
		type="button"
		class="ai-launcher"
		aria-label={isOpen ? 'Закрыть AI-консультанта' : 'Открыть AI-консультанта'}
		aria-expanded={isOpen}
		onclick={() => (isOpen = !isOpen)}
	>
		<span class="ai-launcher__pulse"></span><span class="ai-launcher__icon"
			>{isOpen ? '×' : 'AI'}</span
		><span class="ai-launcher__label">ASK E/D</span>
	</button>
</div>
