import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useConversations } from '../api/messages';
import { colors, type, space, radius } from '../theme';
import FadeInView from '../components/FadeInView';
import FlameMark from '../components/FlameMark';

export default function ConversationsScreen({ navigation }: any) {
  const { data: conversations, isLoading } = useConversations();

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Messages</Text>
      {isLoading ? (
        <View style={styles.loadingState}><FlameMark /></View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ padding: space.lg }}
          renderItem={({ item, index }: any) => (
            <FadeInView delay={Math.min(index, 6) * 40}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => navigation.navigate('Chat', { conversationId: item.id })}
                accessibilityRole="button"
                accessibilityLabel={`Conversation: ${item.title ?? 'Direct message'}${Number(item.unread_count) > 0 ? `, ${item.unread_count} unread` : ''}`}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item.title ?? 'Direct Message'}</Text>
                  <Text style={styles.preview} numberOfLines={1}>{item.last_message_body ?? 'Say hello 👋'}</Text>
                </View>
                {Number(item.unread_count) > 0 && (
                  <View style={styles.unreadBadge}><Text style={styles.unreadText}>{item.unread_count}</Text></View>
                )}
              </TouchableOpacity>
            </FadeInView>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FlameMark size={32} />
              <Text style={styles.emptyText}>No conversations yet — message someone from their profile.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment, paddingTop: 56 },
  headerTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.xl, color: colors.indigo, paddingHorizontal: space.lg, marginBottom: space.sm },
  loadingState: { alignItems: 'center', marginTop: 60 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, marginBottom: space.sm, borderWidth: 1, borderColor: colors.cardBorder },
  title: { fontWeight: '700', color: colors.text },
  preview: { color: colors.mutedText, fontSize: type.size.sm, marginTop: 2 },
  unreadBadge: { backgroundColor: colors.flame, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: space.xl },
  emptyText: { textAlign: 'center', color: colors.mutedText, marginTop: space.md, fontSize: type.size.base },
});
