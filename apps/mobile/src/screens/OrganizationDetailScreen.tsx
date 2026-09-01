import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Modal, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useOrganization, useOrganizationAnnouncements, useOrganizationPrayers, useFollowOrganization, usePostAnnouncement } from '../api/organizations';
import { colors, type, space, radius } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FadeInView from '../components/FadeInView';
import FlameMark from '../components/FlameMark';

const COMMUNITY_TABS = ['About', 'Feed', 'Prayer', 'Studies', 'Members'] as const;
type CommunityTab = (typeof COMMUNITY_TABS)[number];

export default function OrganizationDetailScreen({ route, navigation }: any) {
  const { orgId } = route.params;
  const insets = useSafeAreaInsets();
  const { data: org, isLoading } = useOrganization(orgId);
  const { data: announcements } = useOrganizationAnnouncements(orgId);
  const { data: orgPrayers } = useOrganizationPrayers(orgId);
  const followOrg = useFollowOrganization(orgId);
  const postAnnouncement = usePostAnnouncement(orgId);
  const [announceModalVisible, setAnnounceModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<CommunityTab>('About');

  if (isLoading || !org) return <View style={styles.loadingRoot}><FlameMark size={40} /></View>;

  const isLeader = org.viewerRole === 'leader';
  const bibleStudyGroups = (org.groups ?? []).filter((g: any) => g.group_type === 'bible_study');

  return (
    <View style={styles.container}>
      <FadeInView>
        <View style={styles.header}>
          <View style={styles.topRow}>
            <Text style={styles.orgType}>{org.type}</Text>
            {org.verified && <Text style={styles.verifiedBadge}>✓ Verified</Text>}
          </View>
          <Text style={styles.orgName} maxFontSizeMultiplier={1.3}>{org.name}</Text>
          <Text style={styles.orgMeta}>{org.followerCount} followers · {org.groupCount} groups</Text>
          <View style={styles.buttonRow}>
            {!org.isFollowing && (
              <TouchableOpacity style={styles.followButton} onPress={() => followOrg.mutate()} accessibilityRole="button" accessibilityLabel={`Follow ${org.name}`}>
                <Text style={styles.followButtonText}>Follow</Text>
              </TouchableOpacity>
            )}
            {isLeader && (
              <TouchableOpacity style={styles.announceButton} onPress={() => setAnnounceModalVisible(true)} accessibilityRole="button" accessibilityLabel="Post an announcement">
                <Text style={styles.announceButtonText}>+ Announcement</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </FadeInView>

      <View style={styles.tabRow}>
        {COMMUNITY_TABS.map((tab) => (
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
          {!!org.description && <Text style={styles.orgDescription}>{org.description}</Text>}
        </View>
      )}

      {activeTab === 'Feed' && (
        <FlatList
          data={announcements}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ padding: space.lg }}
          renderItem={({ item }: any) => (
            <View style={styles.announcementCard}>
              <Text style={styles.announcementTitle}>{item.title}</Text>
              <Text style={styles.announcementBody}>{item.body}</Text>
              <Text style={styles.announcementMeta}>{item.author_name}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No announcements yet.</Text>}
        />
      )}

      {activeTab === 'Prayer' && (
        <FlatList
          data={orgPrayers}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ padding: space.lg }}
          renderItem={({ item }: any) => (
            <View style={styles.announcementCard}>
              <Text style={styles.announcementTitle}>{item.title}</Text>
              <Text style={styles.announcementBody}>{item.description}</Text>
              <Text style={styles.announcementMeta}>{item.authorName} · {item.prayedCount} prayed</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No prayer requests from this community yet.</Text>}
        />
      )}

      {activeTab === 'Studies' && (
        <FlatList
          data={bibleStudyGroups}
          keyExtractor={(g: any) => g.id}
          contentContainerStyle={{ padding: space.lg }}
          renderItem={({ item: g }: any) => (
            <TouchableOpacity
              style={styles.groupRow}
              onPress={() => navigation.navigate('GroupDetail', { groupId: g.id })}
              accessibilityRole="button"
              accessibilityLabel={`Open Bible study: ${g.name}`}
            >
              <Text style={styles.groupName}>{g.name}</Text>
              <Text style={styles.groupType}>bible study</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No Bible studies linked to this community yet.</Text>}
        />
      )}

      {activeTab === 'Members' && (
        <FlatList
          data={org.leadership}
          keyExtractor={(m: any) => m.id}
          contentContainerStyle={{ padding: space.lg }}
          renderItem={({ item }: any) => (
            <View style={styles.groupRow}>
              <Text style={styles.groupName}>{item.display_name}</Text>
              <Text style={styles.groupType}>{item.role}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No members listed yet.</Text>}
        />
      )}

      <Modal visible={announceModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <AnnouncementForm onSubmit={(a: any) => { postAnnouncement.mutate(a); setAnnounceModalVisible(false); }} onClose={() => setAnnounceModalVisible(false)} />
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function AnnouncementForm({ onSubmit, onClose }: { onSubmit: (a: { title: string; body: string }) => void; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  return (
    <View style={[styles.modalCard, { paddingBottom: space.xl + insets.bottom }]}>
      <Text style={styles.modalTitle}>New Announcement</Text>
      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} accessibilityLabel="Announcement title" />
      <TextInput style={[styles.input, styles.textArea]} placeholder="Message" value={body} onChangeText={setBody} multiline accessibilityLabel="Announcement message" />
      <TouchableOpacity style={styles.followButton} onPress={() => title.trim() && body.trim() && onSubmit({ title, body })} accessibilityRole="button" accessibilityLabel="Post announcement">
        <Text style={styles.followButtonText}>Post</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { Keyboard.dismiss(); onClose(); }} accessibilityRole="button" accessibilityLabel="Cancel"><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.parchment },
  container: { flex: 1, backgroundColor: colors.parchment },
  header: { paddingTop: 56, paddingHorizontal: space.lg, paddingBottom: space.sm },
  topRow: { flexDirection: 'row', justifyContent: 'space-between' },
  orgType: { color: colors.mutedText, fontSize: type.size.xs, textTransform: 'uppercase' },
  verifiedBadge: { color: colors.success, fontSize: type.size.xs, fontWeight: '700' },
  orgName: { fontFamily: type.fontFamily.display, fontSize: type.size.xl, color: colors.indigo, marginVertical: 4 },
  orgDescription: { color: colors.text, marginBottom: space.sm, lineHeight: type.size.base * type.lineHeight.normal },
  orgMeta: { color: colors.mutedText, fontSize: type.size.sm, marginBottom: space.md },
  buttonRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  followButton: { backgroundColor: colors.indigo, borderRadius: radius.pill, paddingHorizontal: space.lg, paddingVertical: space.sm },
  followButtonText: { color: '#fff', fontWeight: '700' },
  announceButton: { backgroundColor: colors.flame, borderRadius: radius.pill, paddingHorizontal: space.lg, paddingVertical: space.sm },
  announceButtonText: { color: '#fff', fontWeight: '700' },
  tabRow: { flexDirection: 'row', paddingHorizontal: space.lg, gap: space.xs, marginBottom: space.sm },
  tabButton: { flex: 1, paddingVertical: space.sm, borderRadius: radius.pill, alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  tabButtonActive: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  tabText: { color: colors.text, fontSize: 11, fontWeight: '600' },
  tabTextActive: { color: '#fff', fontSize: 11, fontWeight: '700' },
  groupRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.sm, padding: space.md, marginBottom: 6, borderWidth: 1, borderColor: colors.cardBorder },
  groupName: { color: colors.text },
  groupType: { color: colors.mutedText, fontSize: type.size.xs, textTransform: 'uppercase' },
  announcementCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, marginBottom: space.sm, borderWidth: 1, borderColor: colors.cardBorder },
  announcementTitle: { fontWeight: '700', color: colors.text, marginBottom: 4 },
  announcementBody: { color: colors.text, marginBottom: 6 },
  announcementMeta: { color: colors.mutedText, fontSize: 11 },
  empty: { textAlign: 'center', color: colors.mutedText, marginTop: space.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(31,30,51,0.45)', justifyContent: 'center', alignItems: 'center', padding: space.lg },
  modalCard: { backgroundColor: colors.card, borderRadius: radius.xl, padding: space.xl, width: '100%', maxWidth: 420 },
  modalTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.lg, marginBottom: space.md, color: colors.indigo },
  input: { borderWidth: 1, borderColor: colors.divider, borderRadius: radius.sm, padding: space.md, marginBottom: space.sm },
  textArea: { height: 80, textAlignVertical: 'top' },
  cancelText: { textAlign: 'center', color: colors.mutedText, marginTop: space.xs },
});
