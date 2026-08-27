import { useAuthentication } from '@/src/auth/AuthenticationContext';
import { ModulePlaceholder } from '@/src/components/ModulePlaceholder';
import { appEnvironment } from '@/src/config/env';
import { InventoryApi } from '@/src/inventory/api';
import { InventoryListScreen } from '@/src/inventory/InventoryListScreen';

const inventoryApi = new InventoryApi(appEnvironment.apiUrl);

export default function InventoryScreen() {
  const authentication = useAuthentication();
  if (!authentication.session) {
    return (
      <ModulePlaceholder
        description="The online inventory API still requires a secure session. Inventory UI development can continue here after local encrypted persistence is available."
        icon="cube-outline"
        title="Inventaris"
      />
    );
  }
  return (
    <InventoryListScreen
      accessToken={authentication.session.accessToken}
      api={inventoryApi}
      isOnline={!authentication.isOfflineSession}
    />
  );
}
