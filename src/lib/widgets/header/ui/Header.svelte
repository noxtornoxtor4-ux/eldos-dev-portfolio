<script lang="ts">
	import { navigation } from '$lib/shared/config/site';

	let menuOpen = $state(false);
</script>

<header class="site-header">
	<a class="brand" href="#top" aria-label="eldos.dev — на главную">
		<span class="brand__mark">E/D</span><span class="brand__cursor">_</span>
	</a>

	<nav class:site-nav--open={menuOpen} class="site-nav" aria-label="Основная навигация">
		{#each navigation as item, index (item.id)}
			<a href="#{item.id}" onclick={() => (menuOpen = false)}>
				<span>0{index + 1}</span>{item.label}
			</a>
		{/each}
	</nav>

	<div class="header-status" aria-label="Доступен для новых проектов">
		<span></span>AVAILABLE / 2026
	</div>

	<button
		class="menu-toggle"
		class:menu-toggle--open={menuOpen}
		type="button"
		aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
		aria-expanded={menuOpen}
		onclick={() => (menuOpen = !menuOpen)}
	>
		<i></i><i></i>
	</button>
</header>
