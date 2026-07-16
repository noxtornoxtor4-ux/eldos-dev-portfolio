<script lang="ts">
	import HomePage from '$lib/pages/home/ui/HomePage.svelte';

	const structuredData = JSON.stringify({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebSite',
				'@id': 'https://eldos-dev-portfolio.vercel.app/#website',
				url: 'https://eldos-dev-portfolio.vercel.app/',
				name: 'Eldos Dev',
				alternateName: 'Портфолио Эльдоса',
				inLanguage: 'ru'
			},
			{
				'@type': 'Person',
				'@id': 'https://eldos-dev-portfolio.vercel.app/#eldos',
				name: 'Эльдос',
				alternateName: 'Eldos Dev',
				url: 'https://eldos-dev-portfolio.vercel.app/',
				jobTitle: 'Full-stack разработчик',
				knowsAbout: ['SvelteKit', 'TypeScript', 'Node.js', 'PostgreSQL', 'AI Systems'],
				address: {
					'@type': 'PostalAddress',
					addressLocality: 'Алматы',
					addressCountry: 'KZ'
				}
			}
		]
	});
</script>

<svelte:head>
	<link rel="canonical" href="https://eldos-dev-portfolio.vercel.app/" />
	<meta name="robots" content="index, follow, max-image-preview:large" />
	{@html `<script type="application/ld+json">${structuredData}</script>`}
</svelte:head>

<HomePage />
