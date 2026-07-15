<script lang="ts">
	import About from '$lib/widgets/about/ui/About.svelte';
	import AiAssistant from '$lib/features/ai-assistant/ui/AiAssistant.svelte';
	import Contact from '$lib/widgets/contact/ui/Contact.svelte';
	import Expertise from '$lib/widgets/expertise/ui/Expertise.svelte';
	import Footer from '$lib/widgets/footer/ui/Footer.svelte';
	import Header from '$lib/widgets/header/ui/Header.svelte';
	import Hero from '$lib/widgets/hero/ui/Hero.svelte';
	import Projects from '$lib/widgets/projects/ui/Projects.svelte';

	let shell: HTMLElement;

	function trackPointer(event: PointerEvent) {
		if (!shell) return;
		shell.style.setProperty('--pointer-x', `${event.clientX}px`);
		shell.style.setProperty('--pointer-y', `${event.clientY}px`);
	}
</script>

<svelte:window onpointermove={trackPointer} />

<div class="site-shell" bind:this={shell}>
	<div class="cursor-glow" aria-hidden="true"></div>
	<div class="page-grid" aria-hidden="true"></div>
	<Header />
	<main>
		<Hero />
		<Projects />
		<Expertise />
		<About />
		<Contact />
	</main>
	<Footer />
	<AiAssistant />
</div>
