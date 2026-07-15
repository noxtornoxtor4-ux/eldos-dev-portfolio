import type { Project, SkillGroup } from '$lib/shared/model/types';

export const navigation = [
	{ label: 'Проекты', href: '#projects' },
	{ label: 'Экспертиза', href: '#expertise' },
	{ label: 'Обо мне', href: '#about' },
	{ label: 'Контакт', href: '#contact' }
] as const;

export const projects: Project[] = [
	{
		id: '01',
		title: 'Neon Ledger',
		category: 'Fintech / Product Engineering',
		description:
			'Платформа управления финансами для команд: единый обзор, умные сценарии и решения без лишнего шума.',
		result: '−41% времени на рутину',
		stack: ['SvelteKit', 'TypeScript', 'PostgreSQL'],
		year: '2026',
		tone: 'cyan'
	},
	{
		id: '02',
		title: 'Nomad Cloud',
		category: 'DevTools / Cloud Infrastructure',
		description:
			'Панель облачной инфраструктуры, которая превращает сложные операции в ясный и предсказуемый поток.',
		result: '3× быстрее деплой',
		stack: ['Node.js', 'Go', 'ClickHouse'],
		year: '2025',
		tone: 'magenta'
	},
	{
		id: '03',
		title: 'Qadam AI',
		category: 'EdTech / AI Experience',
		description:
			'Персональный AI-наставник с адаптивными маршрутами обучения и понятной аналитикой прогресса.',
		result: '+28% к завершению курсов',
		stack: ['Svelte', 'Python', 'OpenAI'],
		year: '2025',
		tone: 'violet'
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
