<script lang="ts">
	import type { Project } from '$lib/shared/model/types';

	let { project, featured = false }: { project: Project; featured?: boolean } = $props();
</script>

<article
	class:project-card--featured={featured}
	class={`project-card project-card--${project.tone}`}
>
	<div class="project-card__meta">
		<span>[{project.id}]</span>
		<span>{project.category}</span>
		<span>{project.year}</span>
	</div>

	<div class="project-visual" aria-hidden="true">
		{#if project.id === '01'}
			<div class="ledger-window">
				<div class="window-dots"><i></i><i></i><i></i></div>
				<div class="ledger-chart">
					<span style="--height: 30%"></span><span style="--height: 48%"></span><span
						style="--height: 39%"
					></span><span style="--height: 65%"></span><span style="--height: 56%"></span><span
						style="--height: 86%"
					></span>
				</div>
				<div class="ledger-total">₸ 24.8M <small>+18.4%</small></div>
			</div>
		{:else if project.id === '02'}
			<div class="cloud-orbit cloud-orbit--outer"><i></i><i></i><i></i></div>
			<div class="cloud-orbit cloud-orbit--inner"><i></i><i></i></div>
			<div class="cloud-core">N/C</div>
			<div class="cloud-status"><span></span> ALL SYSTEMS OPERATIONAL</div>
		{:else}
			<div class="ai-grid">
				{#each Array(20), i (i)}
					<i class:active={[3, 6, 7, 11, 12, 13, 17].includes(i)}></i>
				{/each}
			</div>
			<div class="ai-prompt"><span>&gt;_</span> LEARNING PATH GENERATED</div>
		{/if}
	</div>

	<div class="project-card__body">
		<div>
			<h3>{project.title}</h3>
			<p>{project.description}</p>
		</div>
		<strong>{project.result}</strong>
	</div>

	<div class="project-card__footer">
		<ul aria-label="Технологии">
			{#each project.stack as item (item)}
				<li>{item}</li>
			{/each}
		</ul>
		<span class="project-arrow" aria-hidden="true">↗</span>
	</div>
</article>
