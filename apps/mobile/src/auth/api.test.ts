import { AuthenticationApi, AuthenticationError, parseSessionTokens } from '@/src/auth/api';

const accessToken = 'a'.repeat(64);
const refreshToken = 'r'.repeat(43);
const sessionPayload = {
  access_token: accessToken,
  refresh_token: refreshToken,
  access_expires_at: '2026-08-26T12:15:00Z',
  session_expires_at: '2026-08-28T12:00:00Z',
};

function response(body: unknown, status = 200): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('AuthenticationApi', () => {
  it('sends login credentials and validates the token response', async () => {
    const fetchImplementation = jest.fn<Promise<Response>, [string, RequestInit?]>().mockResolvedValue(response(sessionPayload));
    const api = new AuthenticationApi('https://api.example.com', { fetchImplementation });

    await expect(api.login('clinic-owner', 'synthetic-password', 48)).resolves.toEqual({
      accessToken,
      refreshToken,
      accessExpiresAt: sessionPayload.access_expires_at,
      sessionExpiresAt: sessionPayload.session_expires_at,
    });
    expect(fetchImplementation).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          username: 'clinic-owner',
          password: 'synthetic-password',
          session_duration_hours: 48,
        }),
      }),
    );
  });

  it('uses bearer authentication for logout', async () => {
    const fetchImplementation = jest.fn<Promise<Response>, [string, RequestInit?]>().mockResolvedValue(response(null, 204));
    const api = new AuthenticationApi('https://api.example.com', { fetchImplementation });

    await expect(api.logout(accessToken, refreshToken)).resolves.toBeUndefined();
    expect(fetchImplementation).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/auth/logout',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Bearer ${accessToken}` }),
        body: JSON.stringify({ refresh_token: refreshToken }),
      }),
    );
  });

  it('rejects a successful logout response that violates the no-content contract', async () => {
    const api = new AuthenticationApi('https://api.example.com', {
      fetchImplementation: jest
        .fn<Promise<Response>, [string, RequestInit?]>()
        .mockResolvedValue(response({ unexpected: true })),
    });

    await expect(api.logout(accessToken, refreshToken)).rejects.toMatchObject({ code: 'server' });
  });

  it.each([
    [401, { code: 'invalid_credentials' }, 'invalid_credentials'],
    [401, { code: 'invalid_session' }, 'invalid_session'],
    [500, { code: 'internal_error' }, 'server'],
  ] as const)('maps HTTP %d to a safe %s error', async (status, body, expectedCode) => {
    const api = new AuthenticationApi('https://api.example.com', {
      fetchImplementation: jest.fn<Promise<Response>, [string, RequestInit?]>().mockResolvedValue(response(body, status)),
    });

    await expect(api.login('owner', 'sensitive-password')).rejects.toMatchObject({
      code: expectedCode,
    });
  });

  it('rejects missing configuration without issuing a request', async () => {
    const fetchImplementation = jest.fn<Promise<Response>, [string, RequestInit?]>();
    const api = new AuthenticationApi(null, { fetchImplementation });

    await expect(api.login('owner', 'sensitive-password')).rejects.toMatchObject({
      code: 'configuration',
    });
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it('maps transport failures without exposing credentials', async () => {
    const fetchImplementation = jest.fn<Promise<Response>, [string, RequestInit?]>().mockRejectedValue(new Error('socket failed'));
    const api = new AuthenticationApi('https://api.example.com', { fetchImplementation });

    const error = await api.login('owner', 'sensitive-password').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error).toMatchObject({ code: 'network' });
    expect(String(error)).not.toContain('sensitive-password');
  });
});

describe('parseSessionTokens', () => {
  it.each([
    ['not-json'],
    [JSON.stringify({ ...sessionPayload, access_token: 'short' })],
    [JSON.stringify({ ...sessionPayload, access_expires_at: 'invalid' })],
    [
      JSON.stringify({
        ...sessionPayload,
        access_expires_at: '2026-08-29T12:00:00Z',
      }),
    ],
  ])('rejects malformed server payload %#', (payload) => {
    expect(() => parseSessionTokens(payload)).toThrow(AuthenticationError);
  });
});
