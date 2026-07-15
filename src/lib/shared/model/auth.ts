export type RegistrationInput = {
	name: string;
	email: string;
	phone: string;
	password: string;
	passwordConfirmation: string;
};

export type Profile = {
	id: string;
	name: string;
	email: string;
	phone: string;
};

export type ChatMessage = {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	created_at: string;
};

export type ApiError = {
	ok?: false;
	error?: string;
};
