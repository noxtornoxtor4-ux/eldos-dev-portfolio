<script lang="ts">
	let { email }: { email: string } = $props();
</script>

<a class="email-link" href="mailto:{email}">
	<span>{email}</span>
	<span class="email-link__icon" aria-hidden="true">↗</span>
</a>
