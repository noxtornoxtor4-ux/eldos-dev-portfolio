<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>Политика конфиденциальности — eldos.dev</title>
	<meta
		name="description"
		content="Как eldos.dev обрабатывает данные аккаунта и переписку с E/D Assistant."
	/>
	<link rel="canonical" href="https://eldos-dev-portfolio.vercel.app/privacy" />
	<meta name="robots" content="index, follow" />
	<meta property="og:url" content="https://eldos-dev-portfolio.vercel.app/privacy" />
</svelte:head>

<main class="legal-page">
	<div class="legal-page__grid" aria-hidden="true"></div>
	<article class="legal-page__card">
		<header>
			<a href={resolve('/')}>← ELDOS.DEV</a><span>PRIVACY / 2026-07-16</span>
		</header>
		<p class="legal-page__eyebrow">SECURE DATA PROTOCOL</p>
		<h1>Политика конфиденциальности</h1>
		<p class="legal-page__lead">
			Эта страница объясняет, какие данные используются для работы аккаунта и связи с Эльдосом.
		</p>

		<section>
			<span>01</span>
			<div>
				<h2>Какие данные сохраняются</h2>
				<p>
					Имя, email, номер телефона, технический идентификатор аккаунта и история сообщений с E/D
					Assistant. Пароль обрабатывается Supabase Auth и не сохраняется сайтом в открытом виде.
				</p>
			</div>
		</section>
		<section>
			<span>02</span>
			<div>
				<h2>Зачем нужны данные</h2>
				<p>
					Они используются для входа в аккаунт, восстановления пароля, сохранения вашей истории и
					ответа на обращение.
				</p>
			</div>
		</section>
		<section>
			<span>03</span>
			<div>
				<h2>Ответы нейросети</h2>
				<p>
					Ваш вопрос и последние сообщения из истории передаются Groq только для создания ответа E/D
					Assistant. Имя, телефон, пароль и токены доступа в запрос модели не включаются.
				</p>
			</div>
		</section>
		<section>
			<span>04</span>
			<div>
				<h2>Передача в Telegram</h2>
				<p>
					Когда вы отправляете сообщение ассистенту, Эльдос получает в Telegram ваше имя, email,
					телефон, вопрос и ответ ассистента. Пароли и токены доступа не передаются.
				</p>
			</div>
		</section>
		<section>
			<span>05</span>
			<div>
				<h2>Supabase</h2>
				<p>
					Supabase используется для защищённой авторизации и хранения профиля и переписки. Доступ к
					записям ограничен владельцем аккаунта и серверной частью сайта.
				</p>
			</div>
		</section>
		<section>
			<span>06</span>
			<div>
				<h2>Удаление данных</h2>
				<p>
					В настройках профиля можно удалить аккаунт. Вместе с ним удаляются профиль и вся
					сохранённая история сообщений.
				</p>
			</div>
		</section>
		<section>
			<span>07</span>
			<div>
				<h2>Связь</h2>
				<p>
					По вопросам обработки данных напишите на <a href="mailto:noxtornoxtor4@gmail.com"
						>noxtornoxtor4@gmail.com</a
					>.
				</p>
			</div>
		</section>

		<footer>
			<a href={resolve('/?assistant=open')}>Открыть E/D Assistant ↗</a><span
				>ELDOS.DEV / KYRGYZSTAN</span
			>
		</footer>
	</article>
</main>
