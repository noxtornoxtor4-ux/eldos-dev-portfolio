<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Эльдос — Full-stack разработчик</title>
	<meta
		name="description"
		content="Портфолио Эльдоса — full-stack разработчика, который создает быстрые цифровые продукты, интерфейсы и надежные backend-системы."
	/>
	<meta name="theme-color" content="#07090d" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="eldos.dev" />
	<meta property="og:title" content="Эльдос — Full-stack разработчик" />
	<meta
		property="og:description"
		content="Проектирую и запускаю цифровые продукты — от сильного интерфейса до надежной архитектуры."
	/>
	<meta property="og:url" content="https://eldos.dev" />
	<meta property="og:image" content="https://eldos.dev/og.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="ELDOS.DEV — Full-stack developer" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Эльдос — Full-stack разработчик" />
	<meta
		name="twitter:description"
		content="Проектирую и запускаю цифровые продукты — от сильного интерфейса до надежной архитектуры."
	/>
	<meta name="twitter:image" content="https://eldos.dev/og.png" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

{@render children()}
