import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useFollowUser } from '../api/social';
import { useStartDirectConversation } from '../api/messages';
import { colors, type, space, radius } from '../theme';
import FadeInView from '../components/FadeInView';
import FlameMark from '../components/FlameMark';

export default function UserProfileScreen({ route, navigation }: any) {
  const { userId } = route.params;
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => (await api.get(`/users/${userId}`)).data,
  });
  const followUser = useFollowUser();
  const startConversation = useStartDirectConversation();

  if (isLoading || !user) return <View style={styles.loadingRoot}><FlameMark size={40} /></View>;

  return (
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.parchment },
  container: { flex: 1, backgroundColor: colors.parchment, paddingTop: 60, alignItems: 'center' },
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
