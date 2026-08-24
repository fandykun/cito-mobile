import { render } from '@testing-library/react-native';

import { ModulePlaceholder } from '@/src/components/ModulePlaceholder';

describe('ModulePlaceholder', () => {
  it('renders a module title and foundation status without mock records', async () => {
    const view = await render(
      <ModulePlaceholder
        description="This module will be implemented in a later verified slice."
        icon="cube-outline"
        title="Inventory"
      />,
    );

    expect(view.getByText('Inventory')).toBeOnTheScreen();
    expect(view.getByText('Foundation shell')).toBeOnTheScreen();
    expect(view.queryByText(/patient|sale|income/i)).not.toBeOnTheScreen();
  });
});
