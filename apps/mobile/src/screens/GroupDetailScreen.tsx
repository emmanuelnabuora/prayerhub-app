import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Modal, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useGroup, useGroupMembers, useJoinGroup } from '../api/groups';
import { useCreatePrayerRequest } from '../api/prayers';
import { colors, type, space, radius, shadow } from '../theme';
import FadeInView from '../components/FadeInView';
import FlameMark from '../components/FlameMark';

const DAY_LABELS: Record<string, string> = { MO: 'Mon', TU: 'Tue', WE: 'Wed', TH: 'Thu', FR: 'Fri', SA: 'Sat', SU: 'Sun' };

export default function GroupDetailScreen({ route, navigation }: any) {
  const { groupId } = route.params;
  const { data: group, isLoading } = useGroup(groupId);
  const { data: members } = useGroupMembers(groupId);
  const joinGroup = useJoinGroup();
  const createPrayer = useCreatePrayerRequest();
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [requestText, setRequestText] = useState('');

  if (isLoading || !group) {
    return <View style={styles.loadingRoot}><FlameMark size={40} /></View>;
  }

  return (
    <View style={styles.container}>
      <FadeInView>
        <View style={styles.header}>
          <Text style={styles.groupType}>{group.groupType.replace('_', ' ')}</Text>
          <Text style={styles.groupName} maxFontSizeMultiplier={1.3}>{group.name}</Text>
          {group.groupType === 'bible_study' && !!group.description && (
            <View style={styles.studyCard}>
              <Text style={styles.studyLabel}>Current Study</Text>
              <Text style={styles.studyText} maxFontSizeMultiplier={1.4}>{group.description}</Text>
            </View>
          )}
          {group.groupType !== 'bible_study' && !!group.description && (
            <Text style={styles.groupDescription}>{group.description}</Text>
          )}
          <Text style={styles.groupMeta}>{group.memberCount} members</Text>

          {group.recurringSchedule && (
            <View style={styles.scheduleCard}>
              <Text style={styles.scheduleTitle}>Recurring Meeting</Text>
              <Text style={styles.scheduleText}>
                {group.recurringSchedule.days.map((d: string) => DAY_LABELS[d]).join(', ')} at {group.recurringSchedule.time}
                {group.recurringSchedule.durationMinutes ? ` (${group.recurringSchedule.durationMinutes} min)` : ''}
              </Text>
            </View>
          )}

          {!group.isMember ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => joinGroup.mutate(groupId)}
              accessibilityRole="button"
              accessibilityLabel={group.visibility === 'public' ? `Join ${group.name}` : `Request to join ${group.name}`}
            >
              <Text style={styles.primaryButtonText}>
                {group.visibility === 'public' ? 'Join Group' : 'Request to Join'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setRequestModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Share a prayer request in this group"
            >
              <Text style={styles.primaryButtonText}>Share a Prayer Request Here</Text>
            </TouchableOpacity>
          )}
        </View>
      </FadeInView>

      <Text style={styles.sectionTitle}>Members</Text>
      <FlatList
        data={members}
        keyExtractor={(m: any) => m.user_id}
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xl }}
        renderItem={({ item }: any) => (
          <View style={styles.memberRow}>
            <Text style={styles.memberName}>{item.display_name}</Text>
            <Text style={styles.memberRole}>{item.role}</Text>
          </View>
        )}
      />

      <Modal visible={requestModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Prayer Request for {group.name}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What's on your heart?"
              value={requestText}
              onChangeText={setRequestText}
              multiline
              accessibilityLabel="Prayer request details"
            />
            <TouchableOpacity
              style={styles.primaryButton}
              disabled={!requestText.trim() || createPrayer.isPending}
              onPress={() =>
                createPrayer.mutate(
                  { title: `Prayer request in ${group.name}`, description: requestText, visibility: 'group', groupId },
                  { onSuccess: () => { setRequestText(''); setRequestModalVisible(false); } },
                )
              }
              accessibilityRole="button"
              accessibilityLabel="Post prayer request"
            >
              {createPrayer.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Post</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { Keyboard.dismiss(); setRequestModalVisible(false); }} accessibilityRole="button" accessibilityLabel="Cancel">
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.parchment },
  container: { flex: 1, backgroundColor: colors.parchment },
  header: { paddingTop: 56, paddingHorizontal: space.lg, paddingBottom: space.md },
  groupType: { color: colors.mutedText, fontSize: type.size.xs, textTransform: 'uppercase' },
  groupName: { fontFamily: type.fontFamily.display, fontSize: type.size.xl, color: colors.indigo, marginVertical: 4 },
  groupDescription: { color: colors.text, marginBottom: space.sm, lineHeight: type.size.base * type.lineHeight.normal },
  groupMeta: { color: colors.mutedText, fontSize: type.size.sm, marginBottom: space.md },
  scheduleCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, marginBottom: space.md, borderWidth: 1, borderColor: colors.cardBorder, borderLeftWidth: 3, borderLeftColor: colors.flame },
  studyCard: { backgroundColor: colors.indigo, borderRadius: radius.md, padding: space.md, marginBottom: space.sm },
  studyLabel: { color: colors.flame, fontSize: type.size.xs, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4, fontWeight: '700' },
  studyText: { fontFamily: type.fontFamily.displayItalic, color: colors.textOnDark, fontSize: type.size.base, lineHeight: type.size.base * type.lineHeight.relaxed },
  scheduleTitle: { fontSize: type.size.xs, color: colors.mutedText, textTransform: 'uppercase', marginBottom: 4 },
  scheduleText: { color: colors.text, fontWeight: '700' },
  primaryButton: { backgroundColor: colors.indigo, borderRadius: radius.md, padding: space.md, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  sectionTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.base, color: colors.indigo, paddingHorizontal: space.lg, marginBottom: space.sm },
  memberRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.sm, padding: space.md, marginBottom: space.sm, borderWidth: 1, borderColor: colors.cardBorder },
  memberName: { color: colors.text },
  memberRole: { color: colors.mutedText, fontSize: type.size.xs, textTransform: 'uppercase' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(31,30,51,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.xl },
  modalTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.lg, marginBottom: space.md, color: colors.indigo },
  input: { borderWidth: 1, borderColor: colors.divider, borderRadius: radius.sm, padding: space.md, marginBottom: space.sm },
  textArea: { height: 90, textAlignVertical: 'top' },
  cancelText: { textAlign: 'center', color: colors.mutedText, marginTop: space.xs },
});
