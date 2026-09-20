import type { Project, SkillGroup } from '$lib/shared/model/types';

// `id` is the target section's element id; the header renders it as an in-page fragment link.
export const navigation = [
	{ label: 'Проекты', id: 'projects' },
	{ label: 'Экспертиза', id: 'expertise' },
	{ label: 'Обо мне', id: 'about' },
	{ label: 'Контакт', id: 'contact' }
] as const;

export const projects: Project[] = [
	{
		id: '01',
		title: 'PrimeDent',
		category: 'Healthcare / Web App',
		description:
			'Сайт и веб-приложение стоматологии: филиалы, каталог услуг с ценами и запись на приём. Врачи регистрируются сами, карточка публикуется после подтверждения клиникой, отзывы привязаны к своему филиалу.',
		result: 'Филиалы, врачи и отзывы в одной системе',
		stack: ['SvelteKit', 'TypeScript', 'Cloudflare'],
		year: '2026',
		tone: 'cyan',
		visual: 'clinic',
		href: 'https://primedent-aa9.pages.dev/'
	},
	{
		id: '02',
		title: 'Говорим онлайн',
		category: 'Telegram Bot / Booking',
		description:
			'Бот онлайн-записи: клиент выбирает свободное время и записывается в несколько нажатий прямо в Telegram — без звонков и без установки отдельного приложения.',
		result: 'Запись прямо в Telegram',
		stack: ['Node.js', 'Telegram Bot API'],
		year: '2026',
		tone: 'magenta',
		visual: 'booking-bot',
		href: 'https://t.me/govrim_online_bot'
	},
	{
		id: '03',
		title: 'Подготовка к ОРТ',
		category: 'EdTech / Landing Page',
		description:
			'Лендинг курсов подготовки к ОРТ в Бишкеке. Заявка на пробный урок собирается в три шага — удобное время, предметы и контакты, — а готовое сообщение сразу открывается в WhatsApp.',
		result: 'Заявка в WhatsApp за три шага',
		stack: ['Vite', 'JavaScript', 'WhatsApp'],
		year: '2026',
		tone: 'violet',
		visual: 'lead-form',
		href: 'https://ort-landing.vercel.app/'
	},
	{
		id: '04',
		title: 'PHOENIX',
		category: 'Healthcare / Landing Page',
		description:
			'Сайт стоматологии в Караколе: пациент отмечает больной зуб на интерактивной схеме и сразу видит время приёма и ориентир цены. Запись собирается в три шага и уходит готовым сообщением в WhatsApp.',
		result: 'Смета до визита',
		stack: ['React', 'Vite', 'PWA'],
		year: '2026',
		tone: 'cyan',
		visual: 'tooth-chart',
		href: 'https://phoenix-dental-five.vercel.app/'
	}
];

export const skillGroups: SkillGroup[] = [
	{
		index: '01',
		title: 'Интерфейсы',
		description: 'Выстраиваю быстрые, выразительные и доступные интерфейсы вокруг задач продукта.',
		tools: ['SvelteKit', 'TypeScript', 'Design systems', 'Motion']
	},
	{
		index: '02',
		title: 'Системы',
		description:
			'Проектирую API и сервисы, которые выдерживают рост без потери ясности и скорости.',
		tools: ['Node.js', 'PostgreSQL', 'Redis', 'Cloud']
	},
	{
		index: '03',
		title: 'Запуск',
		description:
			'Соединяю продукт, код и аналитику, чтобы быстрее пройти путь от идеи до результата.',
		tools: ['Architecture', 'CI/CD', 'Analytics', 'AI integration']
	}
];

export const email = 'noxtornoxtor4@gmail.com';
