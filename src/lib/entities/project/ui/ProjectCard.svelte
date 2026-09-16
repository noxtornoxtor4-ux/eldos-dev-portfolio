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
		{#if project.visual === 'clinic'}
			<div class="clinic-panel">
				<div class="window-dots"><i></i><i></i><i></i></div>
				<ul class="clinic-rows">
					<li><span>ФИЛИАЛ</span><b>Каракол</b></li>
					<li><span>ВРАЧ</span><b>подтверждён</b></li>
					<li><span>ОТЗЫВЫ</span><b>по филиалу</b></li>
				</ul>
				<div class="clinic-slot"><span>Ближайшее окно</span><b>Сегодня, 17:30</b></div>
			</div>
			<div class="visual-status"><span></span> BRANCH / DOCTORS / REVIEWS</div>
		{:else if project.visual === 'booking-bot'}
			<div class="bot-chat">
				<p class="bot-bubble">Выберите удобное время</p>
				<ul class="bot-slots">
					<li>10:00</li>
					<li class="active">12:30</li>
					<li>15:00</li>
				</ul>
				<p class="bot-bubble bot-bubble--out">12:30</p>
			</div>
			<div class="visual-status"><span></span> BOOKED IN TELEGRAM</div>
		{:else}
			<div class="lead-form">
				<ol class="lead-steps">
					<li class="done">Время</li>
					<li class="done">Предметы</li>
					<li class="active">Контакты</li>
				</ol>
				<ul class="lead-subjects">
					<li class="active">Основной тест</li>
					<li class="active">Математика</li>
					<li>Химия</li>
					<li>Биология</li>
				</ul>
				<p class="lead-message">Хочу записаться на пробный урок по ОРТ</p>
			</div>
			<div class="visual-status"><span></span> SENT TO WHATSAPP</div>
		{/if}
	</div>

	<div class="project-card__body">
		<div>
			<h3>
				<a
					class="project-card__link"
					href={project.href}
					target="_blank"
					rel="external noopener noreferrer">{project.title}</a
				>
			</h3>
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
