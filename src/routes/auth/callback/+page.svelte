<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getSupabase } from '$lib/shared/api/supabase/client';

	let status = $state<'loading' | 'error'>('loading');

	onMount(async () => {
		try {
			const supabase = await getSupabase();
			const code = new URL(location.href).searchParams.get('code');
			const { data } = await supabase.auth.getSession();
			if (!data.session && code) {
				const { error } = await supabase.auth.exchangeCodeForSession(code);
				if (error) throw error;
			}
			const sessionResult = await supabase.auth.getSession();
			if (!sessionResult.data.session) throw new Error('No session');
			await goto('/?assistant=open');
		} catch {
			status = 'error';
		}
	});
</script>

<main class="auth-callback">
	<div class="auth-callback__card">
		<span>E/D SECURE ACCOUNT</span>
		{#if status === 'loading'}
			<h1>Подтверждаем email...</h1><p>Защищённая сессия создаётся автоматически.</p>
		{:else}
			<h1>Ссылка недействительна</h1><p>Вернитесь к ассистенту и запросите новое письмо.</p><a href="/?assistant=open">Вернуться на сайт</a>
		{/if}
	</div>
</main>
