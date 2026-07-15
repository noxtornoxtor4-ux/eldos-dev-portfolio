<script lang="ts">
	import { onMount } from 'svelte';
	import type { Profile } from '$lib/shared/model/auth';
	import { deleteAccount, updateProfile } from '$lib/shared/api/account/client';

	type Props = {
		profile: Profile;
		token: string;
		onclose: () => void;
		onsaved: (profile: Profile) => void;
		onsignout: () => void;
		ondeleted: () => void;
	};

	let { profile, token, onclose, onsaved, onsignout, ondeleted }: Props = $props();
	let name = $state('');
	let phone = $state('');
	let isSaving = $state(false);
	let isDeleting = $state(false);
	let deleteConfirmation = $state('');
	let error = $state('');
	let saved = $state(false);

	onMount(() => {
		name = profile.name;
		phone = profile.phone;
	});

	async function save() {
		error = '';
		saved = false;
		const cleanName = name.trim();
		const cleanPhone = phone.trim();
		const digits = cleanPhone.replace(/\D/g, '');
		if (cleanName.length < 2) {
			error = 'Введите имя — минимум 2 символа.';
			return;
		}
		if (digits.length < 7 || digits.length > 15) {
			error = 'Введите корректный номер телефона.';
			return;
		}

		isSaving = true;
		try {
			const updated = await updateProfile(token, { name: cleanName, phone: cleanPhone });
			name = updated.name;
			phone = updated.phone;
			onsaved(updated);
			saved = true;
		} catch {
			error = 'Не удалось сохранить профиль.';
		} finally {
			isSaving = false;
		}
	}

	async function removeAccount() {
		if (deleteConfirmation !== 'УДАЛИТЬ') {
			error = 'Введите слово УДАЛИТЬ для подтверждения.';
			return;
		}
		isDeleting = true;
		error = '';
		try {
			await deleteAccount(token);
			ondeleted();
		} catch {
			error = 'Не удалось удалить аккаунт. Попробуйте позже.';
		} finally {
			isDeleting = false;
		}
	}
</script>

<section class="profile-panel" aria-label="Настройки аккаунта">
	<header>
		<div>
			<span>ACCOUNT / PROFILE</span>
			<h3>Ваш аккаунт</h3>
		</div>
		<button type="button" aria-label="Закрыть настройки" onclick={onclose}>×</button>
	</header>
	<div class="profile-panel__email">
		<span>EMAIL / VERIFIED</span><strong>{profile.email}</strong>
	</div>
	<form
		onsubmit={(event) => {
			event.preventDefault();
			save();
		}}
	>
		<label
			><span>Имя</span><input
				bind:value={name}
				autocomplete="name"
				maxlength="80"
				required
			/></label
		>
		<label
			><span>Телефон</span><input
				bind:value={phone}
				type="tel"
				autocomplete="tel"
				inputmode="tel"
				maxlength="32"
				required
			/></label
		>
		<button class="profile-panel__save" type="submit" disabled={isSaving}
			>{isSaving ? 'СОХРАНЯЕМ...' : 'СОХРАНИТЬ ИЗМЕНЕНИЯ'}</button
		>
		{#if saved}<p class="profile-panel__success">Профиль обновлён.</p>{/if}
	</form>
	<button class="profile-panel__signout" type="button" onclick={onsignout}
		>Выйти на всех устройствах</button
	>
	<details class="profile-panel__danger">
		<summary>Удалить аккаунт</summary>
		<p>Профиль и вся история переписки будут удалены без возможности восстановления.</p>
		<label
			><span>Введите УДАЛИТЬ</span><input
				bind:value={deleteConfirmation}
				autocomplete="off"
			/></label
		>
		<button type="button" onclick={removeAccount} disabled={isDeleting}
			>{isDeleting ? 'УДАЛЯЕМ...' : 'УДАЛИТЬ АККАУНТ'}</button
		>
	</details>
	{#if error}<p class="profile-panel__error" role="alert">{error}</p>{/if}
</section>
