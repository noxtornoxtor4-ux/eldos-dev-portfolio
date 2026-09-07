<script lang="ts">
	import ProjectCard from '$lib/entities/project/ui/ProjectCard.svelte';
	import { projects } from '$lib/shared/config/site';
	import SectionLabel from '$lib/shared/ui/SectionLabel.svelte';
</script>

<section class="section projects" id="projects">
	<SectionLabel index="01" text="SELECTED WORK" />
	<div class="section-heading">
		<h2>Продукты,<br /><em>которые работают.</em></h2>
		<p>Каждый проект можно открыть и попробовать — ссылки ведут на живые продукты.</p>
	</div>

	<div class="projects-grid">
		{#each projects as project, index (project.id)}
			<!-- The grid is two columns wide. Widening the first card only helps when the
			     rest still pair up evenly, otherwise the last card is left beside a gap. -->
			<ProjectCard {project} featured={index === 0 && projects.length % 2 === 1} />
		{/each}
	</div>
</section>
