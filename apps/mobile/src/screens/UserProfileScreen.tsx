import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useFollowUser } from '../api/social';
import { useStartDirectConversation } from '../api/messages';
import { useBlockUser } from '../api/users';
import { colors, type, space, radius } from '../theme';
import FadeInView from '../components/FadeInView';
import FlameMark from '../components/FlameMark';
import ReportModal from '../components/ReportModal';

export default function UserProfileScreen({ route, navigation }: any) {
  const { userId } = route.params;
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => (await api.get(`/users/${userId}`)).data,
  });
  const followUser = useFollowUser();
  const startConversation = useStartDirectConversation();
  const blockUser = useBlockUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);

  if (isLoading || !user) return <View style={styles.loadingRoot}><FlameMark size={40} /></View>;

  const confirmBlock = () => {
    setMenuOpen(false);
    Alert.alert(
      `Block ${user.display_name}?`,
      'They will no longer be able to follow you or see your content. This also removes any existing follow between you.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Block', style: 'destructive', onPress: () => blockUser.mutate(userId, { onSuccess: () => navigation.goBack() }) },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setMenuOpen(!menuOpen)}
        accessibilityRole="button"
        accessibilityLabel="More options"
        hitSlop={10}
      >
        <Text style={styles.menuIcon}>⋯</Text>
      </TouchableOpacity>

      {menuOpen && (
        <View style={styles.menuDropdown}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { setMenuOpen(false); setReportVisible(true); }}
            accessibilityRole="button"
            accessibilityLabel="Report this user"
          >
            <Text style={styles.menuItemText}>Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={confirmBlock}
            accessibilityRole="button"
            accessibilityLabel="Block this user"
          >
            <Text style={[styles.menuItemText, styles.menuItemDanger]}>Block</Text>
          </TouchableOpacity>
        </View>
      )}

      <FadeInView>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>{user.display_name[0]}</Text>
        </View>
        <Text style={styles.name} maxFontSizeMultiplier={1.3}>{user.display_name}</Text>
        <Text style={styles.username}>@{user.username}</Text>
        {!!user.bio && <Text style={styles.bio}>{user.bio}</Text>}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.followButton}
            onPress={() => followUser.mutate(userId)}
            accessibilityRole="button"
            accessibilityLabel={`Follow ${user.display_name}`}
          >
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() =>
              startConversation.mutate(userId, {
                onSuccess: (conversation) => navigation.navigate('Chat', { conversationId: conversation.id }),
              })
            }
            accessibilityRole="button"
            accessibilityLabel={`Message ${user.display_name}`}
          >
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
        </View>
      </FadeInView>

      <ReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        targetType="user"
        targetId={userId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.parchment },
  container: { flex: 1, backgroundColor: colors.parchment, paddingTop: 60, alignItems: 'center' },
  menuButton: { position: 'absolute', top: 56, right: space.lg, zIndex: 10, padding: space.xs },
  menuIcon: { fontSize: 24, color: colors.mutedText, fontWeight: '700' },
  menuDropdown: {
    position: 'absolute', top: 92, right: space.lg, zIndex: 10, backgroundColor: colors.card,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, minWidth: 140, elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  menuItem: { paddingVertical: space.sm, paddingHorizontal: space.md },
  menuItemText: { color: colors.text, fontSize: type.size.sm, fontWeight: '600' },
  menuItemDanger: { color: colors.danger },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.flame, alignItems: 'center', justifyContent: 'center', marginBottom: space.md },
  avatarInitial: { color: '#fff', fontSize: 32, fontWeight: '700' },
  name: { fontFamily: type.fontFamily.display, fontSize: type.size.lg, color: colors.indigo, textAlign: 'center' },
  username: { color: colors.mutedText, marginBottom: space.md },
  bio: { color: colors.text, textAlign: 'center', paddingHorizontal: space.xl, marginBottom: space.lg },
  buttonRow: { flexDirection: 'row', gap: space.sm },
  followButton: { backgroundColor: colors.indigo, borderRadius: radius.pill, paddingHorizontal: space.xl, paddingVertical: space.sm },
  followButtonText: { color: '#fff', fontWeight: '700' },
  messageButton: { backgroundColor: colors.flame, borderRadius: radius.pill, paddingHorizontal: space.xl, paddingVertical: space.sm },
  messageButtonText: { color: '#fff', fontWeight: '700' },
});
