export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: string;
  sessionExpiresAt: string;
}

export class AuthenticationError extends Error {
  readonly code: 'configuration' | 'invalid_credentials' | 'invalid_session' | 'network' | 'server';

  constructor(code: AuthenticationError['code']) {
    const messages: Record<AuthenticationError['code'], string> = {
      configuration: 'The clinic server is not configured on this device.',
      invalid_credentials: 'The username or password is incorrect.',
      invalid_session: 'Your session has expired. Sign in again.',
      network: 'The clinic server could not be reached.',
      server: 'The clinic server returned an unexpected response.',
    };
    super(messages[code]);
    this.name = 'AuthenticationError';
    this.code = code;
  }
}

type FetchImplementation = (input: string, init?: RequestInit) => Promise<Response>;

interface AuthenticationApiOptions {
  fetchImplementation?: FetchImplementation;
  timeoutMilliseconds?: number;
}

const DEFAULT_TIMEOUT_MILLISECONDS = 15_000;
const MAXIMUM_RESPONSE_BYTES = 32 * 1024;

export class AuthenticationApi {
  private readonly baseUrl: string | null;
  private readonly fetchImplementation: FetchImplementation;
  private readonly timeoutMilliseconds: number;

  constructor(baseUrl: string | null, options: AuthenticationApiOptions = {}) {
    this.baseUrl = baseUrl;
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.timeoutMilliseconds = options.timeoutMilliseconds ?? DEFAULT_TIMEOUT_MILLISECONDS;
  }

  login(username: string, password: string, sessionDurationHours?: number): Promise<SessionTokens> {
    return this.request('/api/v1/auth/login', {
      username,
      password,
      ...(sessionDurationHours === undefined ? {} : { session_duration_hours: sessionDurationHours }),
    });
  }

  refresh(refreshToken: string): Promise<SessionTokens> {
    return this.request('/api/v1/auth/refresh', { refresh_token: refreshToken });
  }

  async logout(accessToken: string, refreshToken: string): Promise<void> {
    await this.request('/api/v1/auth/logout', { refresh_token: refreshToken }, accessToken, true);
  }

  private async request(
    path: string,
    body: Readonly<Record<string, string | number>>,
    accessToken?: string,
    noContent = false,
  ): Promise<SessionTokens> {
    if (!this.baseUrl) {
      throw new AuthenticationError('configuration');
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMilliseconds);
    let response: Response;
    try {
      response = await this.fetchImplementation(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch {
      throw new AuthenticationError('network');
    } finally {
      clearTimeout(timeout);
    }

    if (noContent && response.status === 204) {
      return emptyTokens();
    }
    if (response.status === 401) {
      const code = await readErrorCode(response);
      throw new AuthenticationError(code === 'invalid_credentials' ? 'invalid_credentials' : 'invalid_session');
    }
    if (!response.ok) {
      throw new AuthenticationError('server');
    }
    return parseSessionTokens(await readBoundedText(response));
  }
}

async function readErrorCode(response: Response): Promise<string | null> {
  try {
    const value: unknown = JSON.parse(await readBoundedText(response));
    if (isRecord(value) && typeof value.code === 'string') {
      return value.code;
    }
  } catch {
    // The status code is sufficient; response details are intentionally discarded.
  }
  return null;
}

async function readBoundedText(response: Response): Promise<string> {
  const declaredLength = Number(response.headers.get('Content-Length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAXIMUM_RESPONSE_BYTES) {
    throw new AuthenticationError('server');
  }
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAXIMUM_RESPONSE_BYTES) {
    throw new AuthenticationError('server');
  }
  return text;
}

export function parseSessionTokens(text: string): SessionTokens {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new AuthenticationError('server');
  }
  if (!isRecord(value)) {
    throw new AuthenticationError('server');
  }
  const accessToken = validToken(value.access_token);
  const refreshToken = validToken(value.refresh_token);
  const accessExpiresAt = validTimestamp(value.access_expires_at);
  const sessionExpiresAt = validTimestamp(value.session_expires_at);
  if (!accessToken || !refreshToken || !accessExpiresAt || !sessionExpiresAt) {
    throw new AuthenticationError('server');
  }
  if (Date.parse(accessExpiresAt) >= Date.parse(sessionExpiresAt)) {
    throw new AuthenticationError('server');
  }
  return { accessToken, refreshToken, accessExpiresAt, sessionExpiresAt };
}

function validToken(value: unknown): string | null {
  return typeof value === 'string' && value.length >= 32 && value.length <= 4096 ? value : null;
}

function validTimestamp(value: unknown): string | null {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function emptyTokens(): SessionTokens {
  return { accessToken: '', refreshToken: '', accessExpiresAt: '', sessionExpiresAt: '' };
}
