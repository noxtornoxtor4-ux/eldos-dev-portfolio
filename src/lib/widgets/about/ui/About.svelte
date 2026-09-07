<script lang="ts">
	import SectionLabel from '$lib/shared/ui/SectionLabel.svelte';
</script>

<section class="section about" id="about">
	<SectionLabel index="03" text="ABOUT" />
	<div class="about-layout">
		<div class="about-title">
			<p class="eyebrow"><span></span> HUMAN BEHIND THE CODE</p>
			<h2>Привет.<br />Я <em>Эльдос.</em></h2>
		</div>
		<div class="about-copy">
			<p class="about-copy__lead">
				Разработчик, которому важно не просто написать код, а собрать продукт, которым хочется
				пользоваться.
			</p>
			<div class="about-copy__columns">
				<p>
					Работаю на пересечении инженерии, дизайна и продуктового мышления. Люблю ясные системы,
					быстрые интерфейсы и команды без лишней бюрократии.
				</p>
				<p>
					Базируюсь в Кыргызстане, сотрудничаю с командами по всему миру. Открыт к сложным
					продуктовым задачам и амбициозным идеям.
				</p>
			</div>
		</div>
	</div>
	<div class="principles">
		<div><span>01</span><strong>Ясность<br />вместо шума</strong></div>
		<div><span>02</span><strong>Скорость<br />без хаоса</strong></div>
		<div><span>03</span><strong>Результат<br />без магии</strong></div>
		<div class="principles__accent">
			<span>SYSTEM STATUS</span><strong>READY<br />TO BUILD</strong>
		</div>
	</div>
</section>
