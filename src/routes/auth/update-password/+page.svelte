<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getSupabase } from '$lib/shared/api/supabase/client';
	import { validatePassword } from '$lib/features/auth/model/validation';

	let isReady = $state(false);
	let isSubmitting = $state(false);
	let password = $state('');
	let confirmation = $state('');
	let error = $state('');

	onMount(async () => {
		try {
			const supabase = await getSupabase();
			const code = new URL(location.href).searchParams.get('code');
			let { data } = await supabase.auth.getSession();
			if (!data.session && code) {
				const exchanged = await supabase.auth.exchangeCodeForSession(code);
				if (exchanged.error) throw exchanged.error;
				data = exchanged.data;
			}
			if (!data.session) throw new Error('No recovery session');
			isReady = true;
		} catch {
			error = 'Ссылка восстановления недействительна или устарела.';
		}
	});

	async function updatePassword() {
		error = validatePassword(password) || '';
		if (error) return;
		if (password !== confirmation) {
			error = 'Пароли не совпадают.';
			return;
		}
		isSubmitting = true;
		try {
			const supabase = await getSupabase();
			const result = await supabase.auth.updateUser({ password });
			if (result.error) throw result.error;
			await goto('/?assistant=open');
		} catch {
			error = 'Не удалось обновить пароль. Запросите новую ссылку.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<main class="auth-callback">
	<form class="auth-callback__card" onsubmit={(event) => { event.preventDefault(); updatePassword(); }}>
		<span>PASSWORD RECOVERY</span><h1>Новый пароль</h1>
		{#if isReady}
			<label><span>Пароль</span><input bind:value={password} type="password" autocomplete="new-password" minlength="8" required /></label>
			<label><span>Повторите пароль</span><input bind:value={confirmation} type="password" autocomplete="new-password" minlength="8" required /></label>
			<button type="submit" disabled={isSubmitting}>{isSubmitting ? 'СОХРАНЯЕМ...' : 'СОХРАНИТЬ ПАРОЛЬ'}</button>
		{/if}
		{#if error}<p role="alert">{error}</p>{/if}
	</form>
</main>
