import { useAuthentication } from '@/src/auth/AuthenticationContext';
import { appEnvironment } from '@/src/config/env';
import { InventoryApi } from '@/src/inventory/api';
import { InventoryListScreen } from '@/src/inventory/InventoryListScreen';
import { MockInventoryScreen } from '@/src/inventory/MockInventoryScreen';

const inventoryApi = new InventoryApi(appEnvironment.apiUrl);

export default function InventoryScreen() {
  const authentication = useAuthentication();
  if (!authentication.session) {
    return <MockInventoryScreen />;
  }
  return (
    <InventoryListScreen
      accessToken={authentication.session.accessToken}
      api={inventoryApi}
      isOnline={!authentication.isOfflineSession}
    />
  );
}
