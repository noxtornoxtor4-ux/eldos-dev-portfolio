import type { RegistrationInput } from '$lib/shared/model/auth';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePassword(password: string) {
	return password.length >= 8 ? null : 'Пароль должен содержать минимум 8 символов.';
}

export function validateRegistration(input: RegistrationInput) {
	const errors: Record<string, string> = {};

	if (input.name.trim().length < 2) errors.name = 'Введите имя — минимум 2 символа.';
	if (!emailPattern.test(input.email.trim())) errors.email = 'Введите корректный email.';

	const digits = input.phone.replace(/\D/g, '');
	if (digits.length < 7 || digits.length > 15) {
		errors.phone = 'Введите корректный номер телефона.';
	}

	const passwordError = validatePassword(input.password);
	if (passwordError) errors.password = passwordError;
	if (input.password !== input.passwordConfirmation) {
		errors.passwordConfirmation = 'Пароли не совпадают.';
	}

	return errors;
}

export function validateEmail(email: string) {
	return emailPattern.test(email.trim()) ? null : 'Введите корректный email.';
}

export function getAuthErrorMessage(message: string) {
	const normalized = message.toLowerCase();

	if (normalized.includes('invalid login credentials')) return 'Неверный email или пароль.';
	if (normalized.includes('email not confirmed'))
		return 'Сначала подтвердите email по ссылке из письма.';
	if (normalized.includes('already registered') || normalized.includes('already been registered')) {
		return 'Аккаунт с таким email уже существует.';
	}
	if (normalized.includes('rate limit')) return 'Слишком много попыток. Попробуйте немного позже.';
	if (normalized.includes('expired')) return 'Ссылка устарела. Запросите новое письмо.';

	return 'Не удалось выполнить запрос. Попробуйте ещё раз.';
}
