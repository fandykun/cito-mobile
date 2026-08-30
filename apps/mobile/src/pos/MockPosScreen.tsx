import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/design/tokens';
import {
  MockCheckoutConfirmation,
  MockReceiptPreview,
  paymentMethodLabels,
} from '@/src/pos/MockPosCheckout';
import {
  mockPosProducts,
  type MockPaymentMethod,
  type MockPosCartEntry,
  type MockPosProduct,
  type MockPosReceipt,
} from '@/src/pos/mockData';

type CatalogFilter = 'all' | 'medical' | 'retail';

const filters: readonly { accessibilityLabel: string; id: CatalogFilter; label: string }[] = [
  { accessibilityLabel: 'Tampilkan semua produk', id: 'all', label: 'Semua' },
  { accessibilityLabel: 'Tampilkan produk medis', id: 'medical', label: 'Medis' },
  { accessibilityLabel: 'Tampilkan produk ritel', id: 'retail', label: 'Ritel' },
];

const paymentMethods: readonly MockPaymentMethod[] = ['cash', 'qris', 'transfer', 'card'];

const idrFormatter = new Intl.NumberFormat('id-ID');

function formatCurrency(amount: number): string {
  return `Rp ${idrFormatter.format(amount)}`;
}

export function MockPosScreen() {
  const [activeFilter, setActiveFilter] = useState<CatalogFilter>('all');
  const [cart, setCart] = useState<MockPosCartEntry[]>([]);
  const [isReviewingPayment, setIsReviewingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<MockPaymentMethod>('cash');
  const [receipt, setReceipt] = useState<MockPosReceipt | null>(null);
  const [search, setSearch] = useState('');

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('id-ID');
    return mockPosProducts.filter((product) => {
      const matchesFilter = activeFilter === 'all' || product.category === activeFilter;
      const matchesSearch =
        query.length === 0 ||
        product.name.toLocaleLowerCase('id-ID').includes(query) ||
        product.categoryLabel.toLocaleLowerCase('id-ID').includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, search]);

  const total = cart.reduce(
    (sum, entry) => sum + entry.sellingPriceAtTime * entry.quantity,
    0,
  );
  const totalCost = cart.reduce(
    (sum, entry) => sum + entry.costPriceAtTime * entry.quantity,
    0,
  );
  const grossProfit = total - totalCost;

  function addProduct(product: MockPosProduct): void {
    setCart((current) => {
      const existing = current.find((entry) => entry.productId === product.id);
      if (existing) {
        if (existing.quantity >= existing.stockLimit) {
          return current;
        }
        return current.map((entry) =>
          entry.productId === product.id ? { ...entry, quantity: entry.quantity + 1 } : entry,
        );
      }
      if (product.stockLimit <= 0) {
        return current;
      }
      return [
        ...current,
        {
          costPriceAtTime: product.costPrice,
          name: product.name,
          productId: product.id,
          quantity: 1,
          sellingPriceAtTime: product.sellingPrice,
          stockLimit: product.stockLimit,
          unit: product.unit,
        },
      ];
    });
  }

  function decrementProduct(productId: string): void {
    setCart((current) =>
      current.flatMap((entry) => {
        if (entry.productId !== productId) {
          return [entry];
        }
        return entry.quantity === 1 ? [] : [{ ...entry, quantity: entry.quantity - 1 }];
      }),
    );
  }

  function removeProduct(productId: string): void {
    setCart((current) => current.filter((entry) => entry.productId !== productId));
  }

  function resetDiscovery(): void {
    setActiveFilter('all');
    setSearch('');
  }

  function confirmPayment(): void {
    setReceipt({
      items: cart.map((entry) => ({ ...entry })),
      paymentMethod,
      receiptNumber: 'DEMO-RCP-0001',
      timeLabel: '22 Agu 2026 · 14.30 WIB',
      total,
    });
    setIsReviewingPayment(false);
  }

  function startNewSale(): void {
    setActiveFilter('all');
    setCart([]);
    setIsReviewingPayment(false);
    setPaymentMethod('cash');
    setReceipt(null);
    setSearch('');
  }

  if (receipt) {
    return <MockReceiptPreview onNewSale={startNewSale} receipt={receipt} />;
  }

  if (isReviewingPayment) {
    return (
      <MockCheckoutConfirmation
        items={cart}
        onBack={() => setIsReviewingPayment(false)}
        onConfirm={confirmPayment}
        paymentMethod={paymentMethod}
        total={total}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" style={styles.screen}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>Kasir</Text>
          <Text style={styles.subtitle}>Pilih produk untuk penjualan cepat</Text>
        </View>
        <View style={styles.demoBadge}>
          <View style={styles.demoDot} />
          <Text style={styles.demoBadgeText}>Data demo</Text>
        </View>
      </View>

      <View style={styles.notice}>
        <Ionicons color="#9A3412" name="information-circle-outline" size={20} />
        <Text style={styles.noticeText}>
          Katalog dan keranjang ini sintetis. Interaksi tidak mengurangi stok nyata, menyimpan transaksi,
          atau membuat bukti pembayaran.
        </Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons color={colors.mutedForeground} name="search-outline" size={19} />
        <TextInput
          accessibilityLabel="Cari produk kasir"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setSearch}
          placeholder="Cari produk…"
          placeholderTextColor={colors.mutedForeground}
          style={styles.searchInput}
          value={search}
        />
        {search ? (
          <Pressable
            accessibilityLabel="Hapus pencarian produk"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setSearch('')}
          >
            <Ionicons color={colors.mutedForeground} name="close-circle" size={19} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.filterRow}>
        {filters.map((filter) => {
          const selected = activeFilter === filter.id;
          return (
            <Pressable
              accessibilityLabel={filter.accessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={filter.id}
              onPress={() => setActiveFilter(filter.id)}
              style={[styles.filterButton, selected && styles.filterButtonSelected]}
            >
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {visibleProducts.length > 0 ? (
        <View style={styles.productGrid}>
          {visibleProducts.map((product) => {
            const cartEntry = cart.find((entry) => entry.productId === product.id);
            const atLimit = cartEntry?.quantity === product.stockLimit;
            return (
              <Pressable
                accessibilityLabel={`Tambah ${product.name} ke keranjang`}
                accessibilityRole="button"
                disabled={atLimit || product.stockLimit === 0}
                key={product.id}
                onPress={() => addProduct(product)}
                style={({ pressed }) => [
                  styles.productCard,
                  cartEntry && styles.productCardSelected,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.productTitleRow}>
                  <Text style={styles.productName}>{product.name}</Text>
                  {cartEntry ? <Text style={styles.cartBadge}>{cartEntry.quantity}</Text> : null}
                </View>
                <Text style={styles.productPrice}>{formatCurrency(product.sellingPrice)}</Text>
                <Text style={styles.productMeta}>
                  {product.categoryLabel} · {product.unit}
                </Text>
                <Text style={[styles.stockText, product.stockLimit <= 5 && styles.lowStockText]}>
                  Stok demo {product.stockLimit}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons color={colors.mutedForeground} name="search-outline" size={32} />
          <Text style={styles.emptyTitle}>Produk tidak ditemukan</Text>
          <Text style={styles.emptyDescription}>Coba nama, kategori, atau filter yang lain.</Text>
          <Pressable
            accessibilityLabel="Reset pencarian produk"
            accessibilityRole="button"
            onPress={resetDiscovery}
            style={styles.resetButton}
          >
            <Text style={styles.resetButtonText}>Reset pencarian</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.cartCard}>
        <View style={styles.cartHeader}>
          <View>
            <Text style={styles.cartTitle}>Keranjang demo</Text>
            <Text style={styles.cartSubtitle}>{cart.length} jenis produk</Text>
          </View>
          {cart.length > 0 ? (
            <Pressable
              accessibilityLabel="Kosongkan keranjang demo"
              accessibilityRole="button"
              onPress={() => setCart([])}
            >
              <Text style={styles.clearCartText}>Kosongkan</Text>
            </Pressable>
          ) : null}
        </View>

        {cart.length > 0 ? (
          <View style={styles.cartList}>
            {cart.map((entry) => {
              const atLimit = entry.quantity >= entry.stockLimit;
              return (
                <View key={entry.productId} style={styles.cartRow}>
                  <View style={styles.cartIdentity}>
                    <Text style={styles.cartItemName}>{entry.name}</Text>
                    <Text style={styles.cartItemMeta}>
                      {entry.quantity} × {formatCurrency(entry.sellingPriceAtTime)}
                    </Text>
                    {atLimit ? <Text style={styles.limitText}>Batas stok demo tercapai</Text> : null}
                  </View>
                  <View style={styles.quantityControls}>
                    <Pressable
                      accessibilityLabel={`Kurangi jumlah ${entry.name}`}
                      accessibilityRole="button"
                      onPress={() => decrementProduct(entry.productId)}
                      style={styles.quantityButton}
                    >
                      <Ionicons color={colors.foreground} name="remove" size={15} />
                    </Pressable>
                    <Text style={styles.quantityText}>{entry.quantity}</Text>
                    <Pressable
                      accessibilityLabel={`Tambah jumlah ${entry.name}`}
                      accessibilityRole="button"
                      disabled={atLimit}
                      onPress={() => {
                        const product = mockPosProducts.find((item) => item.id === entry.productId);
                        if (product) {
                          addProduct(product);
                        }
                      }}
                      style={[styles.quantityButton, atLimit && styles.quantityButtonDisabled]}
                    >
                      <Ionicons color={colors.foreground} name="add" size={15} />
                    </Pressable>
                    <Pressable
                      accessibilityLabel={`Hapus ${entry.name} dari keranjang`}
                      accessibilityRole="button"
                      onPress={() => removeProduct(entry.productId)}
                      style={styles.removeButton}
                    >
                      <Ionicons color={colors.destructive} name="trash-outline" size={16} />
                    </Pressable>
                  </View>
                </View>
              );
            })}

            <View style={styles.totalCard}>
              <Text style={styles.totalText}>Total {formatCurrency(total)}</Text>
              <Text style={styles.totalMeta}>Modal tersimpan {formatCurrency(totalCost)}</Text>
              <Text style={styles.profitText}>Laba kotor demo {formatCurrency(grossProfit)}</Text>
            </View>
            <View style={styles.paymentSection}>
              <Text style={styles.paymentTitle}>Metode pembayaran demo</Text>
              <View style={styles.paymentMethods}>
                {paymentMethods.map((method) => {
                  const selected = paymentMethod === method;
                  return (
                    <Pressable
                      accessibilityLabel={`Pilih pembayaran ${paymentMethodLabels[method]}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      key={method}
                      onPress={() => setPaymentMethod(method)}
                      style={[styles.paymentButton, selected && styles.paymentButtonSelected]}
                    >
                      <Text style={[styles.paymentButtonText, selected && styles.paymentButtonTextSelected]}>
                        {paymentMethodLabels[method]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable
                accessibilityLabel="Tinjau pembayaran demo"
                accessibilityRole="button"
                onPress={() => setIsReviewingPayment(true)}
                style={({ pressed }) => [styles.checkoutButton, pressed && styles.pressed]}
              >
                <Text style={styles.checkoutButtonText}>Tinjau pembayaran {formatCurrency(total)}</Text>
              </Pressable>
            </View>
            <Text style={styles.nextStepText}>
              Konfirmasi hanya membuat pratinjau struk lokal; PDF dan transaksi produksi belum dibuat.
            </Text>
          </View>
        ) : (
          <View style={styles.emptyCart}>
            <Ionicons color={colors.mutedForeground} name="cart-outline" size={28} />
            <Text style={styles.emptyCartTitle}>Keranjang masih kosong</Text>
            <Text style={styles.emptyCartText}>Ketuk produk untuk membuat draft penjualan lokal.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cartBadge: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    color: colors.primaryForeground,
    fontSize: 10,
    fontWeight: '800',
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 3,
    textAlign: 'center',
  },
  cartCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cartHeader: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.large,
  },
  cartIdentity: { flex: 1 },
  cartItemMeta: { color: colors.mutedForeground, fontSize: typography.caption, marginTop: 2 },
  cartItemName: { color: colors.foreground, fontSize: typography.label, fontWeight: '700' },
  cartList: { gap: spacing.small, padding: spacing.large },
  cartRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.small,
    paddingBottom: spacing.small,
  },
  cartSubtitle: { color: colors.mutedForeground, fontSize: typography.caption, marginTop: 2 },
  cartTitle: { color: colors.foreground, fontSize: typography.body, fontWeight: '800' },
  clearCartText: { color: colors.destructive, fontSize: typography.caption, fontWeight: '700' },
  checkoutButton: {
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: radii.medium,
    padding: spacing.medium,
  },
  checkoutButtonText: { color: colors.primaryForeground, fontSize: typography.label, fontWeight: '800' },
  content: { gap: spacing.large, padding: spacing.xlarge, paddingBottom: spacing.xxlarge },
  demoBadge: {
    alignItems: 'center',
    backgroundColor: '#E6F7F5',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  demoBadgeText: { color: '#0F766E', fontSize: typography.caption, fontWeight: '700' },
  demoDot: { backgroundColor: colors.primary, borderRadius: radii.pill, height: 6, width: 6 },
  emptyCart: { alignItems: 'center', gap: spacing.small, padding: spacing.xxlarge },
  emptyCartText: { color: colors.mutedForeground, fontSize: typography.caption, textAlign: 'center' },
  emptyCartTitle: { color: colors.foreground, fontSize: typography.label, fontWeight: '800' },
  emptyDescription: { color: colors.mutedForeground, fontSize: typography.caption, textAlign: 'center' },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    gap: spacing.small,
    padding: spacing.xxlarge,
  },
  emptyTitle: { color: colors.foreground, fontSize: typography.body, fontWeight: '800' },
  filterButton: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  filterButtonSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterRow: { flexDirection: 'row', gap: spacing.small },
  filterText: { color: colors.mutedForeground, fontSize: typography.caption, fontWeight: '700' },
  filterTextSelected: { color: colors.primaryForeground },
  headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  heading: { color: colors.foreground, fontSize: typography.heading, fontWeight: '800' },
  limitText: { color: '#C2410C', fontSize: 10, fontWeight: '700', marginTop: 2 },
  lowStockText: { color: '#C2410C', fontWeight: '700' },
  nextStepText: { color: colors.mutedForeground, fontSize: typography.caption, lineHeight: 18, textAlign: 'center' },
  notice: {
    alignItems: 'flex-start',
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: radii.large,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.small,
    padding: spacing.medium,
  },
  noticeText: { color: '#9A3412', flex: 1, fontSize: typography.caption, lineHeight: 18 },
  paymentButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.medium,
    borderWidth: 1,
    flexBasis: '46%',
    flexGrow: 1,
    padding: spacing.small,
  },
  paymentButtonSelected: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  paymentButtonText: { color: colors.mutedForeground, fontSize: typography.caption, fontWeight: '700' },
  paymentButtonTextSelected: { color: colors.primaryForeground },
  paymentMethods: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.small },
  paymentSection: { gap: spacing.small },
  paymentTitle: { color: colors.foreground, fontSize: typography.caption, fontWeight: '800' },
  pressed: { opacity: 0.65 },
  productCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    gap: spacing.xsmall,
    minHeight: 112,
    padding: spacing.medium,
  },
  productCardSelected: { backgroundColor: '#F0FDFA', borderColor: '#5EEAD4' },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.small },
  productMeta: { color: colors.mutedForeground, fontSize: 11 },
  productName: { color: colors.foreground, flex: 1, fontSize: typography.label, fontWeight: '700' },
  productPrice: { color: colors.primary, fontSize: typography.caption, fontWeight: '800' },
  productTitleRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.small },
  profitText: { color: '#0F766E', fontSize: typography.caption, fontWeight: '800' },
  quantityButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: radii.medium,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  quantityButtonDisabled: { opacity: 0.35 },
  quantityControls: { alignItems: 'center', flexDirection: 'row', gap: spacing.xsmall },
  quantityText: { color: colors.foreground, fontSize: typography.caption, fontWeight: '800', minWidth: 18, textAlign: 'center' },
  removeButton: { alignItems: 'center', height: 30, justifyContent: 'center', width: 30 },
  resetButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.medium,
    marginTop: spacing.small,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.small,
  },
  resetButtonText: { color: colors.primaryForeground, fontSize: typography.caption, fontWeight: '700' },
  screen: { backgroundColor: colors.background, flex: 1 },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.medium,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.small,
    paddingHorizontal: spacing.medium,
  },
  searchInput: { color: colors.foreground, flex: 1, fontSize: typography.body, paddingVertical: spacing.medium },
  stockText: { color: colors.mutedForeground, fontSize: 10, marginTop: 'auto' },
  subtitle: { color: colors.mutedForeground, fontSize: typography.caption, marginTop: spacing.xsmall },
  totalCard: { backgroundColor: '#E6F7F5', borderRadius: radii.medium, gap: spacing.xsmall, padding: spacing.medium },
  totalMeta: { color: colors.mutedForeground, fontSize: typography.caption },
  totalText: { color: colors.foreground, fontSize: typography.body, fontWeight: '800' },
});
