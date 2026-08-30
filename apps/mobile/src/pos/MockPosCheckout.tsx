import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/design/tokens';
import type {
  MockPaymentMethod,
  MockPosCartEntry,
  MockPosReceipt,
} from '@/src/pos/mockData';

const idrFormatter = new Intl.NumberFormat('id-ID');

export const paymentMethodLabels: Record<MockPaymentMethod, string> = {
  card: 'Kartu',
  cash: 'Tunai',
  qris: 'QRIS',
  transfer: 'Transfer',
};

function formatCurrency(amount: number): string {
  return `Rp ${idrFormatter.format(amount)}`;
}

export function MockCheckoutConfirmation({
  items,
  onBack,
  onConfirm,
  paymentMethod,
  total,
}: {
  items: readonly MockPosCartEntry[];
  onBack: () => void;
  onConfirm: () => void;
  paymentMethod: MockPaymentMethod;
  total: number;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Kembali ke keranjang demo"
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backButton}
        >
          <Ionicons color={colors.foreground} name="arrow-back" size={20} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.heading}>Konfirmasi pembayaran</Text>
          <Text style={styles.subtitle}>Periksa draft sebelum konfirmasi</Text>
        </View>
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>Demo</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Item</Text>
        {items.map((item) => (
          <View key={item.productId} style={styles.itemRow}>
            <View style={styles.itemIdentity}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>
                {item.quantity} × {formatCurrency(item.sellingPriceAtTime)}
              </Text>
            </View>
            <Text style={styles.itemSubtotal}>
              {formatCurrency(item.quantity * item.sellingPriceAtTime)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Metode</Text>
          <Text style={styles.summaryValue}>Metode {paymentMethodLabels[paymentMethod]}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>Total {formatCurrency(total)}</Text>
        </View>
      </View>

      <View style={styles.notice}>
        <Ionicons color="#9A3412" name="warning-outline" size={20} />
        <Text style={styles.noticeText}>
          Konfirmasi demo belum menyimpan transaksi, mengurangi stok, menerima pembayaran, membuat PDF,
          atau mengirim data untuk sinkronisasi.
        </Text>
      </View>

      <Pressable
        accessibilityLabel="Konfirmasi pembayaran demo"
        accessibilityRole="button"
        onPress={onConfirm}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
      >
        <Text style={styles.primaryButtonText}>Konfirmasi demo</Text>
      </Pressable>
    </ScrollView>
  );
}

export function MockReceiptPreview({
  onNewSale,
  receipt,
}: {
  onNewSale: () => void;
  receipt: MockPosReceipt;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.successHeader}>
        <View style={styles.successIcon}>
          <Ionicons color={colors.primary} name="checkmark" size={32} />
        </View>
        <Text style={styles.heading}>Struk demo</Text>
        <Text style={styles.subtitle}>Pratinjau lokal berhasil dibuat</Text>
      </View>

      <View style={styles.receiptCard}>
        <View style={styles.receiptHeader}>
          <Text style={styles.clinicName}>Cito Petcare</Text>
          <Text style={styles.receiptNumber}>{receipt.receiptNumber}</Text>
          <Text style={styles.receiptMeta}>Waktu demo {receipt.timeLabel}</Text>
        </View>

        <View style={styles.receiptItems}>
          {receipt.items.map((item) => (
            <View key={item.productId} style={styles.receiptItem}>
              <View style={styles.itemIdentity}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>
                  {item.quantity} × {formatCurrency(item.sellingPriceAtTime)}
                </Text>
              </View>
              <Text style={styles.itemSubtotal}>
                {formatCurrency(item.quantity * item.sellingPriceAtTime)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.receiptFooter}>
          <Text style={styles.receiptPayment}>
            Metode pembayaran {paymentMethodLabels[receipt.paymentMethod]}
          </Text>
          <Text style={styles.receiptTotal}>Total dibayar {formatCurrency(receipt.total)}</Text>
        </View>
      </View>

      <View style={styles.notice}>
        <Ionicons color="#9A3412" name="document-outline" size={20} />
        <Text style={styles.noticeText}>
          Ini hanya pratinjau sintetis; tidak ada file PDF yang dibuat, disimpan, dibagikan, atau dicetak.
          Tidak ada pembayaran, transaksi, perubahan stok, audit, atau sinkronisasi.
        </Text>
      </View>

      <Pressable
        accessibilityLabel="Mulai penjualan demo baru"
        accessibilityRole="button"
        onPress={onNewSale}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
      >
        <Text style={styles.primaryButtonText}>Penjualan demo baru</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.medium,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    gap: spacing.small,
    padding: spacing.large,
  },
  clinicName: { color: colors.foreground, fontSize: typography.heading, fontWeight: '800' },
  content: { gap: spacing.large, padding: spacing.xlarge, paddingBottom: spacing.xxlarge },
  demoBadge: {
    backgroundColor: '#E6F7F5',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  demoBadgeText: { color: '#0F766E', fontSize: typography.caption, fontWeight: '700' },
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.medium },
  headerText: { flex: 1 },
  heading: { color: colors.foreground, fontSize: typography.heading, fontWeight: '800' },
  itemIdentity: { flex: 1 },
  itemMeta: { color: colors.mutedForeground, fontSize: typography.caption, marginTop: 2 },
  itemName: { color: colors.foreground, fontSize: typography.label, fontWeight: '700' },
  itemRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.small,
    paddingBottom: spacing.small,
  },
  itemSubtotal: { color: colors.foreground, fontSize: typography.caption, fontWeight: '800' },
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
  pressed: { opacity: 0.65 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: radii.medium,
    padding: spacing.large,
  },
  primaryButtonText: { color: colors.primaryForeground, fontSize: typography.label, fontWeight: '800' },
  receiptCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    overflow: 'hidden',
  },
  receiptFooter: {
    backgroundColor: colors.secondary,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.small,
    padding: spacing.large,
  },
  receiptHeader: { alignItems: 'center', gap: spacing.xsmall, padding: spacing.xlarge },
  receiptItem: { alignItems: 'center', flexDirection: 'row', gap: spacing.small },
  receiptItems: { gap: spacing.medium, padding: spacing.large },
  receiptMeta: { color: colors.mutedForeground, fontSize: typography.caption },
  receiptNumber: { color: colors.primary, fontSize: typography.label, fontWeight: '800' },
  receiptPayment: { color: colors.mutedForeground, fontSize: typography.caption },
  receiptTotal: { color: colors.foreground, fontSize: typography.body, fontWeight: '800' },
  screen: { backgroundColor: colors.background, flex: 1 },
  sectionLabel: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  subtitle: { color: colors.mutedForeground, fontSize: typography.caption, marginTop: spacing.xsmall },
  successHeader: { alignItems: 'center', gap: spacing.xsmall },
  successIcon: {
    alignItems: 'center',
    backgroundColor: '#E6F7F5',
    borderRadius: radii.pill,
    height: 64,
    justifyContent: 'center',
    marginBottom: spacing.small,
    width: 64,
  },
  summaryCard: {
    backgroundColor: '#E6F7F5',
    borderColor: '#99E2DB',
    borderRadius: radii.large,
    borderWidth: 1,
    gap: spacing.medium,
    padding: spacing.large,
  },
  summaryLabel: { color: colors.mutedForeground, fontSize: typography.caption },
  summaryRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  summaryValue: { color: colors.foreground, fontSize: typography.label, fontWeight: '700' },
  totalLabel: { color: colors.foreground, fontSize: typography.body, fontWeight: '800' },
  totalValue: { color: colors.foreground, fontSize: typography.body, fontWeight: '800' },
});
