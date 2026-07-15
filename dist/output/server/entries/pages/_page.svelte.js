import { r as ensure_array_like, t as attr_class, v as attr, y as escape_html } from "../../chunks/server.js";
//#region src/lib/shared/ui/SectionLabel.svelte
function SectionLabel($$renderer, $$props) {
	let { index, text } = $$props;
	$$renderer.push(`<div class="section-label" aria-hidden="true"><span>${escape_html(index)}</span> <span class="section-label__line"></span> <span>${escape_html(text)}</span></div>`);
}
//#endregion
//#region src/lib/widgets/about/ui/About.svelte
function About($$renderer) {
	$$renderer.push(`<section class="section about" id="about">`);
	SectionLabel($$renderer, {
		index: "03",
		text: "ABOUT"
	});
	$$renderer.push(`<!----> <div class="about-layout"><div class="about-title"><p class="eyebrow"><span></span> HUMAN BEHIND THE CODE</p> <h2>Привет.<br/>Я <em>Эльдос.</em></h2></div> <div class="about-copy"><p class="about-copy__lead">Разработчик, которому важно не просто написать код, а собрать продукт, которым хочется
				пользоваться.</p> <div class="about-copy__columns"><p>Работаю на пересечении инженерии, дизайна и продуктового мышления. Люблю ясные системы,
					быстрые интерфейсы и команды без лишней бюрократии.</p> <p>Базируюсь в Алматы, сотрудничаю с командами по всему миру. Открыт к сложным продуктовым
					задачам и амбициозным идеям.</p></div></div></div> <div class="principles"><div><span>01</span><strong>Ясность<br/>вместо шума</strong></div> <div><span>02</span><strong>Скорость<br/>без хаоса</strong></div> <div><span>03</span><strong>Результат<br/>без магии</strong></div> <div class="principles__accent"><span>SYSTEM STATUS</span><strong>READY<br/>TO BUILD</strong></div></div></section>`);
}
//#endregion
//#region src/lib/features/copy-email/ui/CopyEmailButton.svelte
function CopyEmailButton($$renderer, $$props) {
	let { email } = $$props;
	$$renderer.push(`<button${attr_class("copy-button", void 0, { "is-copied": false })} type="button"><span>${escape_html(email)}</span> <span class="copy-button__icon" aria-hidden="true">${escape_html("↗")}</span></button>`);
}
//#endregion
//#region src/lib/shared/config/site.ts
var navigation = [
	{
		label: "Проекты",
		href: "#projects"
	},
	{
		label: "Экспертиза",
		href: "#expertise"
	},
	{
		label: "Обо мне",
		href: "#about"
	},
	{
		label: "Контакт",
		href: "#contact"
	}
];
var projects = [
	{
		id: "01",
		title: "Neon Ledger",
		category: "Fintech / Product Engineering",
		description: "Платформа управления финансами для команд: единый обзор, умные сценарии и решения без лишнего шума.",
		result: "−41% времени на рутину",
		stack: [
			"SvelteKit",
			"TypeScript",
			"PostgreSQL"
		],
		year: "2026",
		tone: "cyan"
	},
	{
		id: "02",
		title: "Nomad Cloud",
		category: "DevTools / Cloud Infrastructure",
		description: "Панель облачной инфраструктуры, которая превращает сложные операции в ясный и предсказуемый поток.",
		result: "3× быстрее деплой",
		stack: [
			"Node.js",
			"Go",
			"ClickHouse"
		],
		year: "2025",
		tone: "magenta"
	},
	{
		id: "03",
		title: "Qadam AI",
		category: "EdTech / AI Experience",
		description: "Персональный AI-наставник с адаптивными маршрутами обучения и понятной аналитикой прогресса.",
		result: "+28% к завершению курсов",
		stack: [
			"Svelte",
			"Python",
			"OpenAI"
		],
		year: "2025",
		tone: "violet"
	}
];
var skillGroups = [
	{
		index: "01",
		title: "Интерфейсы",
		description: "Выстраиваю быстрые, выразительные и доступные интерфейсы вокруг задач продукта.",
		tools: [
			"SvelteKit",
			"TypeScript",
			"Design systems",
			"Motion"
		]
	},
	{
		index: "02",
		title: "Системы",
		description: "Проектирую API и сервисы, которые выдерживают рост без потери ясности и скорости.",
		tools: [
			"Node.js",
			"PostgreSQL",
			"Redis",
			"Cloud"
		]
	},
	{
		index: "03",
		title: "Запуск",
		description: "Соединяю продукт, код и аналитику, чтобы быстрее пройти путь от идеи до результата.",
		tools: [
			"Architecture",
			"CI/CD",
			"Analytics",
			"AI integration"
		]
	}
];
var email = "hello@eldos.dev";
//#endregion
//#region src/lib/widgets/contact/ui/Contact.svelte
function Contact($$renderer) {
	$$renderer.push(`<section class="contact" id="contact"><div class="contact__noise" aria-hidden="true"></div> <div class="contact__inner">`);
	SectionLabel($$renderer, {
		index: "04",
		text: "START A PROJECT"
	});
	$$renderer.push(`<!----> <div class="contact__status"><span></span> СЕЙЧАС ДОСТУПЕН ДЛЯ НОВЫХ ПРОЕКТОВ</div> <h2>Есть идея?<br/><em>Давайте запустим.</em></h2> <p>Расскажите, что хотите создать. Отвечу по делу, задам правильные вопросы и предложу следующий
			шаг.</p> `);
	CopyEmailButton($$renderer, { email });
	$$renderer.push(`<!----> <div class="contact__meta"><span>ALMATY / UTC+5</span> <span>RESPONSE TIME ≈ 24H</span> <span>RU / EN / KZ</span></div></div></section>`);
}
//#endregion
//#region src/lib/widgets/expertise/ui/Expertise.svelte
function Expertise($$renderer) {
	$$renderer.push(`<section class="section expertise" id="expertise">`);
	SectionLabel($$renderer, {
		index: "02",
		text: "EXPERTISE"
	});
	$$renderer.push(`<!----> <div class="expertise-layout"><div class="expertise-intro"><h2>От первой линии<br/>до <em>production.</em></h2> <p>Не разделяю продукт и технологию. Сначала нахожу правильную задачу, затем выбираю самый
				прямой путь к надежному решению.</p> <div class="expertise-orbit" aria-hidden="true"><span>BUILD</span><span>SHIP</span><span>LEARN</span><i>E/D</i></div></div> <div class="skill-list"><!--[-->`);
	const each_array = ensure_array_like(skillGroups);
	for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
		let group = each_array[$$index_1];
		$$renderer.push(`<article class="skill-row"><span class="skill-row__index">/${escape_html(group.index)}</span> <div><h3>${escape_html(group.title)}</h3> <p>${escape_html(group.description)}</p> <ul><!--[-->`);
		const each_array_1 = ensure_array_like(group.tools);
		for (let $$index = 0, $$length = each_array_1.length; $$index < $$length; $$index++) {
			let tool = each_array_1[$$index];
			$$renderer.push(`<li>${escape_html(tool)}</li>`);
		}
		$$renderer.push(`<!--]--></ul></div></article>`);
	}
	$$renderer.push(`<!--]--></div></div></section>`);
}
//#endregion
//#region src/lib/widgets/footer/ui/Footer.svelte
function Footer($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		$$renderer.push(`<footer class="site-footer"><a class="brand" href="#top" aria-label="Вернуться наверх"><span class="brand__mark">E/D</span><span class="brand__cursor">_</span></a> <p>© ${escape_html((/* @__PURE__ */ new Date()).getFullYear())} ELDOS.DEV — BUILT WITH INTENT.</p> <a href="#top">BACK TO TOP ↑</a></footer>`);
	});
}
//#endregion
//#region src/lib/widgets/header/ui/Header.svelte
function Header($$renderer) {
	let menuOpen = false;
	$$renderer.push(`<header class="site-header"><a class="brand" href="#top" aria-label="eldos.dev — на главную"><span class="brand__mark">E/D</span><span class="brand__cursor">_</span></a> <nav${attr_class("site-nav", void 0, { "site-nav--open": menuOpen })} aria-label="Основная навигация"><!--[-->`);
	const each_array = ensure_array_like(navigation);
	for (let index = 0, $$length = each_array.length; index < $$length; index++) {
		let item = each_array[index];
		$$renderer.push(`<a${attr("href", item.href)}><span>0${escape_html(index + 1)}</span>${escape_html(item.label)}</a>`);
	}
	$$renderer.push(`<!--]--></nav> <div class="header-status" aria-label="Доступен для новых проектов"><span></span>AVAILABLE / 2026</div> <button${attr_class("menu-toggle", void 0, { "menu-toggle--open": menuOpen })} type="button"${attr("aria-label", "Открыть меню")}${attr("aria-expanded", menuOpen)}><i></i><i></i></button></header>`);
}
//#endregion
//#region src/lib/widgets/hero/ui/Hero.svelte
function Hero($$renderer) {
	$$renderer.push(`<section class="hero" id="top"><div class="hero__signal" aria-hidden="true"><span>48.0196° N</span> <span>66.9237° E</span></div> <div class="hero__content"><p class="eyebrow"><span></span> FULL-STACK DEVELOPER / ALMATY — REMOTE</p> <h1><span>Создаю</span> <span>цифровые</span> <span class="hero__outline" data-text="системы.">системы.</span></h1> <div class="hero__bottom"><p>Превращаю сложные идеи в быстрые и понятные продукты — от интерфейса до надежной
				архитектуры.</p> <div class="hero__actions"><a class="button button--primary" href="#projects"><span>Смотреть проекты</span><i>↘</i></a> <a class="button button--ghost" href="#contact">Обсудить задачу</a></div></div></div> <aside class="system-card" aria-label="Профиль разработчика"><div class="system-card__head"><span>PROFILE.SYS</span> <span class="system-card__live">LIVE</span></div> <div class="system-card__portrait" aria-hidden="true"><div class="portrait-rings"><i></i><i></i><i></i></div> <div class="portrait-monogram">E</div> <span class="scan-beam"></span> <small>IDENTITY VERIFIED</small></div> <div class="system-card__code"><p><span>01</span><b>const</b> developer = {</p> <p><span>02</span>  name: <em>'Эльдос'</em>,</p> <p><span>03</span>  focus: <em>'impact'</em>,</p> <p><span>04</span>  status: <em>'building'</em></p> <p><span>05</span>};</p></div> <div class="system-card__stats"><div><strong>5+</strong><span>лет опыта</span></div> <div><strong>30+</strong><span>релизов</span></div> <div><strong>∞</strong><span>любопытство</span></div></div></aside> <a class="scroll-cue" href="#projects"><span>SCROLL_TO_EXPLORE</span><i></i></a></section> <div class="ticker" aria-hidden="true"><div><span>SVELTEKIT</span><i>✦</i><span>TYPESCRIPT</span><i>✦</i><span>NODE.JS</span><i>✦</i><span>PRODUCT THINKING</span><i>✦</i><span>POSTGRESQL</span><i>✦</i><span>AI SYSTEMS</span><i>✦</i><span>SVELTEKIT</span><i>✦</i><span>TYPESCRIPT</span><i>✦</i><span>NODE.JS</span><i>✦</i></div></div>`);
}
//#endregion
//#region src/lib/entities/project/ui/ProjectCard.svelte
function ProjectCard($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { project, featured = false } = $$props;
		$$renderer.push(`<article${attr_class(`project-card project-card--${project.tone}`, void 0, { "project-card--featured": featured })}><div class="project-card__meta"><span>[${escape_html(project.id)}]</span> <span>${escape_html(project.category)}</span> <span>${escape_html(project.year)}</span></div> <div class="project-visual" aria-hidden="true">`);
		if (project.id === "01") {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="ledger-window"><div class="window-dots"><i></i><i></i><i></i></div> <div class="ledger-chart"><span style="--height: 30%"></span><span style="--height: 48%"></span><span style="--height: 39%"></span><span style="--height: 65%"></span><span style="--height: 56%"></span><span style="--height: 86%"></span></div> <div class="ledger-total">₸ 24.8M <small>+18.4%</small></div></div>`);
		} else if (project.id === "02") {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<div class="cloud-orbit cloud-orbit--outer"><i></i><i></i><i></i></div> <div class="cloud-orbit cloud-orbit--inner"><i></i><i></i></div> <div class="cloud-core">N/C</div> <div class="cloud-status"><span></span> ALL SYSTEMS OPERATIONAL</div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="ai-grid"><!--[-->`);
			const each_array = ensure_array_like(Array(20));
			for (let i = 0, $$length = each_array.length; i < $$length; i++) {
				each_array[i];
				$$renderer.push(`<i${attr_class("", void 0, { "active": [
					3,
					6,
					7,
					11,
					12,
					13,
					17
				].includes(i) })}></i>`);
			}
			$$renderer.push(`<!--]--></div> <div class="ai-prompt"><span>>_</span> LEARNING PATH GENERATED</div>`);
		}
		$$renderer.push(`<!--]--></div> <div class="project-card__body"><div><h3>${escape_html(project.title)}</h3> <p>${escape_html(project.description)}</p></div> <strong>${escape_html(project.result)}</strong></div> <div class="project-card__footer"><ul aria-label="Технологии"><!--[-->`);
		const each_array_1 = ensure_array_like(project.stack);
		for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
			let item = each_array_1[$$index_1];
			$$renderer.push(`<li>${escape_html(item)}</li>`);
		}
		$$renderer.push(`<!--]--></ul> <span class="project-arrow" aria-hidden="true">↗</span></div></article>`);
	});
}
//#endregion
//#region src/lib/widgets/projects/ui/Projects.svelte
function Projects($$renderer) {
	$$renderer.push(`<section class="section projects" id="projects">`);
	SectionLabel($$renderer, {
		index: "01",
		text: "SELECTED WORK"
	});
	$$renderer.push(`<!----> <div class="section-heading"><h2>Проекты с<br/><em>измеримым эффектом.</em></h2> <p>Выбранные продукты, в которых инженерия работает на бизнес, а детали — на человека.</p></div> <div class="projects-grid"><!--[-->`);
	const each_array = ensure_array_like(projects);
	for (let index = 0, $$length = each_array.length; index < $$length; index++) {
		let project = each_array[index];
		ProjectCard($$renderer, {
			project,
			featured: index === 0
		});
	}
	$$renderer.push(`<!--]--></div></section>`);
}
//#endregion
//#region src/lib/pages/home/ui/HomePage.svelte
function HomePage($$renderer) {
	$$renderer.push(`<div class="site-shell"><div class="cursor-glow" aria-hidden="true"></div> <div class="page-grid" aria-hidden="true"></div> `);
	Header($$renderer, {});
	$$renderer.push(`<!----> <main>`);
	Hero($$renderer, {});
	$$renderer.push(`<!----> `);
	Projects($$renderer, {});
	$$renderer.push(`<!----> `);
	Expertise($$renderer, {});
	$$renderer.push(`<!----> `);
	About($$renderer, {});
	$$renderer.push(`<!----> `);
	Contact($$renderer, {});
	$$renderer.push(`<!----></main> `);
	Footer($$renderer, {});
	$$renderer.push(`<!----></div>`);
}
//#endregion
//#region src/routes/+page.svelte
function _page($$renderer) {
	HomePage($$renderer, {});
}
//#endregion
export { _page as default };
