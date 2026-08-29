import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/design/tokens';
import {
  mockPatients,
  type MockPatient,
  type MockPatientSpecies,
  type MockVaccinationStatus,
} from '@/src/records/mockData';

type RecordsFilter = 'all' | 'attention';

const filters: readonly { accessibilityLabel: string; id: RecordsFilter; label: string }[] = [
  { accessibilityLabel: 'Tampilkan semua pasien', id: 'all', label: 'Semua pasien' },
  {
    accessibilityLabel: 'Tampilkan pasien perlu perhatian',
    id: 'attention',
    label: 'Perlu perhatian',
  },
];

const speciesPresentation: Record<MockPatientSpecies, { icon: 'paw-outline'; label: string }> = {
  cat: { icon: 'paw-outline', label: 'Kucing' },
  dog: { icon: 'paw-outline', label: 'Anjing' },
  rabbit: { icon: 'paw-outline', label: 'Kelinci' },
};

const vaccinationPresentation: Record<
  MockVaccinationStatus,
  { backgroundColor: string; color: string; label: string }
> = {
  current: { backgroundColor: '#E6F7F5', color: '#0F766E', label: 'Aktif' },
  'due-soon': { backgroundColor: '#FFF7ED', color: '#C2410C', label: 'Segera jatuh tempo' },
  overdue: { backgroundColor: '#FEE2E2', color: colors.destructive, label: 'Terlambat' },
};

function needsAttention(patient: MockPatient): boolean {
  return (
    patient.allergies.length > 0 ||
    patient.chronicConditions.length > 0 ||
    patient.vaccinations.some((vaccination) => vaccination.status !== 'current')
  );
}

function formatWeight(kilograms: number): string {
  return `${kilograms.toLocaleString('id-ID', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} kg`;
}

export function MockRecordsScreen() {
  const [activeFilter, setActiveFilter] = useState<RecordsFilter>('all');
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const visiblePatients = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('id-ID');
    return mockPatients.filter((patient) => {
      const matchesQuery =
        query.length === 0 ||
        patient.name.toLocaleLowerCase('id-ID').includes(query) ||
        patient.owner.name.toLocaleLowerCase('id-ID').includes(query);
      const matchesFilter = activeFilter === 'all' || needsAttention(patient);
      return matchesQuery && matchesFilter;
    });
  }, [activeFilter, search]);

  function resetDiscovery(): void {
    setActiveFilter('all');
    setExpandedPatientId(null);
    setSearch('');
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" style={styles.screen}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>Rekam Medis</Text>
          <Text style={styles.patientCount}>{visiblePatients.length} pasien ditampilkan</Text>
        </View>
        <View style={styles.demoBadge}>
          <View style={styles.demoDot} />
          <Text style={styles.demoBadgeText}>Data demo</Text>
        </View>
      </View>

      <View style={styles.safetyNotice}>
        <Ionicons color="#9A3412" name="shield-checkmark-outline" size={20} />
        <Text style={styles.safetyNoticeText}>
          Semua nama dan detail di layar ini sintetis, bukan rekam medis nyata. Data belum disimpan dalam
          basis data terenkripsi.
        </Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons color={colors.mutedForeground} name="search-outline" size={19} />
        <TextInput
          accessibilityLabel="Cari pasien"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setSearch}
          placeholder="Cari pasien atau pemilik…"
          placeholderTextColor={colors.mutedForeground}
          style={styles.searchInput}
          value={search}
        />
        {search ? (
          <Pressable
            accessibilityLabel="Hapus pencarian pasien"
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
              onPress={() => {
                setActiveFilter(filter.id);
                setExpandedPatientId(null);
              }}
              style={({ pressed }) => [
                styles.filterChip,
                selected && styles.filterChipSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {visiblePatients.length > 0 ? (
        <View style={styles.patientList}>
          {visiblePatients.map((patient) => (
            <PatientCard
              expanded={expandedPatientId === patient.id}
              key={patient.id}
              onToggle={() =>
                setExpandedPatientId((current) => (current === patient.id ? null : patient.id))
              }
              patient={patient}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons color={colors.mutedForeground} name="search-outline" size={34} />
          <Text style={styles.emptyTitle}>Pasien tidak ditemukan</Text>
          <Text style={styles.emptyDescription}>Coba nama pasien, nama pemilik, atau filter yang lain.</Text>
          <Pressable
            accessibilityLabel="Reset pencarian pasien"
            accessibilityRole="button"
            onPress={resetDiscovery}
            style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
          >
            <Text style={styles.resetButtonText}>Reset pencarian</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.disclaimer}>
        Tampilan demo ini tidak melakukan penyimpanan, enkripsi, pencatatan audit, atau sinkronisasi data
        medis.
      </Text>
    </ScrollView>
  );
}

function PatientCard({
  expanded,
  onToggle,
  patient,
}: {
  expanded: boolean;
  onToggle: () => void;
  patient: MockPatient;
}) {
  const species = speciesPresentation[patient.species];
  const currentWeight = patient.weightHistory.at(0);
  const attention = needsAttention(patient);

  return (
    <View style={styles.patientCard}>
      <Pressable
        accessibilityLabel={`${expanded ? 'Tutup' : 'Lihat'} detail ${patient.name}`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed }) => [styles.patientButton, pressed && styles.pressed]}
      >
        <View style={styles.speciesIcon}>
          <Ionicons color={colors.primary} name={species.icon} size={22} />
        </View>
        <View style={styles.patientIdentity}>
          <View style={styles.nameRow}>
            <Text style={styles.patientName}>{patient.name}</Text>
            {attention ? <View style={styles.attentionDot} /> : null}
          </View>
          <Text style={styles.patientMeta}>
            {species.label} · {patient.breed}
          </Text>
          <Text style={styles.ownerMeta}>
            {patient.owner.name} · {patient.owner.phone}
          </Text>
        </View>
        <View style={styles.patientSummary}>
          <Text style={styles.weightText}>{currentWeight ? formatWeight(currentWeight.kilograms) : '—'}</Text>
          <Ionicons
            color={colors.mutedForeground}
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={17}
          />
        </View>
      </Pressable>

      {expanded ? <PatientDetails patient={patient} /> : null}
    </View>
  );
}

function PatientDetails({ patient }: { patient: MockPatient }) {
  const currentWeight = patient.weightHistory.at(0);

  return (
    <View style={styles.details}>
      <View style={styles.profileGrid}>
        <SummaryField label="Tanggal lahir" value={patient.birthDateLabel} />
        <SummaryField
          label="Berat terkini"
          value={currentWeight ? formatWeight(currentWeight.kilograms) : 'Belum dicatat'}
        />
      </View>

      <View style={styles.healthCard}>
        <View style={styles.sectionTitleRow}>
          <Ionicons color="#9A3412" name="alert-circle-outline" size={18} />
          <Text style={styles.healthTitle}>Penanda kesehatan</Text>
        </View>
        <Text style={styles.healthText}>
          Alergi: {patient.allergies.length > 0 ? patient.allergies.join(', ') : 'Tidak ada'}
        </Text>
        <Text style={styles.healthText}>
          Kondisi kronis:{' '}
          {patient.chronicConditions.length > 0 ? patient.chronicConditions.join(', ') : 'Tidak ada'}
        </Text>
      </View>

      <View>
        <Text style={styles.sectionTitle}>Vaksinasi</Text>
        {patient.vaccinations.length > 0 ? (
          <View style={styles.sectionList}>
            {patient.vaccinations.map((vaccination) => {
              const status = vaccinationPresentation[vaccination.status];
              return (
                <View key={`${vaccination.name}-${vaccination.dueLabel}`} style={styles.vaccinationRow}>
                  <View style={styles.timelineMarker} />
                  <View style={styles.timelineContent}>
                    <View style={styles.vaccinationTitleRow}>
                      <Text style={styles.timelineTitle}>{vaccination.name}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: status.backgroundColor }]}>
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.timelineMeta}>Diberikan {vaccination.administeredLabel}</Text>
                    <Text style={styles.timelineMeta}>Jatuh tempo {vaccination.dueLabel}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.noDataText}>Belum ada vaksinasi pada data demo.</Text>
        )}
      </View>

      <View>
        <Text style={styles.sectionTitle}>Riwayat kunjungan</Text>
        <View style={styles.sectionList}>
          {patient.visits.map((visit) => (
            <View key={`${visit.dateLabel}-${visit.type}`} style={styles.visitCard}>
              <View style={styles.visitTitleRow}>
                <Text style={styles.timelineTitle}>{visit.type}</Text>
                <Text style={styles.timelineMeta}>{visit.dateLabel}</Text>
              </View>
              <ClinicalField label="Keluhan" value={visit.complaint} />
              <ClinicalField label="Observasi" value={visit.observations} />
              <ClinicalField label="Diagnosis" value={visit.diagnosis} />
              <ClinicalField label="Rencana terapi" value={visit.treatment} />
              {visit.medications.length > 0 ? (
                <View style={styles.medicationRow}>
                  {visit.medications.map((medication) => (
                    <View key={medication} style={styles.medicationChip}>
                      <Text style={styles.medicationText}>{medication}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryField}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function ClinicalField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.clinicalField}>
      <Text style={styles.clinicalLabel}>{label}</Text>
      <Text style={styles.clinicalValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  attentionDot: { backgroundColor: colors.accent, borderRadius: radii.pill, height: 7, width: 7 },
  clinicalField: { gap: 2 },
  clinicalLabel: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  clinicalValue: { color: colors.foreground, fontSize: typography.caption, lineHeight: 18 },
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
  details: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.large,
    padding: spacing.large,
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
  emptyTitle: { color: colors.foreground, fontSize: typography.body, fontWeight: '800' },
  filterChip: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  filterChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterRow: { flexDirection: 'row', gap: spacing.small },
  filterText: { color: colors.mutedForeground, fontSize: typography.caption, fontWeight: '700' },
  filterTextSelected: { color: colors.primaryForeground },
  headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  heading: { color: colors.foreground, fontSize: typography.heading, fontWeight: '800' },
  healthCard: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: radii.medium,
    borderWidth: 1,
    gap: spacing.xsmall,
    padding: spacing.medium,
  },
  healthText: { color: '#9A3412', fontSize: typography.caption, lineHeight: 18 },
  healthTitle: { color: '#9A3412', fontSize: typography.label, fontWeight: '800' },
  medicationChip: {
    backgroundColor: '#E6F7F5',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.xsmall,
  },
  medicationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xsmall },
  medicationText: { color: '#0F766E', fontSize: 11, fontWeight: '700' },
  nameRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.small },
  noDataText: { color: colors.mutedForeground, fontSize: typography.caption },
  ownerMeta: { color: colors.mutedForeground, fontSize: 11, marginTop: 2 },
  patientButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.medium,
    padding: spacing.large,
  },
  patientCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    overflow: 'hidden',
  },
  patientCount: { color: colors.mutedForeground, fontSize: typography.caption, marginTop: spacing.xsmall },
  patientIdentity: { flex: 1 },
  patientList: { gap: spacing.small },
  patientMeta: { color: colors.mutedForeground, fontSize: typography.caption, marginTop: spacing.xsmall },
  patientName: { color: colors.foreground, fontSize: typography.body, fontWeight: '800' },
  patientSummary: { alignItems: 'flex-end', gap: spacing.xsmall },
  pressed: { opacity: 0.65 },
  profileGrid: { flexDirection: 'row', gap: spacing.medium },
  resetButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.medium,
    marginTop: spacing.small,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.small,
  },
  resetButtonText: { color: colors.primaryForeground, fontSize: typography.label, fontWeight: '700' },
  safetyNotice: {
    alignItems: 'flex-start',
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: radii.large,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.small,
    padding: spacing.medium,
  },
  safetyNoticeText: { color: '#9A3412', flex: 1, fontSize: typography.caption, lineHeight: 18 },
  screen: { backgroundColor: colors.background, flex: 1 },
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
  sectionList: { gap: spacing.small, marginTop: spacing.small },
  sectionTitle: {
    color: colors.foreground,
    fontSize: typography.label,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  sectionTitleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.small },
  speciesIcon: {
    alignItems: 'center',
    backgroundColor: '#E6F7F5',
    borderRadius: radii.large,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  statusBadge: { borderRadius: radii.pill, paddingHorizontal: spacing.small, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '800' },
  summaryField: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.medium,
    borderWidth: 1,
    flex: 1,
    padding: spacing.medium,
  },
  summaryLabel: { color: colors.mutedForeground, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  summaryValue: { color: colors.foreground, fontSize: typography.label, fontWeight: '800', marginTop: spacing.xsmall },
  timelineContent: { flex: 1 },
  timelineMarker: { backgroundColor: colors.primary, borderRadius: radii.pill, height: 8, marginTop: 5, width: 8 },
  timelineMeta: { color: colors.mutedForeground, fontSize: typography.caption, marginTop: 2 },
  timelineTitle: { color: colors.foreground, flex: 1, fontSize: typography.label, fontWeight: '800' },
  vaccinationRow: {
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.medium,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.small,
    padding: spacing.medium,
  },
  vaccinationTitleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.small },
  visitCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderLeftColor: colors.primary,
    borderLeftWidth: 3,
    borderRadius: radii.medium,
    borderWidth: 1,
    gap: spacing.small,
    padding: spacing.medium,
  },
  visitTitleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  weightText: { color: colors.foreground, fontSize: typography.caption, fontWeight: '700' },
});
