import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../api/notifications';
import { colors, type, space, radius, shadow } from '../theme';
import FlameMark from '../components/FlameMark';

// type+payload rows are generic on the backend; this map is the one place
// that turns a notification's raw type string into copy a human reads.
// Payload shape is intentionally loose (Record<string, any>) since different
// notification types carry different fields.
function describeNotification(n: { type: string; payload: any }): string {
  switch (n.type) {
    case 'prayer_received':
      return 'Someone prayed for your request 🙏';
    case 'new_follower':
      return 'You have a new follower';
    case 'room_live':
      return `${n.payload?.title ?? 'A room you follow'} just went live 🔴`;
    case 'group_join_approved':
      return `You were approved to join ${n.payload?.groupName ?? 'a group'}`;
    case 'testimony_encouragement':
      return n.payload?.type === 'amen' ? 'Someone said Amen to your testimony 🙌' : 'Someone encouraged your testimony 💛';
    default:
      return 'You have a new notification';
  }
}

export default function NotificationsScreen() {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const hasUnread = notifications?.some((n: any) => !n.readAt);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {hasUnread && (
          <TouchableOpacity
            onPress={() => markAllRead.mutate()}
            accessibilityRole="button"
            accessibilityLabel="Mark all notifications as read"
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingState}><FlameMark /></View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ padding: space.lg }}
          renderItem={({ item }: any) => (
            <TouchableOpacity
              style={[styles.card, !item.readAt && styles.cardUnread]}
              onPress={() => !item.readAt && markRead.mutate(item.id)}
              accessibilityRole="button"
              accessibilityLabel={describeNotification(item)}
            >
              {!item.readAt && <View style={styles.unreadDot} accessibilityElementsHidden importantForAccessibility="no" />}
              <Text style={styles.cardText}>{describeNotification(item)}</Text>
              <Text style={styles.cardTime}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FlameMark size={32} />
              <Text style={styles.emptyText}>No notifications yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: space.lg, paddingTop: 56,
  },
  headerTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.xl, color: colors.indigo },
  markAllText: { color: colors.flameDeep, fontWeight: '600', fontSize: type.size.sm },
  loadingState: { alignItems: 'center', marginTop: 60 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md,
    padding: space.md, marginBottom: space.sm, borderWidth: 1, borderColor: colors.cardBorder, ...shadow.card,
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: colors.flame },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.flame, marginRight: space.sm },
  cardText: { flex: 1, color: colors.text, fontSize: type.size.base },
  cardTime: { color: colors.mutedText, fontSize: type.size.xs, marginLeft: space.sm },
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: space.xl },
  emptyText: { textAlign: 'center', color: colors.mutedText, marginTop: space.md, fontSize: type.size.base },
});
