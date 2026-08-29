import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/design/tokens';
import { mockInventoryItems, type MockInventoryItem } from '@/src/inventory/mockData';

type InventoryFilter = 'all' | 'medical' | 'retail' | 'low';

const filters: readonly { accessibilityLabel: string; id: InventoryFilter; label: string }[] = [
  { accessibilityLabel: 'Tampilkan semua inventaris', id: 'all', label: 'Semua' },
  { accessibilityLabel: 'Tampilkan inventaris medis', id: 'medical', label: 'Medis' },
  { accessibilityLabel: 'Tampilkan inventaris ritel', id: 'retail', label: 'Ritel' },
  { accessibilityLabel: 'Tampilkan stok menipis', id: 'low', label: 'Stok menipis' },
];

const idrFormatter = new Intl.NumberFormat('id-ID');

function isLowStock(item: MockInventoryItem): boolean {
  return item.stockQuantity <= item.lowStockThreshold;
}

export function MockInventoryScreen() {
  const [activeFilter, setActiveFilter] = useState<InventoryFilter>('all');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const visibleItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('id-ID');
    return mockInventoryItems.filter((item) => {
      const matchesQuery =
        query.length === 0 ||
        item.name.toLocaleLowerCase('id-ID').includes(query) ||
        item.categoryLabel.toLocaleLowerCase('id-ID').includes(query);
      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'low' ? isLowStock(item) : item.category === activeFilter);
      return matchesQuery && matchesFilter;
    });
  }, [activeFilter, search]);

  function resetFilters(): void {
    setActiveFilter('all');
    setExpandedItemId(null);
    setSearch('');
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" style={styles.screen}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>Inventaris</Text>
          <Text style={styles.itemCount}>{visibleItems.length} item ditampilkan</Text>
        </View>
        <View style={styles.demoBadge}>
          <View style={styles.demoDot} />
          <Text style={styles.demoBadgeText}>Data demo</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons color={colors.mutedForeground} name="search-outline" size={19} />
        <TextInput
          accessibilityLabel="Cari inventaris"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setSearch}
          placeholder="Cari item atau kategori…"
          placeholderTextColor={colors.mutedForeground}
          style={styles.searchInput}
          value={search}
        />
        {search ? (
          <Pressable
            accessibilityLabel="Hapus pencarian inventaris"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setSearch('')}
          >
            <Ionicons color={colors.mutedForeground} name="close-circle" size={19} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.filterContent}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {filters.map((filter) => {
          const isActive = activeFilter === filter.id;
          return (
            <Pressable
              accessibilityLabel={filter.accessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              key={filter.id}
              onPress={() => {
                setActiveFilter(filter.id);
                setExpandedItemId(null);
              }}
              style={({ pressed }) => [
                styles.filterChip,
                isActive && styles.filterChipActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {visibleItems.length > 0 ? (
        <View style={styles.listCard}>
          {visibleItems.map((item, index) => (
            <InventoryRow
              expanded={expandedItemId === item.id}
              item={item}
              key={item.id}
              onToggle={() => setExpandedItemId((current) => (current === item.id ? null : item.id))}
              showDivider={index > 0}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons color={colors.mutedForeground} name="search-outline" size={32} />
          <Text style={styles.emptyTitle}>Item tidak ditemukan</Text>
          <Text style={styles.emptyDescription}>Coba kata kunci atau filter inventaris yang lain.</Text>
          <Pressable
            accessibilityLabel="Reset filter inventaris"
            accessibilityRole="button"
            onPress={resetFilters}
            style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
          >
            <Text style={styles.resetButtonText}>Reset filter</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.disclaimer}>
        Inventaris demo ini belum terhubung ke penyimpanan terenkripsi, API, atau sinkronisasi. Perubahan
        tidak disimpan.
      </Text>
    </ScrollView>
  );
}

function InventoryRow({
  expanded,
  item,
  onToggle,
  showDivider,
}: {
  expanded: boolean;
  item: MockInventoryItem;
  onToggle: () => void;
  showDivider: boolean;
}) {
  const lowStock = isLowStock(item);
  const critical = item.stockQuantity <= Math.ceil(item.lowStockThreshold * 0.3);
  const stockRatio = Math.min(item.stockQuantity / Math.max(item.lowStockThreshold * 2, 1), 1);

  return (
    <View style={showDivider ? styles.rowDivider : undefined}>
      <Pressable
        accessibilityLabel={`${expanded ? 'Tutup' : 'Lihat'} detail ${item.name}`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed }) => [styles.itemButton, pressed && styles.pressed]}
      >
        <View style={styles.itemTitleRow}>
          <View style={styles.itemTitleGroup}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemCategory}>
              {item.categoryLabel} · {item.category === 'medical' ? 'Medis' : 'Ritel'}
            </Text>
          </View>
          <View
            style={[
              styles.stockBadge,
              lowStock && styles.stockBadgeLow,
              critical && styles.stockBadgeCritical,
            ]}
          >
            <Text
              style={[
                styles.stockBadgeText,
                lowStock && styles.stockBadgeTextLow,
                critical && styles.stockBadgeTextCritical,
              ]}
            >
              {item.stockQuantity} {item.unit}
            </Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              lowStock && styles.progressFillLow,
              critical && styles.progressFillCritical,
              { flex: Math.max(stockRatio * 100, 2) },
            ]}
          />
          <View style={{ flex: Math.max((1 - stockRatio) * 100, 0) }} />
        </View>

        <View style={styles.itemFooter}>
          <Text style={styles.itemMeta}>
            batas {item.lowStockThreshold} {item.unit}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.itemMeta}>Rp {idrFormatter.format(item.sellingPrice)}/{item.unit}</Text>
            <Ionicons
              color={colors.mutedForeground}
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
            />
          </View>
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.details}>
          <Detail label="Harga modal" value={`Rp ${idrFormatter.format(item.costPrice)}`} />
          <Detail label="Pemasok" value={item.supplier} />
          <Detail
            label="Kedaluwarsa"
            value={item.expiryLabel ? `Kedaluwarsa ${item.expiryLabel}` : 'Tidak ada'}
          />
        </View>
      ) : null}
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.large,
    padding: spacing.xlarge,
    paddingBottom: spacing.xxlarge,
  },
  demoBadge: {
    alignItems: 'center',
    backgroundColor: '#E6F7F5',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  demoBadgeText: {
    color: '#0F766E',
    fontSize: typography.caption,
    fontWeight: '700',
  },
  demoDot: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    height: 6,
    width: 6,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
  },
  detailLabel: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  details: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.medium,
    padding: spacing.large,
  },
  detailValue: {
    color: colors.foreground,
    fontSize: typography.caption,
    fontWeight: '700',
    marginTop: spacing.xsmall,
  },
  disclaimer: {
    color: colors.mutedForeground,
    fontSize: typography.caption,
    lineHeight: 18,
    textAlign: 'center',
  },
  emptyDescription: {
    color: colors.mutedForeground,
    fontSize: typography.caption,
    lineHeight: 18,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    gap: spacing.small,
    padding: spacing.xxlarge,
  },
  emptyTitle: {
    color: colors.foreground,
    fontSize: typography.body,
    fontWeight: '800',
  },
  filterChip: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterContent: {
    gap: spacing.small,
  },
  filterText: {
    color: colors.mutedForeground,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  filterTextActive: {
    color: colors.primaryForeground,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heading: {
    color: colors.foreground,
    fontSize: typography.heading,
    fontWeight: '800',
  },
  itemButton: {
    padding: spacing.large,
  },
  itemCategory: {
    color: colors.mutedForeground,
    fontSize: typography.caption,
    marginTop: spacing.xsmall,
  },
  itemCount: {
    color: colors.mutedForeground,
    fontSize: typography.caption,
    marginTop: spacing.xsmall,
  },
  itemFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.small,
  },
  itemMeta: {
    color: colors.mutedForeground,
    fontSize: typography.caption,
  },
  itemName: {
    color: colors.foreground,
    fontSize: typography.label,
    fontWeight: '700',
  },
  itemTitleGroup: {
    flex: 1,
    marginRight: spacing.medium,
  },
  itemTitleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.65,
  },
  priceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xsmall,
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
  },
  progressFillCritical: {
    backgroundColor: colors.destructive,
  },
  progressFillLow: {
    backgroundColor: '#FB923C',
  },
  progressTrack: {
    backgroundColor: colors.muted,
    borderRadius: radii.pill,
    flexDirection: 'row',
    height: 5,
    marginTop: spacing.medium,
    overflow: 'hidden',
  },
  resetButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.medium,
    marginTop: spacing.small,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.small,
  },
  resetButtonText: {
    color: colors.primaryForeground,
    fontSize: typography.label,
    fontWeight: '700',
  },
  rowDivider: {
    borderColor: colors.border,
    borderTopWidth: 1,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.small,
    paddingHorizontal: spacing.medium,
  },
  searchInput: {
    color: colors.foreground,
    flex: 1,
    fontSize: typography.body,
    paddingVertical: spacing.medium,
  },
  stockBadge: {
    backgroundColor: '#E6F7F5',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stockBadgeCritical: {
    backgroundColor: '#FEE2E2',
  },
  stockBadgeLow: {
    backgroundColor: '#FFF7ED',
  },
  stockBadgeText: {
    color: '#0F766E',
    fontSize: typography.caption,
    fontWeight: '800',
  },
  stockBadgeTextCritical: {
    color: colors.destructive,
  },
  stockBadgeTextLow: {
    color: '#C2410C',
  },
});
