import { render, screen } from '@testing-library/react-native';

import DashboardScreen from '../../app/(tabs)';

describe('DashboardScreen', () => {
  it('renders as the homepage without an authentication provider', async () => {
    await render(<DashboardScreen />);

    expect(screen.getByText('Foundation shell ready')).toBeOnTheScreen();
    expect(screen.getByText(/dashboard is the development homepage/i)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeOnTheScreen();
  });
});
