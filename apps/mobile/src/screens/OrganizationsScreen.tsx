import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useOrganizations, useCreateOrganization } from '../api/organizations';
import { colors, type, space, radius, shadow } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FadeInView from '../components/FadeInView';
import FlameMark from '../components/FlameMark';

export default function OrganizationsScreen({ navigation }: any) {
  const { data: organizations, isLoading } = useOrganizations();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Churches & Ministries</Text>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Register a church or ministry"
        >
          <Text style={styles.newButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingState}><FlameMark /></View>
      ) : (
        <FlatList
          data={organizations}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ padding: space.lg }}
          renderItem={({ item, index }: any) => (
            <FadeInView delay={Math.min(index, 6) * 40}>
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('OrganizationDetail', { orgId: item.id })}
                accessibilityRole="button"
                accessibilityLabel={`${item.name}, ${item.type}${item.verified ? ', verified' : ''}, ${item.followerCount} followers`}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.cardType}>{item.type}</Text>
                  {item.verified && <Text style={styles.verifiedBadge}>✓ Verified</Text>}
                </View>
                <Text style={styles.cardTitle} maxFontSizeMultiplier={1.3}>{item.name}</Text>
                <Text style={styles.cardMeta}>{item.followerCount} followers · {item.groupCount} groups</Text>
              </TouchableOpacity>
            </FadeInView>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FlameMark size={32} />
              <Text style={styles.emptyText}>No churches or ministries listed yet.</Text>
            </View>
          }
        />
      )}

      <NewOrgModal visible={modalVisible} onClose={() => setModalVisible(false)} onCreated={(id) => navigation.navigate('OrganizationDetail', { orgId: id })} />
    </View>
  );
}

function NewOrgModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [type_, setType] = useState<'church' | 'ministry'>('church');
  const createOrg = useCreateOrganization();

  const submit = () => {
    if (!name.trim()) return;
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    createOrg.mutate(
      { name, slug, type: type_ },
      { onSuccess: (org) => { setName(''); onClose(); onCreated(org.id); } },
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={[styles.modalCard, { paddingBottom: space.xl + insets.bottom }]}>
          <Text style={styles.modalTitle}>Register a Church or Ministry</Text>
          <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} accessibilityLabel="Organization name" />
          <View style={styles.typeRow}>
            {(['church', 'ministry'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, type_ === t && styles.typeChipActive]}
                onPress={() => setType(t)}
                accessibilityRole="radio"
                accessibilityState={{ selected: type_ === t }}
              >
                <Text style={type_ === t ? styles.typeTextActive : styles.typeText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.hint}>New organizations start unverified — a platform admin reviews and verifies them.</Text>
          <TouchableOpacity style={styles.submitButton} onPress={submit} disabled={createOrg.isPending} accessibilityRole="button" accessibilityLabel="Register">
            {createOrg.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Register</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { Keyboard.dismiss(); onClose(); }} accessibilityRole="button" accessibilityLabel="Cancel"><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: space.lg, paddingTop: 56 },
  headerTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.lg, color: colors.indigo, flex: 1 },
  newButton: { backgroundColor: colors.flame, paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.pill },
  newButtonText: { color: '#fff', fontWeight: '700', fontSize: type.size.sm },
  loadingState: { alignItems: 'center', marginTop: 60 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, marginBottom: space.md, borderWidth: 1, borderColor: colors.cardBorder, ...shadow.card },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cardType: { color: colors.mutedText, fontSize: type.size.xs, textTransform: 'uppercase' },
  verifiedBadge: { color: colors.success, fontSize: type.size.xs, fontWeight: '700' },
  cardTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.md, color: colors.text, marginVertical: 4 },
  cardMeta: { color: colors.mutedText, fontSize: type.size.sm },
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: space.xl },
  emptyText: { textAlign: 'center', color: colors.mutedText, marginTop: space.md, fontSize: type.size.base },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(31,30,51,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.xl },
  modalTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.lg, marginBottom: space.md, color: colors.indigo },
  input: { borderWidth: 1, borderColor: colors.divider, borderRadius: radius.sm, padding: space.md, marginBottom: space.sm },
  typeRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.sm },
  typeChip: { borderWidth: 1, borderColor: colors.divider, borderRadius: radius.lg, paddingHorizontal: space.md, paddingVertical: 6 },
  typeChipActive: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  typeText: { color: colors.text },
  typeTextActive: { color: '#fff' },
  hint: { color: colors.mutedText, fontSize: type.size.xs, marginBottom: space.lg },
  submitButton: { backgroundColor: colors.indigo, borderRadius: radius.md, padding: space.md, alignItems: 'center', marginBottom: space.sm },
  submitButtonText: { color: '#fff', fontWeight: '700' },
  cancelText: { textAlign: 'center', color: colors.mutedText },
});
