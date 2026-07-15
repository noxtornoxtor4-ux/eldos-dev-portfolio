<script lang="ts">
	let { email }: { email: string } = $props();
	let copied = $state(false);

	async function copyEmail() {
		try {
			await navigator.clipboard.writeText(email);
			copied = true;
			window.setTimeout(() => (copied = false), 1800);
		} catch {
			window.location.href = `mailto:${email}`;
		}
	}
</script>

<button class="copy-button" class:is-copied={copied} type="button" onclick={copyEmail}>
	<span>{copied ? 'Скопировано' : email}</span>
	<span class="copy-button__icon" aria-hidden="true">{copied ? '✓' : '↗'}</span>
</button>
