export type ProjectTone = 'cyan' | 'magenta' | 'violet';

export type Project = {
	id: string;
	title: string;
	category: string;
	description: string;
	result: string;
	stack: string[];
	year: string;
	tone: ProjectTone;
};

export type SkillGroup = {
	index: string;
	title: string;
	description: string;
	tools: string[];
};
