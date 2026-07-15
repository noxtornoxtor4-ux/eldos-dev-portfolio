import { describe, expect, it } from 'vitest';
import {
	getAuthErrorMessage,
	validatePassword,
	validateRegistration
} from '../src/lib/features/auth/model/validation';

describe('validateRegistration', () => {
	it('accepts the agreed registration shape', () => {
		expect(
			validateRegistration({
				name: 'Эльдос',
				email: 'person@example.com',
				phone: '+7 700 000 00 00',
				password: 'strongpass',
				passwordConfirmation: 'strongpass'
			})
		).toEqual({});
	});

	it('rejects invalid and mismatched values', () => {
		const errors = validateRegistration({
			name: 'A',
			email: 'bad',
			phone: '123',
			password: 'short',
			passwordConfirmation: 'different'
		});

		expect(Object.keys(errors).sort()).toEqual([
			'email',
			'name',
			'password',
			'passwordConfirmation',
			'phone'
		]);
	});

	it('requires at least eight password characters', () => {
		expect(validatePassword('1234567')).toBe('Пароль должен содержать минимум 8 символов.');
		expect(validatePassword('12345678')).toBeNull();
	});

	it('maps provider errors to safe Russian copy', () => {
		expect(getAuthErrorMessage('Invalid login credentials')).toBe('Неверный email или пароль.');
		expect(getAuthErrorMessage('User already registered')).toBe(
			'Аккаунт с таким email уже существует.'
		);
		expect(getAuthErrorMessage('internal database details')).toBe(
			'Не удалось выполнить запрос. Попробуйте ещё раз.'
		);
	});
});
