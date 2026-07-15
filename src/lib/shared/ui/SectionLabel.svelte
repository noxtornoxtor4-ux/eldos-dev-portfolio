<script lang="ts">
	let { index, text }: { index: string; text: string } = $props();
</script>

<div class="section-label" aria-hidden="true">
	<span>{index}</span>
	<span class="section-label__line"></span>
	<span>{text}</span>
</div>
