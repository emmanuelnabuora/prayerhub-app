import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useDiscoverGroups, useMyGroups, useCreateGroup, useJoinGroup } from '../api/groups';
import { colors, type, space, radius, shadow } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FadeInView from '../components/FadeInView';
import FlameMark from '../components/FlameMark';

export default function CommunityScreen({ navigation }: any) {
  const [tab, setTab] = useState<'mine' | 'discover'>('mine');
  const myGroups = useMyGroups();
  const discover = useDiscoverGroups();
  const joinGroup = useJoinGroup();
  const [modalVisible, setModalVisible] = useState(false);

  const data = tab === 'mine' ? myGroups.data : discover.data;
  const isLoading = tab === 'mine' ? myGroups.isLoading : discover.isLoading;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Start a new group"
        >
          <Text style={styles.newButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.orgLinkCard}
        onPress={() => navigation.navigate('Organizations')}
        accessibilityRole="button"
        accessibilityLabel="Browse churches and ministries"
      >
        <Text style={styles.orgLinkText}>⛪ Churches & Ministries</Text>
        <Text style={styles.orgLinkChevron}>›</Text>
      </TouchableOpacity>

      <View style={styles.tabs} accessibilityRole="tablist">
        <TouchableOpacity
          style={[styles.tabButton, tab === 'mine' && styles.tabButtonActive]}
          onPress={() => setTab('mine')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'mine' }}
        >
          <Text style={tab === 'mine' ? styles.tabTextActive : styles.tabText}>My Groups</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'discover' && styles.tabButtonActive]}
          onPress={() => setTab('discover')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'discover' }}
        >
          <Text style={tab === 'discover' ? styles.tabTextActive : styles.tabText}>Discover</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingState}><FlameMark /></View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ padding: space.lg }}
          renderItem={({ item, index }: any) => (
            <FadeInView delay={Math.min(index, 6) * 40}>
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
                accessibilityRole="button"
                accessibilityLabel={`${item.name}, ${item.groupType.replace('_', ' ')}, ${item.memberCount} members`}
              >
                <Text style={styles.cardType}>{item.groupType.replace('_', ' ')}</Text>
                <Text style={styles.cardTitle} maxFontSizeMultiplier={1.3}>{item.name}</Text>
                <Text style={styles.cardMeta}>{item.memberCount} members · {item.visibility}</Text>
                {!item.isMember && (
                  <TouchableOpacity
                    style={styles.joinButton}
                    onPress={() => joinGroup.mutate(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={item.visibility === 'public' ? `Join ${item.name}` : `Request to join ${item.name}`}
                  >
                    <Text style={styles.joinButtonText}>
                      {item.visibility === 'public' ? 'Join' : 'Request to Join'}
                    </Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </FadeInView>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FlameMark size={32} />
              <Text style={styles.emptyText}>
                {tab === 'mine' ? "You haven't joined any groups yet — check Discover." : 'No groups to discover yet.'}
              </Text>
            </View>
          }
        />
      )}

      <NewGroupModal visible={modalVisible} onClose={() => setModalVisible(false)} onCreated={(id) => navigation.navigate('GroupDetail', { groupId: id })} />
    </View>
  );
}

function NewGroupModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'invite_only'>('public');
  const createGroup = useCreateGroup();

  const submit = () => {
    if (!name.trim()) return;
    Keyboard.dismiss();
    createGroup.mutate(
      { name, description, visibility },
      { onSuccess: (group) => { setName(''); setDescription(''); onClose(); onCreated(group.id); } },
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={[styles.modalCard, { paddingBottom: space.xl + insets.bottom }]}>
          <Text style={styles.modalTitle}>Start a Group</Text>
          <TextInput style={styles.input} placeholder="Group name" value={name} onChangeText={setName} accessibilityLabel="Group name" />
          <TextInput style={[styles.input, styles.textArea]} placeholder="Description" value={description} onChangeText={setDescription} multiline accessibilityLabel="Group description" />
          <View style={styles.visibilityRow}>
            {(['public', 'private', 'invite_only'] as const).map((v) => (
              <TouchableOpacity
                key={v}
                style={[styles.visibilityChip, visibility === v && styles.visibilityChipActive]}
                onPress={() => setVisibility(v)}
                accessibilityRole="radio"
                accessibilityState={{ selected: visibility === v }}
              >
                <Text style={visibility === v ? styles.visibilityTextActive : styles.visibilityText}>{v.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.submitButton} onPress={submit} disabled={createGroup.isPending} accessibilityRole="button" accessibilityLabel="Create group">
            {createGroup.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Create Group</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Cancel"><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: space.lg, paddingTop: 56 },
  headerTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.xl, color: colors.indigo },
  newButton: { backgroundColor: colors.flame, paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.pill },
  newButtonText: { color: '#fff', fontWeight: '700', fontSize: type.size.sm },
  orgLinkCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: radius.md, padding: space.md,
    marginHorizontal: space.lg, marginBottom: space.md, borderWidth: 1, borderColor: colors.cardBorder,
  },
  orgLinkText: { color: colors.indigo, fontWeight: '700', fontSize: type.size.base },
  orgLinkChevron: { color: colors.mutedText, fontSize: type.size.lg },
  tabs: { flexDirection: 'row', paddingHorizontal: space.lg, gap: space.sm, marginBottom: space.sm },
  tabButton: { paddingHorizontal: space.md, paddingVertical: 6, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  tabButtonActive: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  tabText: { color: colors.text, fontSize: type.size.sm },
  tabTextActive: { color: '#fff', fontWeight: '700', fontSize: type.size.sm },
  loadingState: { alignItems: 'center', marginTop: 60 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, marginBottom: space.md, borderWidth: 1, borderColor: colors.cardBorder, ...shadow.card },
  cardType: { color: colors.mutedText, fontSize: type.size.xs, textTransform: 'uppercase' },
  cardTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.md, color: colors.text, marginVertical: 4 },
  cardMeta: { color: colors.mutedText, fontSize: type.size.sm, marginBottom: space.sm },
  joinButton: { alignSelf: 'flex-start', backgroundColor: colors.parchment, borderRadius: radius.lg, paddingHorizontal: space.md, paddingVertical: 6 },
  joinButtonText: { color: colors.indigo, fontWeight: '700', fontSize: type.size.xs },
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: space.xl },
  emptyText: { textAlign: 'center', color: colors.mutedText, marginTop: space.md, fontSize: type.size.base },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(31,30,51,0.45)', justifyContent: 'center', alignItems: 'center', padding: space.lg },
  modalCard: { backgroundColor: colors.card, borderRadius: radius.xl, padding: space.xl, width: '100%', maxWidth: 420 },
  modalTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.lg, marginBottom: space.md, color: colors.indigo },
  input: { borderWidth: 1, borderColor: colors.divider, borderRadius: radius.sm, padding: space.md, marginBottom: space.sm },
  textArea: { height: 70, textAlignVertical: 'top' },
  visibilityRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.lg },
  visibilityChip: { borderWidth: 1, borderColor: colors.divider, borderRadius: radius.lg, paddingHorizontal: space.sm, paddingVertical: 6 },
  visibilityChipActive: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  visibilityText: { color: colors.text, fontSize: type.size.xs },
  visibilityTextActive: { color: '#fff', fontSize: type.size.xs },
  submitButton: { backgroundColor: colors.indigo, borderRadius: radius.md, padding: space.md, alignItems: 'center', marginBottom: space.sm },
  submitButtonText: { color: '#fff', fontWeight: '700' },
  cancelText: { textAlign: 'center', color: colors.mutedText },
});
