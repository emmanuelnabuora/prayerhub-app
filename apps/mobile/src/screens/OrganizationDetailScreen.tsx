import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Modal } from 'react-native';
import { useOrganization, useOrganizationAnnouncements, useFollowOrganization, usePostAnnouncement } from '../api/organizations';
import { colors, type, space, radius } from '../theme';
import FadeInView from '../components/FadeInView';
import FlameMark from '../components/FlameMark';

export default function OrganizationDetailScreen({ route, navigation }: any) {
  const { orgId } = route.params;
  const { data: org, isLoading } = useOrganization(orgId);
  const { data: announcements } = useOrganizationAnnouncements(orgId);
  const followOrg = useFollowOrganization(orgId);
  const postAnnouncement = usePostAnnouncement(orgId);
  const [announceModalVisible, setAnnounceModalVisible] = useState(false);

  if (isLoading || !org) return <View style={styles.loadingRoot}><FlameMark size={40} /></View>;

  const isLeader = org.viewerRole === 'leader';

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <FadeInView>
            <View style={styles.header}>
              <View style={styles.topRow}>
                <Text style={styles.orgType}>{org.type}</Text>
                {org.verified && <Text style={styles.verifiedBadge}>✓ Verified</Text>}
              </View>
              <Text style={styles.orgName} maxFontSizeMultiplier={1.3}>{org.name}</Text>
              {!!org.description && <Text style={styles.orgDescription}>{org.description}</Text>}
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

              {org.groups?.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Groups</Text>
                  {org.groups.map((g: any) => (
                    <TouchableOpacity
                      key={g.id}
                      style={styles.groupRow}
                      onPress={() => navigation.navigate('GroupDetail', { groupId: g.id })}
                      accessibilityRole="button"
                      accessibilityLabel={`Open group: ${g.name}`}
                    >
                      <Text style={styles.groupName}>{g.name}</Text>
                      <Text style={styles.groupType}>{g.group_type}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              <Text style={styles.sectionTitle}>Announcements</Text>
            </View>
          </FadeInView>
        }
        data={announcements}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xl }}
        renderItem={({ item }: any) => (
          <View style={styles.announcementCard}>
            <Text style={styles.announcementTitle}>{item.title}</Text>
            <Text style={styles.announcementBody}>{item.body}</Text>
            <Text style={styles.announcementMeta}>{item.author_name}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No announcements yet.</Text>}
      />

      <Modal visible={announceModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <AnnouncementForm onSubmit={(a) => { postAnnouncement.mutate(a); setAnnounceModalVisible(false); }} onClose={() => setAnnounceModalVisible(false)} />
        </View>
      </Modal>
    </View>
  );
}

function AnnouncementForm({ onSubmit, onClose }: { onSubmit: (a: { title: string; body: string }) => void; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  return (
    <View style={styles.modalCard}>
      <Text style={styles.modalTitle}>New Announcement</Text>
      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} accessibilityLabel="Announcement title" />
      <TextInput style={[styles.input, styles.textArea]} placeholder="Message" value={body} onChangeText={setBody} multiline accessibilityLabel="Announcement message" />
      <TouchableOpacity style={styles.followButton} onPress={() => title.trim() && body.trim() && onSubmit({ title, body })} accessibilityRole="button" accessibilityLabel="Post announcement">
        <Text style={styles.followButtonText}>Post</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Cancel"><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
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
  orgDescription: { color: colors.text, marginBottom: space.sm },
  orgMeta: { color: colors.mutedText, fontSize: type.size.sm, marginBottom: space.md },
  buttonRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.lg },
  followButton: { backgroundColor: colors.indigo, borderRadius: radius.pill, paddingHorizontal: space.lg, paddingVertical: space.sm },
  followButtonText: { color: '#fff', fontWeight: '700' },
  announceButton: { backgroundColor: colors.flame, borderRadius: radius.pill, paddingHorizontal: space.lg, paddingVertical: space.sm },
  announceButtonText: { color: '#fff', fontWeight: '700' },
  sectionTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.base, color: colors.indigo, marginTop: space.md, marginBottom: space.sm },
  groupRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.sm, padding: space.md, marginBottom: 6, borderWidth: 1, borderColor: colors.cardBorder },
  groupName: { color: colors.text },
  groupType: { color: colors.mutedText, fontSize: type.size.xs, textTransform: 'uppercase' },
  announcementCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, marginBottom: space.sm, borderWidth: 1, borderColor: colors.cardBorder },
  announcementTitle: { fontWeight: '700', color: colors.text, marginBottom: 4 },
  announcementBody: { color: colors.text, marginBottom: 6 },
  announcementMeta: { color: colors.mutedText, fontSize: 11 },
  empty: { textAlign: 'center', color: colors.mutedText, marginTop: space.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(31,30,51,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.xl },
  modalTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.lg, marginBottom: space.md, color: colors.indigo },
  input: { borderWidth: 1, borderColor: colors.divider, borderRadius: radius.sm, padding: space.md, marginBottom: space.sm },
  textArea: { height: 80, textAlignVertical: 'top' },
  cancelText: { textAlign: 'center', color: colors.mutedText, marginTop: space.xs },
});
