import type { TranslationKeys } from './translations/es';

export const zodErrorToKey: Record<string, keyof TranslationKeys['validation']> = {
  'El nombre es requerido': 'nameRequired',
  'El RFC / Tax ID es requerido': 'taxIdRequired',
  'Email inválido': 'emailInvalid',
  'El email es requerido': 'emailRequired',
  'La contraseña debe tener al menos 6 caracteres': 'passwordMin',
  'El nombre debe tener al menos 2 caracteres': 'firstNameMin',
  'El apellido debe tener al menos 2 caracteres': 'lastNameMin',
  'Refresh token requerido': 'refreshTokenRequired',
  'Email o usuario requerido': 'emailOrUsernameRequired',
  'Formato de email inválido': 'emailFormatInvalid',
  'La contraseña es requerida': 'passwordRequired',
};
