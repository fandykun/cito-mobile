import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/design/tokens';
import {
  MockInventoryForm,
  type MockInventoryFormValues,
} from '@/src/inventory/MockInventoryForm';
import { mockInventoryItems, type MockInventoryItem } from '@/src/inventory/mockData';
import {
  MockStockAdjustmentForm,
  type MockStockAdjustmentValues,
} from '@/src/inventory/MockStockAdjustmentForm';

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
  const [adjustmentItem, setAdjustmentItem] = useState<MockInventoryItem | null>(null);
  const [adjustments, setAdjustments] = useState<Record<string, MockStockAdjustmentValues>>({});
  const [editorItem, setEditorItem] = useState<MockInventoryItem | 'new' | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [items, setItems] = useState<MockInventoryItem[]>(() => [...mockInventoryItems]);
  const [search, setSearch] = useState('');

  const visibleItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('id-ID');
    return items.filter((item) => {
      const matchesQuery =
        query.length === 0 ||
        item.name.toLocaleLowerCase('id-ID').includes(query) ||
        item.categoryLabel.toLocaleLowerCase('id-ID').includes(query);
      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'low' ? isLowStock(item) : item.category === activeFilter);
      return matchesQuery && matchesFilter;
    });
  }, [activeFilter, items, search]);

  function resetFilters(): void {
    setActiveFilter('all');
    setExpandedItemId(null);
    setSearch('');
  }

  function saveItem(values: MockInventoryFormValues): void {
    if (editorItem === 'new') {
      const newItem: MockInventoryItem = {
        ...values,
        id: `demo-local-${items.length + 1}`,
      };
      setItems((current) => [newItem, ...current]);
      setExpandedItemId(newItem.id);
    } else if (editorItem) {
      setItems((current) =>
        current.map((item) => (item.id === editorItem.id ? { ...values, id: item.id } : item)),
      );
      setExpandedItemId(editorItem.id);
    }
    setActiveFilter('all');
    setSearch('');
    setEditorItem(null);
  }

  function saveAdjustment(values: MockStockAdjustmentValues): void {
    if (!adjustmentItem) {
      return;
    }
    const itemId = adjustmentItem.id;
    setItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, stockQuantity: item.stockQuantity + values.delta } : item,
      ),
    );
    setAdjustments((current) => ({ ...current, [itemId]: values }));
    setExpandedItemId(itemId);
    setAdjustmentItem(null);
  }

  if (editorItem) {
    return (
      <MockInventoryForm
        {...(editorItem === 'new' ? {} : { initialItem: editorItem })}
        onCancel={() => setEditorItem(null)}
        onSave={saveItem}
      />
    );
  }

  if (adjustmentItem) {
    return (
      <MockStockAdjustmentForm
        item={adjustmentItem}
        onCancel={() => setAdjustmentItem(null)}
        onSave={saveAdjustment}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" style={styles.screen}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>Inventaris</Text>
          <Text style={styles.itemCount}>{visibleItems.length} item ditampilkan</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.demoBadge}>
            <View style={styles.demoDot} />
            <Text style={styles.demoBadgeText}>Data demo</Text>
          </View>
          <Pressable
            accessibilityLabel="Tambah item demo"
            accessibilityRole="button"
            onPress={() => setEditorItem('new')}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <Ionicons color={colors.primaryForeground} name="add" size={18} />
          </Pressable>
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
              {...(adjustments[item.id] ? { adjustment: adjustments[item.id] } : {})}
              expanded={expandedItemId === item.id}
              item={item}
              key={item.id}
              onAdjust={() => setAdjustmentItem(item)}
              onEdit={() => setEditorItem(item)}
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
  adjustment,
  expanded,
  item,
  onAdjust,
  onEdit,
  onToggle,
  showDivider,
}: {
  adjustment?: MockStockAdjustmentValues;
  expanded: boolean;
  item: MockInventoryItem;
  onAdjust: () => void;
  onEdit: () => void;
  onToggle: () => void;
  showDivider: boolean;
}) {
  const lowStock = isLowStock(item);
  const critical = item.stockQuantity <= Math.ceil(item.lowStockThreshold * 0.3);
  const stockRatio = Math.min(item.stockQuantity / Math.max(item.lowStockThreshold * 2, 1), 1);

  return (
    <View style={showDivider ? styles.rowDivider : undefined}>
      <View style={styles.cardHeader}>
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
        <Pressable
          accessibilityLabel={`Edit ${item.name}`}
          accessibilityRole="button"
          onPress={onEdit}
          style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
        >
          <Ionicons color={colors.primary} name="create-outline" size={18} />
        </Pressable>
      </View>

      {expanded ? (
        <View style={styles.details}>
          <Detail label="Harga modal" value={`Rp ${idrFormatter.format(item.costPrice)}`} />
          <Detail label="Pemasok" value={item.supplier} />
          <Detail
            label="Kedaluwarsa"
            value={item.expiryLabel ? `Kedaluwarsa ${item.expiryLabel}` : 'Tidak ada'}
          />
          {adjustment ? (
            <View style={styles.adjustmentAudit}>
              <Text style={styles.adjustmentAuditLabel}>Penyesuaian lokal terakhir</Text>
              <Text style={styles.adjustmentAuditValue}>
                {adjustment.reasonLabel} · {adjustment.delta > 0 ? '+' : ''}
                {adjustment.delta} {item.unit}
              </Text>
              {adjustment.note ? <Text style={styles.adjustmentAuditNote}>{adjustment.note}</Text> : null}
            </View>
          ) : null}
          <View style={styles.detailActions}>
            <Pressable
              accessibilityLabel={`Sesuaikan stok ${item.name}`}
              accessibilityRole="button"
              onPress={onAdjust}
              style={({ pressed }) => [styles.detailActionButton, pressed && styles.pressed]}
            >
              <Ionicons color={colors.primary} name="swap-vertical-outline" size={16} />
              <Text style={styles.detailActionText}>Sesuaikan stok</Text>
            </Pressable>
          </View>
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
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.small,
    padding: spacing.large,
  },
  editButton: {
    alignItems: 'center',
    borderRadius: radii.medium,
    flexShrink: 0,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.medium,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
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
  adjustmentAudit: {
    backgroundColor: '#E6F7F5',
    borderRadius: radii.medium,
    padding: spacing.medium,
    width: '100%',
  },
  adjustmentAuditLabel: {
    color: '#0F766E',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  adjustmentAuditNote: {
    color: colors.mutedForeground,
    fontSize: typography.caption,
    marginTop: spacing.xsmall,
  },
  adjustmentAuditValue: {
    color: colors.foreground,
    fontSize: typography.label,
    fontWeight: '800',
    marginTop: spacing.xsmall,
  },
  detailActionButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.medium,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.small,
    justifyContent: 'center',
    padding: spacing.small,
  },
  detailActions: {
    flexDirection: 'row',
    gap: spacing.small,
    marginTop: spacing.xsmall,
    width: '100%',
  },
  detailActionText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
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
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.small,
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
    flex: 1,
    minWidth: 0,
    minHeight: 44,
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
    flexWrap: 'wrap',
    gap: spacing.xsmall,
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
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 140,
    minWidth: 0,
  },
  itemTitleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.small,
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
