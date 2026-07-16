<script lang="ts">
	import type { Session } from '@supabase/supabase-js';
	import { getSupabase } from '$lib/shared/api/supabase/client';
	import type { RegistrationInput } from '$lib/shared/model/auth';
	import {
		getAuthErrorMessage,
		validateEmail,
		validateRegistration
	} from '$lib/features/auth/model/validation';

	type Props = {
		onauthenticated?: (session: Session) => void;
	};

	let { onauthenticated }: Props = $props();
	let mode = $state<'signin' | 'signup' | 'recover'>('signin');
	let isSubmitting = $state(false);
	let recoverySent = $state(false);
	let error = $state('');
	let fieldErrors = $state<Record<string, string>>({});
	let email = $state('');
	let password = $state('');
	let input = $state<RegistrationInput>({
		name: '',
		email: '',
		phone: '',
		password: '',
		passwordConfirmation: ''
	});

	function setMode(next: typeof mode) {
		mode = next;
		error = '';
		fieldErrors = {};
		recoverySent = false;
	}

	async function signIn() {
		error = '';
		fieldErrors = {};
		const emailError = validateEmail(email);
		if (emailError) {
			fieldErrors = { email: emailError };
			return;
		}
		if (!password) {
			fieldErrors = { password: 'Введите пароль.' };
			return;
		}

		isSubmitting = true;
		try {
			const supabase = await getSupabase();
			const { data, error: authError } = await supabase.auth.signInWithPassword({
				email: email.trim().toLowerCase(),
				password
			});
			if (authError) throw authError;
			if (!data.session) throw new Error('Session was not created');
			onauthenticated?.(data.session);
		} catch (reason) {
			error = getAuthErrorMessage(reason instanceof Error ? reason.message : 'unknown');
		} finally {
			isSubmitting = false;
		}
	}

	async function signUp() {
		error = '';
		fieldErrors = validateRegistration(input);
		if (Object.keys(fieldErrors).length) return;

		isSubmitting = true;
		try {
			const supabase = await getSupabase();
			const { data, error: authError } = await supabase.auth.signUp({
				email: input.email.trim().toLowerCase(),
				password: input.password,
				options: {
					data: { name: input.name.trim(), phone: input.phone.trim() }
				}
			});
			if (authError) throw authError;
			if (!data.session) throw new Error('Session was not created');
			onauthenticated?.(data.session);
		} catch (reason) {
			error = getAuthErrorMessage(reason instanceof Error ? reason.message : 'unknown');
		} finally {
			isSubmitting = false;
		}
	}

	async function recoverPassword() {
		error = '';
		const emailError = validateEmail(email);
		if (emailError) {
			fieldErrors = { email: emailError };
			return;
		}

		isSubmitting = true;
		try {
			const supabase = await getSupabase();
			const { error: authError } = await supabase.auth.resetPasswordForEmail(
				email.trim().toLowerCase(),
				{ redirectTo: `${location.origin}/auth/update-password` }
			);
			if (authError) throw authError;
			recoverySent = true;
		} catch (reason) {
			error = getAuthErrorMessage(reason instanceof Error ? reason.message : 'unknown');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<section class="auth-panel" aria-label="Вход в аккаунт E/D Assistant">
	<div class="auth-panel__signal" aria-hidden="true">
		<div><i></i><i></i><i></i></div>
		<strong>ED</strong>
		<span>SECURE IDENTITY</span>
	</div>

	{#if recoverySent}
		<div class="auth-state" aria-live="polite">
			<span>RECOVERY_LINK / SENT</span>
			<h3>Письмо отправлено</h3>
			<p>Откройте ссылку из письма, чтобы установить новый пароль.</p>
			<button type="button" onclick={() => setMode('signin')}>Вернуться ко входу</button>
		</div>
	{:else}
		<div class="auth-tabs" role="tablist" aria-label="Авторизация">
			<button
				type="button"
				role="tab"
				aria-selected={mode === 'signin'}
				class:auth-tab--active={mode === 'signin'}
				onclick={() => setMode('signin')}>Войти</button
			>
			<button
				type="button"
				role="tab"
				aria-selected={mode === 'signup'}
				class:auth-tab--active={mode === 'signup'}
				onclick={() => setMode('signup')}>Регистрация</button
			>
		</div>

		{#if mode === 'signin'}
			<form
				class="auth-form"
				onsubmit={(event) => {
					event.preventDefault();
					signIn();
				}}
			>
				<div class="auth-form__intro">
					<span>ACCOUNT ACCESS / 01</span>
					<h3>Войти в аккаунт</h3>
				</div>
				<label
					><span>Email</span><input
						bind:value={email}
						type="email"
						autocomplete="email"
						placeholder="you@example.com"
						required
					/>{#if fieldErrors.email}<small>{fieldErrors.email}</small>{/if}</label
				>
				<label
					><span>Пароль</span><input
						bind:value={password}
						type="password"
						autocomplete="current-password"
						placeholder="Минимум 8 символов"
						required
					/>{#if fieldErrors.password}<small>{fieldErrors.password}</small>{/if}</label
				>
				<button class="auth-form__submit" type="submit" disabled={isSubmitting}
					>{isSubmitting ? 'ПРОВЕРЯЕМ...' : 'ВОЙТИ'} <i>↗</i></button
				>
				<button class="auth-form__link" type="button" onclick={() => setMode('recover')}
					>Забыли пароль?</button
				>
			</form>
		{:else if mode === 'signup'}
			<form
				class="auth-form"
				onsubmit={(event) => {
					event.preventDefault();
					signUp();
				}}
			>
				<div class="auth-form__intro">
					<span>NEW ACCOUNT / 02</span>
					<h3>Создать аккаунт</h3>
				</div>
				<label
					><span>Имя</span><input
						bind:value={input.name}
						autocomplete="name"
						maxlength="80"
						placeholder="Как к вам обращаться?"
						required
					/>{#if fieldErrors.name}<small>{fieldErrors.name}</small>{/if}</label
				>
				<label
					><span>Email</span><input
						bind:value={input.email}
						type="email"
						autocomplete="email"
						placeholder="you@example.com"
						required
					/>{#if fieldErrors.email}<small>{fieldErrors.email}</small>{/if}</label
				>
				<label
					><span>Телефон</span><input
						bind:value={input.phone}
						type="tel"
						inputmode="tel"
						autocomplete="tel"
						maxlength="32"
						placeholder="+7 700 000 00 00"
						required
					/>{#if fieldErrors.phone}<small>{fieldErrors.phone}</small>{/if}</label
				>
				<label
					><span>Пароль</span><input
						bind:value={input.password}
						type="password"
						autocomplete="new-password"
						minlength="8"
						placeholder="Минимум 8 символов"
						required
					/>{#if fieldErrors.password}<small>{fieldErrors.password}</small>{/if}</label
				>
				<label
					><span>Повторите пароль</span><input
						bind:value={input.passwordConfirmation}
						type="password"
						autocomplete="new-password"
						minlength="8"
						placeholder="Повторите пароль"
						required
					/>{#if fieldErrors.passwordConfirmation}<small>{fieldErrors.passwordConfirmation}</small
						>{/if}</label
				>
				<button class="auth-form__submit" type="submit" disabled={isSubmitting}
					>{isSubmitting ? 'СОЗДАЁМ...' : 'СОЗДАТЬ АККАУНТ'} <i>↗</i></button
				>
				<p class="auth-form__privacy">
					Создавая аккаунт, вы принимаете <a href="/privacy" target="_blank"
						>политику конфиденциальности</a
					>.
				</p>
			</form>
		{:else}
			<form
				class="auth-form"
				onsubmit={(event) => {
					event.preventDefault();
					recoverPassword();
				}}
			>
				<div class="auth-form__intro">
					<span>RECOVERY / 03</span>
					<h3>Восстановить пароль</h3>
					<p>Отправим защищённую ссылку на вашу почту.</p>
				</div>
				<label
					><span>Email</span><input
						bind:value={email}
						type="email"
						autocomplete="email"
						placeholder="you@example.com"
						required
					/>{#if fieldErrors.email}<small>{fieldErrors.email}</small>{/if}</label
				>
				<button class="auth-form__submit" type="submit" disabled={isSubmitting}
					>{isSubmitting ? 'ОТПРАВЛЯЕМ...' : 'ПОЛУЧИТЬ ССЫЛКУ'} <i>↗</i></button
				>
				<button class="auth-form__link" type="button" onclick={() => setMode('signin')}
					>Вернуться ко входу</button
				>
			</form>
		{/if}

		{#if error}<p class="auth-form__error" role="alert">{error}</p>{/if}
	{/if}
</section>
