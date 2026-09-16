import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Modal, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGroup, useGroupMembers, useJoinGroup, useGroupDiscussions, usePostDiscussion } from '../api/groups';
import { useCreatePrayerRequest } from '../api/prayers';
import { colors, type, space, radius, shadow } from '../theme';
import FadeInView from '../components/FadeInView';
import FlameMark from '../components/FlameMark';

const DAY_LABELS: Record<string, string> = { MO: 'Mon', TU: 'Tue', WE: 'Wed', TH: 'Thu', FR: 'Fri', SA: 'Sat', SU: 'Sun' };
const BIBLE_STUDY_TABS = ['About', 'Discussion', 'Resources', 'Members'] as const;
type BibleStudyTab = (typeof BIBLE_STUDY_TABS)[number];

export default function GroupDetailScreen({ route, navigation }: any) {
  const { groupId } = route.params;
  const insets = useSafeAreaInsets();
  const { data: group, isLoading } = useGroup(groupId);
  const { data: members } = useGroupMembers(groupId);
  const joinGroup = useJoinGroup();
  const createPrayer = useCreatePrayerRequest();
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [requestText, setRequestText] = useState('');
  const [activeTab, setActiveTab] = useState<BibleStudyTab>('About');

  const isBibleStudy = group?.groupType === 'bible_study';

  if (isLoading || !group) {
    return <View style={styles.loadingRoot}><FlameMark size={40} /></View>;
  }

  if (!isBibleStudy) {
    return (
      <View style={styles.container}>
        <FadeInView>
          <View style={styles.header}>
            <Text style={styles.groupType}>{group.groupType.replace('_', ' ')}</Text>
            <Text style={styles.groupName} maxFontSizeMultiplier={1.3}>{group.name}</Text>
            {!!group.description && <Text style={styles.groupDescription}>{group.description}</Text>}
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
        <RequestModal
          visible={requestModalVisible}
          onClose={() => setRequestModalVisible(false)}
          groupName={group.name}
          groupId={groupId}
          createPrayer={createPrayer}
          insets={insets}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FadeInView>
        <View style={styles.header}>
          <Text style={styles.groupType}>Bible Study</Text>
          <Text style={styles.groupName} maxFontSizeMultiplier={1.3}>{group.name}</Text>
          <Text style={styles.groupMeta}>{group.memberCount} members</Text>
        </View>
      </FadeInView>
      <View style={styles.tabRow}>
        {BIBLE_STUDY_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
          >
            <Text style={activeTab === tab ? styles.tabTextActive : styles.tabText}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'About' && (
        <View style={{ padding: space.lg }}>
          {!!group.description && (
            <View style={styles.studyCard}>
              <Text style={styles.studyLabel}>Current Study</Text>
              <Text style={styles.studyText} maxFontSizeMultiplier={1.4}>{group.description}</Text>
            </View>
          )}
          {group.recurringSchedule && (
            <View style={styles.scheduleCard}>
              <Text style={styles.scheduleTitle}>Schedule</Text>
              <Text style={styles.scheduleText}>
                {group.recurringSchedule.days.map((d: string) => DAY_LABELS[d]).join(', ')} at {group.recurringSchedule.time}
              </Text>
            </View>
          )}
          {!group.isMember && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => joinGroup.mutate(groupId)}
              accessibilityRole="button"
              accessibilityLabel="Join Study"
            >
              <Text style={styles.primaryButtonText}>Join Study</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {activeTab === 'Discussion' && <DiscussionTab groupId={groupId} isMember={group.isMember} insets={insets} />}

      {activeTab === 'Resources' && (
        <View style={styles.emptyTabState}>
          <FlameMark size={28} />
          <Text style={styles.emptyTabText}>No resources have been added to this study yet.</Text>
        </View>
      )}

      {activeTab === 'Members' && (
        <FlatList
          data={members}
          keyExtractor={(m: any) => m.user_id}
          contentContainerStyle={{ padding: space.lg }}
          renderItem={({ item }: any) => (
            <View style={styles.memberRow}>
              <Text style={styles.memberName}>{item.display_name}</Text>
              <Text style={styles.memberRole}>{item.role}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

function DiscussionTab({ groupId, isMember, insets }: { groupId: string; isMember: boolean; insets: any }) {
  const { data: discussions, isLoading } = useGroupDiscussions(groupId);
  const postDiscussion = usePostDiscussion(groupId);
  const [body, setBody] = useState('');

  const submit = () => {
    if (!body.trim()) return;
    postDiscussion.mutate({ body }, { onSuccess: () => setBody('') });
  };

  if (isLoading) {
    return <View style={styles.loadingRoot}><FlameMark size={32} /></View>;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <FlatList
        data={discussions}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: space.lg }}
        renderItem={({ item }: any) => (
          <View style={styles.discussionCard}>
            <Text style={styles.discussionAuthor}>{item.authorName}</Text>
            <Text style={styles.discussionBody}>{item.body}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyTabState}>
            <FlameMark size={28} />
            <Text style={styles.emptyTabText}>No discussion yet — be the first to share a thought.</Text>
          </View>
        }
      />
      {isMember && (
        <View style={[styles.discussionInputRow, { paddingBottom: space.sm + insets.bottom }]}>
          <TextInput
            style={styles.discussionInput}
            placeholder="Share a thought or question..."
            value={body}
            onChangeText={setBody}
            multiline
            accessibilityLabel="Discussion message"
          />
          <TouchableOpacity
            style={styles.discussionSendButton}
            onPress={submit}
            disabled={postDiscussion.isPending}
            accessibilityRole="button"
            accessibilityLabel="Send"
          >
            {postDiscussion.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.discussionSendText}>Send</Text>}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function RequestModal({ visible, onClose, groupName, groupId, createPrayer, insets }: any) {
  const [requestText, setRequestText] = useState('');
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalCard, { paddingBottom: space.xl + insets.bottom }]}>
          <Text style={styles.modalTitle}>Prayer Request for {groupName}</Text>
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
                { title: `Prayer request in ${groupName}`, description: requestText, visibility: 'group', groupId },
                { onSuccess: () => { setRequestText(''); onClose(); } },
              )
            }
            accessibilityRole="button"
            accessibilityLabel="Post prayer request"
          >
            {createPrayer.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Post</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { Keyboard.dismiss(); onClose(); }} accessibilityRole="button" accessibilityLabel="Cancel">
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
  tabRow: { flexDirection: 'row', paddingHorizontal: space.lg, gap: space.xs, marginBottom: space.sm },
  tabButton: { flex: 1, paddingVertical: space.sm, borderRadius: radius.pill, alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  tabButtonActive: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  tabText: { color: colors.text, fontSize: type.size.xs, fontWeight: '600' },
  tabTextActive: { color: '#fff', fontSize: type.size.xs, fontWeight: '700' },
  emptyTabState: { alignItems: 'center', marginTop: 60, paddingHorizontal: space.xl },
  emptyTabText: { textAlign: 'center', color: colors.mutedText, marginTop: space.md, fontSize: type.size.base },
  discussionCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, marginBottom: space.sm, borderWidth: 1, borderColor: colors.cardBorder },
  discussionAuthor: { color: colors.mutedText, fontSize: type.size.xs, marginBottom: 4, fontWeight: '600' },
  discussionBody: { color: colors.text, fontSize: type.size.base },
  discussionInputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: space.md, gap: space.sm, borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: colors.card },
  discussionInput: { flex: 1, borderWidth: 1, borderColor: colors.divider, borderRadius: radius.md, padding: space.sm, maxHeight: 80 },
  discussionSendButton: { backgroundColor: colors.indigo, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.sm },
  discussionSendText: { color: '#fff', fontWeight: '700', fontSize: type.size.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(31,30,51,0.45)', justifyContent: 'center', alignItems: 'center', padding: space.lg },
  modalCard: { backgroundColor: colors.card, borderRadius: radius.xl, padding: space.xl, width: '100%', maxWidth: 420 },
  modalTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.lg, marginBottom: space.md, color: colors.indigo },
  input: { borderWidth: 1, borderColor: colors.divider, borderRadius: radius.sm, padding: space.md, marginBottom: space.sm },
  textArea: { height: 90, textAlignVertical: 'top' },
  cancelText: { textAlign: 'center', color: colors.mutedText, marginTop: space.xs },
});
