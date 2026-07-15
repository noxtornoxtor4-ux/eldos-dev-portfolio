<script lang="ts">
	import CopyEmailButton from '$lib/features/copy-email/ui/CopyEmailButton.svelte';
	import { email } from '$lib/shared/config/site';
	import SectionLabel from '$lib/shared/ui/SectionLabel.svelte';
</script>

<section class="contact" id="contact">
	<div class="contact__noise" aria-hidden="true"></div>
	<div class="contact__inner">
		<SectionLabel index="04" text="START A PROJECT" />
		<div class="contact__status"><span></span> СЕЙЧАС ДОСТУПЕН ДЛЯ НОВЫХ ПРОЕКТОВ</div>
		<h2>Есть идея?<br /><em>Давайте запустим.</em></h2>
		<p>
			Расскажите, что хотите создать. Отвечу по делу, задам правильные вопросы и предложу следующий
			шаг.
		</p>
		<CopyEmailButton {email} />
		<div class="contact__meta">
			<span>ALMATY / UTC+5</span>
			<span>RESPONSE TIME ≈ 24H</span>
			<span>RU / EN / KZ</span>
		</div>
	</div>
</section>
