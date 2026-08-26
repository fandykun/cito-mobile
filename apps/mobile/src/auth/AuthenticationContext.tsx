import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import {
  AuthenticationApi,
  AuthenticationError,
  type SessionTokens,
} from '@/src/auth/api';
import {
  accessTokenNeedsRefresh,
  SessionRepository,
} from '@/src/auth/sessionRepository';
import { appEnvironment } from '@/src/config/env';

export type AuthenticationStatus = 'loading' | 'authenticated' | 'unauthenticated';
export type LogoutResult = 'revoked' | 'local_only';

interface AuthenticationContextValue {
  errorMessage: string | null;
  isOfflineSession: boolean;
  noticeMessage: string | null;
  session: SessionTokens | null;
  status: AuthenticationStatus;
  clearError(): void;
  login(username: string, password: string): Promise<void>;
  logout(): Promise<LogoutResult>;
  retryRestore(): Promise<void>;
}

interface AuthenticationApiClient {
  login(username: string, password: string): Promise<SessionTokens>;
  logout(accessToken: string, refreshToken: string): Promise<void>;
  refresh(refreshToken: string): Promise<SessionTokens>;
}

interface SessionStorage {
  clear(): Promise<void>;
  load(): Promise<SessionTokens | null>;
  save(session: SessionTokens): Promise<void>;
}

interface AuthenticationProviderProps extends PropsWithChildren {
  api?: AuthenticationApiClient;
  repository?: SessionStorage;
}

const defaultApi = new AuthenticationApi(appEnvironment.apiUrl);
const defaultRepository = new SessionRepository();
const AuthenticationContext = createContext<AuthenticationContextValue | null>(null);

export function AuthenticationProvider({
  api = defaultApi,
  repository = defaultRepository,
  children,
}: AuthenticationProviderProps) {
  const [status, setStatus] = useState<AuthenticationStatus>('loading');
  const [session, setSession] = useState<SessionTokens | null>(null);
  const [isOfflineSession, setIsOfflineSession] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  async function restore(): Promise<void> {
    setStatus('loading');
    setErrorMessage(null);
    try {
      const stored = await repository.load();
      if (!stored) {
        setSession(null);
        setIsOfflineSession(false);
        setStatus('unauthenticated');
        return;
      }
      if (!accessTokenNeedsRefresh(stored)) {
        setSession(stored);
        setIsOfflineSession(false);
        setStatus('authenticated');
        return;
      }
      try {
        const refreshed = await api.refresh(stored.refreshToken);
        await repository.save(refreshed);
        setSession(refreshed);
        setIsOfflineSession(false);
      } catch (error: unknown) {
        if (error instanceof AuthenticationError && error.code === 'invalid_session') {
          await repository.clear();
          setSession(null);
          setIsOfflineSession(false);
          setStatus('unauthenticated');
          return;
        }
        setSession(stored);
        setIsOfflineSession(true);
      }
      setStatus('authenticated');
    } catch {
      setSession(null);
      setIsOfflineSession(false);
      setErrorMessage('Secure session storage could not be opened.');
      setStatus('unauthenticated');
    }
  }

  useEffect(() => {
    void Promise.resolve().then(restore);
    // Dependencies are stable constructor-injected services.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, repository]);

  async function login(username: string, password: string): Promise<void> {
    setErrorMessage(null);
    setNoticeMessage(null);
    const authenticated = await api.login(username, password);
    await repository.save(authenticated);
    setSession(authenticated);
    setIsOfflineSession(false);
    setStatus('authenticated');
  }

  async function logout(): Promise<LogoutResult> {
    const current = session;
    let result: LogoutResult = 'revoked';
    if (current) {
      try {
        await api.logout(current.accessToken, current.refreshToken);
      } catch {
        result = 'local_only';
      }
    }
    await repository.clear();
    setSession(null);
    setIsOfflineSession(false);
    setNoticeMessage(
      result === 'local_only'
        ? 'Signed out on this device. The server could not be reached to revoke the session.'
        : null,
    );
    setStatus('unauthenticated');
    return result;
  }

  const value = useMemo<AuthenticationContextValue>(
    () => ({
      clearError: () => setErrorMessage(null),
      errorMessage,
      isOfflineSession,
      login,
      logout,
      noticeMessage,
      retryRestore: restore,
      session,
      status,
    }),
    // Functions intentionally close over the current injected services and session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [errorMessage, isOfflineSession, noticeMessage, session, status, api, repository],
  );

  return <AuthenticationContext.Provider value={value}>{children}</AuthenticationContext.Provider>;
}

export function useAuthentication(): AuthenticationContextValue {
  const context = useContext(AuthenticationContext);
  if (!context) {
    throw new Error('useAuthentication must be used inside AuthenticationProvider.');
  }
  return context;
}
