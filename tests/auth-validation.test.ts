import { describe, expect, it } from 'vitest';
import { validatePassword, validateRegistration } from '../src/lib/features/auth/model/validation';

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
});
