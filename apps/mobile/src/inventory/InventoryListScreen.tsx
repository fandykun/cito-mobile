import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radii, spacing, typography } from '@/src/design/tokens';
import type { InventoryItem, InventoryListOptions, InventoryPage } from '@/src/inventory/api';

export interface InventoryListClient {
  list(accessToken: string, options?: InventoryListOptions): Promise<InventoryPage>;
}

interface InventoryListScreenProps {
  accessToken: string;
  api: InventoryListClient;
  isOnline: boolean;
}

type ScreenStatus = 'loading' | 'ready' | 'error';

const idrFormatter = new Intl.NumberFormat('id-ID');

export function InventoryListScreen({ accessToken, api, isOnline }: InventoryListScreenProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<ScreenStatus>('loading');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadFirstPage = useCallback(async (): Promise<void> => {
    setStatus('loading');
    try {
      const page = await api.list(accessToken);
      if (!isMounted.current) {
        return;
      }
      setItems(page.items);
      setNextCursor(page.nextCursor);
      setStatus('ready');
    } catch {
      if (isMounted.current) {
        setItems([]);
        setNextCursor(null);
        setStatus('error');
      }
    }
  }, [accessToken, api]);

  useEffect(() => {
    if (!isOnline) {
      return;
    }
    let cancelled = false;
    void api
      .list(accessToken)
      .then((page) => {
        if (!cancelled) {
          setItems(page.items);
          setNextCursor(page.nextCursor);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setNextCursor(null);
          setStatus('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, api, isOnline]);

  async function loadMore(): Promise<void> {
    if (!nextCursor || isLoadingMore) {
      return;
    }
    setIsLoadingMore(true);
    try {
      const page = await api.list(accessToken, { cursor: nextCursor });
      if (!isMounted.current) {
        return;
      }
      setItems((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch {
      if (isMounted.current) {
        setStatus('error');
      }
    } finally {
      if (isMounted.current) {
        setIsLoadingMore(false);
      }
    }
  }

  if (!isOnline) {
    return (
      <View style={styles.centeredState}>
        <Ionicons color={colors.mutedForeground} name="cloud-offline-outline" size={36} />
        <Text style={styles.stateTitle}>Online inventory is unavailable</Text>
        <Text style={styles.stateDescription}>
          Encrypted offline inventory remains disabled until the physical-device storage gate passes.
        </Text>
      </View>
    );
  }

  if (status === 'loading') {
    return (
      <View accessibilityLabel="Loading inventory" style={styles.centeredState}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.stateTitle}>Loading online inventory</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.centeredState}>
        <Ionicons color={colors.destructive} name="alert-circle-outline" size={36} />
        <Text accessibilityRole="alert" style={styles.stateTitle}>
          Inventory could not be loaded.
        </Text>
        <Text style={styles.stateDescription}>Check the clinic server connection and try again.</Text>
        <Pressable
          accessibilityLabel="Retry inventory"
          accessibilityRole="button"
          onPress={() => void loadFirstPage()}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.centeredState}>
        <Ionicons color={colors.primary} name="cube-outline" size={36} />
        <Text style={styles.stateTitle}>No inventory items yet</Text>
        <Text style={styles.stateDescription}>
          This view only shows records returned by the clinic API. Create and offline actions are not enabled yet.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.summaryRow}>
        <View>
          <Text style={styles.eyebrow}>ONLINE INVENTORY</Text>
          <Text style={styles.heading}>{items.length} items loaded</Text>
        </View>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Server data</Text>
        </View>
      </View>

      <View style={styles.list}>
        {items.map((item) => (
          <InventoryCard item={item} key={item.id} />
        ))}
      </View>

      {nextCursor ? (
        <Pressable
          accessibilityLabel="Load more inventory"
          accessibilityRole="button"
          disabled={isLoadingMore}
          onPress={() => void loadMore()}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
            isLoadingMore && styles.disabled,
          ]}
        >
          {isLoadingMore ? <ActivityIndicator color={colors.primary} /> : null}
          <Text style={styles.secondaryButtonText}>{isLoadingMore ? 'Loading…' : 'Load more'}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function InventoryCard({ item }: { item: InventoryItem }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleGroup}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemMeta}>
            {item.category === 'medical' ? 'Medical' : 'Retail'} · {item.unit}
          </Text>
        </View>
        {item.isLowStock ? (
          <View style={styles.lowStockBadge}>
            <Text style={styles.lowStockText}>Low stock</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.stockRow}>
        <View>
          <Text style={styles.metricLabel}>In stock</Text>
          <Text style={styles.stockValue}>{item.stockQuantity}</Text>
        </View>
        <View style={styles.priceGroup}>
          <Text style={styles.metricLabel}>Selling price</Text>
          <Text style={styles.priceValue}>Rp {idrFormatter.format(item.sellingPrice)}</Text>
        </View>
      </View>

      <Text style={styles.detailText}>Low-stock threshold: {item.lowStockThreshold}</Text>
      {item.expiryDate ? <Text style={styles.detailText}>Expiry: {item.expiryDate}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    gap: spacing.medium,
    padding: spacing.large,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.medium,
    justifyContent: 'space-between',
  },
  cardTitleGroup: {
    flex: 1,
  },
  centeredState: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.medium,
    justifyContent: 'center',
    padding: spacing.xxlarge,
  },
  content: {
    gap: spacing.xlarge,
    padding: spacing.xlarge,
  },
  detailText: {
    color: colors.mutedForeground,
    fontSize: typography.caption,
  },
  disabled: {
    opacity: 0.6,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  heading: {
    color: colors.foreground,
    fontSize: typography.heading,
    fontWeight: '800',
    marginTop: spacing.xsmall,
  },
  itemMeta: {
    color: colors.mutedForeground,
    fontSize: typography.caption,
    marginTop: spacing.xsmall,
  },
  itemName: {
    color: colors.foreground,
    fontSize: typography.body,
    fontWeight: '700',
  },
  list: {
    gap: spacing.medium,
  },
  lowStockBadge: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.xsmall,
  },
  lowStockText: {
    color: '#9A3412',
    fontSize: typography.caption,
    fontWeight: '700',
  },
  metricLabel: {
    color: colors.mutedForeground,
    fontSize: typography.caption,
  },
  onlineBadge: {
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: spacing.xsmall,
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.xsmall,
  },
  onlineDot: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    height: 7,
    width: 7,
  },
  onlineText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
  priceGroup: {
    alignItems: 'flex-end',
  },
  priceValue: {
    color: colors.foreground,
    fontSize: typography.body,
    fontWeight: '700',
    marginTop: spacing.xsmall,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.medium,
    paddingHorizontal: spacing.xlarge,
    paddingVertical: spacing.medium,
  },
  primaryButtonText: {
    color: colors.primaryForeground,
    fontSize: typography.label,
    fontWeight: '700',
  },
  screen: {
    backgroundColor: colors.background,
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: radii.medium,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.small,
    justifyContent: 'center',
    padding: spacing.medium,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: typography.label,
    fontWeight: '700',
  },
  stateDescription: {
    color: colors.mutedForeground,
    fontSize: typography.body,
    lineHeight: 22,
    maxWidth: 420,
    textAlign: 'center',
  },
  stateTitle: {
    color: colors.foreground,
    fontSize: typography.heading,
    fontWeight: '800',
    textAlign: 'center',
  },
  stockRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stockValue: {
    color: colors.primary,
    fontSize: typography.title,
    fontWeight: '800',
    marginTop: spacing.xsmall,
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
