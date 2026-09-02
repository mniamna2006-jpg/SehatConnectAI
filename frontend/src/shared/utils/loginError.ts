import { ApiError } from '../../core/api/client';

export function getLoginErrorMessage(error: unknown, translate: (key: string) => string): string {
  if (!(error instanceof ApiError)) return translate('auth.errors.unexpected');
  if (error.status === 401) return translate('auth.errors.invalidCredentials');
  if (error.status === 0) return translate('auth.errors.network');
  if (error.status >= 500) return translate('auth.errors.server');
  return translate('auth.errors.unexpected');
}
