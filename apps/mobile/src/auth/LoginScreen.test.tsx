import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import LoginScreen from '../../app/login';
import { AuthenticationError, type SessionTokens } from '@/src/auth/api';
import { AuthenticationProvider } from '@/src/auth/AuthenticationContext';

const session: SessionTokens = {
  accessToken: 'a'.repeat(64),
  refreshToken: 'r'.repeat(43),
  accessExpiresAt: '2099-08-26T12:15:00Z',
  sessionExpiresAt: '2099-08-28T12:00:00Z',
};

function dependencies() {
  return {
    api: {
      login: jest.fn<Promise<SessionTokens>, [string, string]>(),
      logout: jest.fn<Promise<void>, [string, string]>(),
      refresh: jest.fn<Promise<SessionTokens>, [string]>(),
    },
    repository: {
      clear: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
      load: jest.fn<Promise<SessionTokens | null>, []>().mockResolvedValue(null),
      save: jest.fn<Promise<void>, [SessionTokens]>().mockResolvedValue(undefined),
    },
  };
}

describe('LoginScreen', () => {
  it('keeps submission disabled until boundary-valid credentials are entered', async () => {
    const services = dependencies();
    await render(
      <AuthenticationProvider {...services}>
        <LoginScreen />
      </AuthenticationProvider>,
    );
    const button = screen.getByRole('button', { name: 'Sign in' });
    expect(button).toBeDisabled();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Username'), 'clinic-owner');
    await user.type(screen.getByLabelText('Password'), 'long-password');
    expect(button).not.toBeDisabled();
  });

  it('submits credentials, persists only returned session tokens, and clears the password field', async () => {
    const services = dependencies();
    services.api.login.mockResolvedValue(session);
    await render(
      <AuthenticationProvider {...services}>
        <LoginScreen />
      </AuthenticationProvider>,
    );
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Username'), ' clinic-owner ');
    await user.type(screen.getByLabelText('Password'), 'synthetic-password');
    await user.press(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() =>
      expect(services.api.login).toHaveBeenCalledWith('clinic-owner', 'synthetic-password'),
    );
    expect(services.repository.save).toHaveBeenCalledWith(session);
    await waitFor(() => expect(screen.getByLabelText('Password')).toHaveProp('value', ''));
  });

  it('shows a safe invalid-credentials message without echoing the password', async () => {
    const services = dependencies();
    services.api.login.mockRejectedValue(new AuthenticationError('invalid_credentials'));
    await render(
      <AuthenticationProvider {...services}>
        <LoginScreen />
      </AuthenticationProvider>,
    );
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Username'), 'clinic-owner');
    await user.type(screen.getByLabelText('Password'), 'sensitive-password');
    await user.press(screen.getByRole('button', { name: 'Sign in' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('The username or password is incorrect.');
    expect(alert).not.toHaveTextContent('sensitive-password');
  });
});
