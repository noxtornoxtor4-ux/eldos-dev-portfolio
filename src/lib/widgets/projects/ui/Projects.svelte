<script lang="ts">
	import ProjectCard from '$lib/entities/project/ui/ProjectCard.svelte';
	import { projects } from '$lib/shared/config/site';
	import SectionLabel from '$lib/shared/ui/SectionLabel.svelte';
</script>

<section class="section projects" id="projects">
	<SectionLabel index="01" text="SELECTED WORK" />
	<div class="section-heading">
		<h2>Проекты с<br /><em>измеримым эффектом.</em></h2>
		<p>Выбранные продукты, в которых инженерия работает на бизнес, а детали — на человека.</p>
	</div>

	<div class="projects-grid">
		{#each projects as project, index (project.id)}
			<ProjectCard {project} featured={index === 0} />
		{/each}
	</div>
</section>
