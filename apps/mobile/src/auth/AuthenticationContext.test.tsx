import { act, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { AuthenticationError, type SessionTokens } from '@/src/auth/api';
import {
  AuthenticationProvider,
  useAuthentication,
} from '@/src/auth/AuthenticationContext';

const activeSession: SessionTokens = {
  accessToken: 'a'.repeat(64),
  refreshToken: 'r'.repeat(43),
  accessExpiresAt: '2099-08-26T12:15:00Z',
  sessionExpiresAt: '2099-08-28T12:00:00Z',
};
const expiringSession: SessionTokens = {
  ...activeSession,
  accessExpiresAt: '2020-08-26T12:15:00Z',
};

function StatusHarness() {
  const authentication = useAuthentication();
  return (
    <Text testID="status">
      {authentication.status}:{authentication.isOfflineSession ? 'offline' : 'online'}
    </Text>
  );
}

function createDependencies(stored: SessionTokens | null = null) {
  const api = {
    login: jest.fn<Promise<SessionTokens>, [string, string]>(),
    logout: jest.fn<Promise<void>, [string, string]>(),
    refresh: jest.fn<Promise<SessionTokens>, [string]>(),
  };
  const repository = {
    clear: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
    load: jest.fn<Promise<SessionTokens | null>, []>().mockResolvedValue(stored),
    save: jest.fn<Promise<void>, [SessionTokens]>().mockResolvedValue(undefined),
  };
  return { api, repository };
}

describe('AuthenticationProvider', () => {
  it('restores a still-valid secure session', async () => {
    const dependencies = createDependencies(activeSession);
    await render(
      <AuthenticationProvider {...dependencies}>
        <StatusHarness />
      </AuthenticationProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated:online'));
    expect(dependencies.api.refresh).not.toHaveBeenCalled();
  });

  it('rotates an expiring session before opening the app', async () => {
    const dependencies = createDependencies(expiringSession);
    dependencies.api.refresh.mockResolvedValue(activeSession);
    await render(
      <AuthenticationProvider {...dependencies}>
        <StatusHarness />
      </AuthenticationProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated:online'));
    expect(dependencies.api.refresh).toHaveBeenCalledWith(expiringSession.refreshToken);
    expect(dependencies.repository.save).toHaveBeenCalledWith(activeSession);
  });

  it('permits policy-valid offline re-entry when refresh cannot reach the server', async () => {
    const dependencies = createDependencies(expiringSession);
    dependencies.api.refresh.mockRejectedValue(new AuthenticationError('network'));
    await render(
      <AuthenticationProvider {...dependencies}>
        <StatusHarness />
      </AuthenticationProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated:offline'));
    expect(dependencies.repository.clear).not.toHaveBeenCalled();
  });

  it('clears a server-rejected refresh session', async () => {
    const dependencies = createDependencies(expiringSession);
    dependencies.api.refresh.mockRejectedValue(new AuthenticationError('invalid_session'));
    await render(
      <AuthenticationProvider {...dependencies}>
        <StatusHarness />
      </AuthenticationProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated:online'),
    );
    expect(dependencies.repository.clear).toHaveBeenCalledTimes(1);
  });

  it('locks the app and clears local credentials when the absolute session expires', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-26T12:00:00Z'));
    const shortSession: SessionTokens = {
      ...activeSession,
      accessExpiresAt: '2026-08-26T12:00:45Z',
      sessionExpiresAt: '2026-08-26T12:01:00Z',
    };
    const dependencies = createDependencies(shortSession);
    let unmount: (() => Promise<void>) | undefined;
    try {
      ({ unmount } = await render(
        <AuthenticationProvider {...dependencies}>
          <StatusHarness />
        </AuthenticationProvider>,
      ));

      await act(async () => Promise.resolve());
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated:online');
      await act(async () => jest.advanceTimersByTimeAsync(60_000));
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated:online');
      expect(dependencies.repository.clear).toHaveBeenCalledTimes(1);
    } finally {
      await unmount?.();
      jest.useRealTimers();
    }
  });

  it('logs in, persists tokens, and reports remote logout failure', async () => {
    const user = userEvent.setup();
    const dependencies = createDependencies(null);
    dependencies.api.login.mockResolvedValue(activeSession);
    dependencies.api.logout.mockRejectedValue(new AuthenticationError('network'));
    function ActionHarness() {
      const authentication = useAuthentication();
      return (
        <>
          <StatusHarness />
          <Pressable
            accessibilityRole="button"
            onPress={() => authentication.login('clinic-owner', 'synthetic-password')}
          >
            <Text>Sign in</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => authentication.logout()}>
            <Text>Sign out</Text>
          </Pressable>
          <Text testID="logout-result">
            {authentication.status === 'unauthenticated' ? 'signed-out' : 'signed-in'}
          </Text>
        </>
      );
    }
    await render(
      <AuthenticationProvider {...dependencies}>
        <ActionHarness />
      </AuthenticationProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated:online'),
    );

    await user.press(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated:online'),
    );
    expect(dependencies.repository.save).toHaveBeenCalledWith(activeSession);

    await user.press(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(screen.getByTestId('logout-result')).toHaveTextContent('signed-out'));
    expect(dependencies.repository.clear).toHaveBeenCalled();
    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated:online');
  });
});
