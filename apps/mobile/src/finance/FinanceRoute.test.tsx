import { render } from '@testing-library/react-native';

import FinanceScreen from '../../app/(tabs)/finance';

const mockAuthentication = {
  isOfflineSession: false,
  session: null as null | { accessToken: string },
};

jest.mock('@/src/auth/AuthenticationContext', () => ({
  useAuthentication: () => mockAuthentication,
}));
jest.mock('@/src/finance/LiveFinanceScreen', () => {
  const { Text: MockText } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    LiveFinanceScreen: ({ accessToken, isOnline }: { accessToken: string; isOnline: boolean }) => (
      <MockText>{`live:${accessToken}:${String(isOnline)}`}</MockText>
    ),
  };
});
jest.mock('@/src/finance/MockFinanceScreen', () => {
  const { Text: MockText } = jest.requireActual<typeof import('react-native')>('react-native');
  return { MockFinanceScreen: () => <MockText>mock-finance</MockText> };
});

describe('Finance route data boundary', () => {
  afterEach(() => {
    mockAuthentication.session = null;
    mockAuthentication.isOfflineSession = false;
  });

  it('keeps labeled demo UI and offers an explicit sign-in path without a session', async () => {
    const view = await render(<FinanceScreen />);
    expect(view.getByText('mock-finance')).toBeTruthy();
    expect(view.getByText('Reviewing demo finance')).toBeTruthy();
    expect(view.getByRole('link', { name: 'Sign in to connected finance' })).toBeTruthy();
  });

  it('switches authenticated online and offline sessions to the production finance boundary', async () => {
    mockAuthentication.session = { accessToken: 'access-token' };
    const online = await render(<FinanceScreen />);
    expect(online.getByText('live:access-token:true')).toBeTruthy();
    await online.unmount();

    mockAuthentication.isOfflineSession = true;
    const offline = await render(<FinanceScreen />);
    expect(offline.getByText('live:access-token:false')).toBeTruthy();
  });
});
