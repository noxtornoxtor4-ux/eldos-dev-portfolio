export type ProjectTone = 'cyan' | 'magenta' | 'violet';

// Each project draws its own illustration. Keyed by name rather than by position
// so reordering the list never swaps the artwork.
export type ProjectVisual = 'clinic' | 'booking-bot' | 'lead-form';

export type Project = {
	id: string;
	title: string;
	category: string;
	description: string;
	result: string;
	stack: string[];
	year: string;
	tone: ProjectTone;
	visual: ProjectVisual;
	href: string;
};

export type SkillGroup = {
	index: string;
	title: string;
	description: string;
	tools: string[];
};
