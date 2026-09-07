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

	// Svelte has no way to write a literal <script> element in markup, so the JSON-LD tag is
	// assembled here and injected with {@html}. The closing tag is split so it cannot terminate
	// this script block early. `structuredData` comes from the static object above — never user input.
	const jsonLdTag = `<script type="application/ld+json">${structuredData}</` + `script>`;
</script>

<svelte:head>
	<link rel="canonical" href="https://eldos-dev-portfolio.vercel.app/" />
	<meta name="robots" content="index, follow, max-image-preview:large" />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON-LD, see jsonLdTag above -->
	{@html jsonLdTag}
</svelte:head>

<HomePage />
