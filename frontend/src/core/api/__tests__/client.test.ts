/// <reference types="node" />
import { apiRequest, ApiError, registerUnauthorizedHandler } from '../client';
import * as secureStore from '../../storage/secureStore';

jest.mock('../../storage/secureStore');

const okResponse = (data: unknown) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data }) } as Response);

const failResponse = (status: number, message: string) =>
  Promise.resolve({ ok: false, status, json: () => Promise.resolve({ success: false, message }) } as Response);

describe('apiRequest', () => {
  beforeEach(() => {
    (secureStore.getToken as jest.Mock).mockResolvedValue('tok-123');
    global.fetch = jest.fn();
  });

  test('attaches Authorization header when auth is true (default)', async () => {
    (global.fetch as jest.Mock).mockReturnValue(okResponse({ ok: 1 }));
    await apiRequest('/api/patient/profile');
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer tok-123');
  });

  test('omits Authorization header when auth is false', async () => {
    (global.fetch as jest.Mock).mockReturnValue(okResponse({ ok: 1 }));
    await apiRequest('/api/auth/login', { auth: false });
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });

  test('resolves with data.data on success', async () => {
    (global.fetch as jest.Mock).mockReturnValue(okResponse({ hello: 'world' }));
    await expect(apiRequest('/x')).resolves.toEqual({ hello: 'world' });
  });

  test('defaults to the backend server port when no API URL is configured', async () => {
    (global.fetch as jest.Mock).mockReturnValue(okResponse({ ok: 1 }));

    await apiRequest('/api/health', { auth: false });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/health',
      expect.any(Object)
    );
  });

  test('throws ApiError with status + message on failure', async () => {
    (global.fetch as jest.Mock).mockReturnValue(failResponse(401, 'Token expired'));
    await expect(apiRequest('/x')).rejects.toMatchObject(
      new ApiError(401, 'Token expired')
    );
  });

  test('on a 401, calls the registered unauthorized handler before throwing', async () => {
    const handler = jest.fn();
    registerUnauthorizedHandler(handler);
    (global.fetch as jest.Mock).mockReturnValue(failResponse(401, 'Token expired'));

    await expect(apiRequest('/x')).rejects.toThrow();
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
