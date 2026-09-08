import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

import { EditorScreen } from '@/src/components/EditorScreen';

describe('EditorScreen', () => {
  it('renders a full-screen editor with a fixed header and footer', async () => {
    const onCancel = jest.fn();
    const user = userEvent.setup();
    await render(
      <EditorScreen
        backLabel="Back to list"
        error="Name is required"
        footer={<Text>Save locally</Text>}
        onCancel={onCancel}
        title="Edit demo item"
      >
        <Text>Editable fields</Text>
      </EditorScreen>,
    );

    expect(screen.getByRole('header', { name: 'Edit demo item' })).toBeOnTheScreen();
    expect(screen.getByText('Data demo')).toBeOnTheScreen();
    expect(screen.getByText('Editable fields')).toBeOnTheScreen();
    expect(screen.getByText('Save locally')).toBeOnTheScreen();
    expect(screen.getByRole('alert')).toHaveTextContent('Name is required');
    expect(screen.getByTestId('editor-modal')).toHaveProp('presentationStyle', 'fullScreen');
    await user.press(screen.getByRole('button', { name: 'Back to list' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    await fireEvent(screen.getByTestId('editor-modal'), 'requestClose');
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});
