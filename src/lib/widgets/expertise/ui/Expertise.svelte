<script lang="ts">
	import { skillGroups } from '$lib/shared/config/site';
	import SectionLabel from '$lib/shared/ui/SectionLabel.svelte';
</script>

<section class="section expertise" id="expertise">
	<SectionLabel index="02" text="EXPERTISE" />
	<div class="expertise-layout">
		<div class="expertise-intro">
			<h2>От первой линии<br />до <em>production.</em></h2>
			<p>
				Не разделяю продукт и технологию. Сначала нахожу правильную задачу, затем выбираю самый
				прямой путь к надежному решению.
			</p>
			<div class="expertise-orbit" aria-hidden="true">
				<span>BUILD</span><span>SHIP</span><span>LEARN</span><i>E/D</i>
			</div>
		</div>

		<div class="skill-list">
			{#each skillGroups as group (group.index)}
				<article class="skill-row">
					<span class="skill-row__index">/{group.index}</span>
					<div>
						<h3>{group.title}</h3>
						<p>{group.description}</p>
						<ul>
							{#each group.tools as tool (tool)}
								<li>{tool}</li>
							{/each}
						</ul>
					</div>
				</article>
			{/each}
		</div>
	</div>
</section>
