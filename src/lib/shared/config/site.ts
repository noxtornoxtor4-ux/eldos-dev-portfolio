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

export const email = 'hello@eldos.dev';
