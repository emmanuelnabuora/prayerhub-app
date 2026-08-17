import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Modal, ActivityIndicator } from 'react-native';
import { useFeed, useCreatePost, useReactToPost } from '../api/social';
import { colors, type, space, radius, shadow } from '../theme';
import FadeInView from '../components/FadeInView';
import FlameMark from '../components/FlameMark';

export default function FeedScreen() {
  const { data: posts, isLoading } = useFeed();
  const react = useReactToPost();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <TouchableOpacity style={styles.newButton} onPress={() => setModalVisible(true)} accessibilityRole="button" accessibilityLabel="Share a new post">
          <Text style={styles.newButtonText}>+ Post</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingState}><FlameMark /></View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ padding: space.lg }}
          renderItem={({ item, index }: any) => (
            <FadeInView delay={Math.min(index, 6) * 40}>
              <View style={styles.card}>
                <Text style={styles.cardAuthor}>{item.author.displayName}</Text>
                {item.type === 'scripture' && <Text style={styles.scriptureRef}>{item.scriptureReference}</Text>}
                {!!item.body && <Text style={styles.cardBody}>{item.body}</Text>}
                {item.type === 'audio' && item.media && (
                  <View style={styles.audioChip}>
                    <Text style={styles.audioChipText}>🎙️ Audio · {item.media.durationSeconds ?? '—'}s</Text>
                  </View>
                )}
                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    onPress={() => react.mutate({ postId: item.id, type: 'amen' })}
                    accessibilityRole="button"
                    accessibilityLabel="Say amen to this post"
                  >
                    <Text style={styles.reactionButton}>🙌 Amen</Text>
                  </TouchableOpacity>
                  <Text style={styles.cardMeta}>{item.reactionCount} · {item.commentCount} comments</Text>
                </View>
              </View>
            </FadeInView>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FlameMark size={32} />
              <Text style={styles.emptyText}>The feed is quiet — be the first to share something.</Text>
            </View>
          }
        />
      )}

      <NewPostModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

function NewPostModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [type_, setType] = useState<'text' | 'scripture'>('text');
  const [body, setBody] = useState('');
  const [scriptureReference, setScriptureReference] = useState('');
  const createPost = useCreatePost();

  const submit = () => {
    createPost.mutate(
      type_ === 'scripture' ? { type: type_, scriptureReference, body } : { type: 'text', body },
      { onSuccess: () => { setBody(''); setScriptureReference(''); onClose(); } },
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Share with the Community</Text>
          <View style={styles.typeRow}>
            {(['text', 'scripture'] as const).map((t) => (
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
          {type_ === 'scripture' && (
            <TextInput style={styles.input} placeholder="Reference (e.g. John 3:16)" value={scriptureReference} onChangeText={setScriptureReference} accessibilityLabel="Scripture reference" />
          )}
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={type_ === 'scripture' ? 'Why this verse encourages you (optional)' : "What's on your heart?"}
            value={body}
            onChangeText={setBody}
            multiline
            accessibilityLabel="Post content"
          />
          <TouchableOpacity style={styles.submitButton} onPress={submit} disabled={createPost.isPending} accessibilityRole="button" accessibilityLabel="Post">
            {createPost.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Post</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Cancel"><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: space.lg, paddingTop: 56 },
  headerTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.xl, color: colors.indigo },
  newButton: { backgroundColor: colors.flame, paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.pill },
  newButtonText: { color: '#fff', fontWeight: '700', fontSize: type.size.sm },
  loadingState: { alignItems: 'center', marginTop: 60 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, marginBottom: space.md, borderWidth: 1, borderColor: colors.cardBorder, ...shadow.card },
  cardAuthor: { color: colors.mutedText, fontSize: type.size.xs, marginBottom: 4 },
  scriptureRef: { color: colors.flameDeep, fontWeight: '700', marginBottom: 4 },
  cardBody: { color: colors.text, marginBottom: space.sm, lineHeight: type.size.base * type.lineHeight.normal },
  audioChip: { backgroundColor: colors.parchment, borderRadius: radius.sm, padding: space.sm, marginBottom: space.sm, alignSelf: 'flex-start' },
  audioChipText: { color: colors.indigo, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reactionButton: { color: colors.indigo, fontWeight: '700' },
  cardMeta: { color: colors.mutedText, fontSize: type.size.xs },
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: space.xl },
  emptyText: { textAlign: 'center', color: colors.mutedText, marginTop: space.md, fontSize: type.size.base },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(31,30,51,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.xl },
  modalTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.lg, marginBottom: space.md, color: colors.indigo },
  typeRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  typeChip: { borderWidth: 1, borderColor: colors.divider, borderRadius: radius.lg, paddingHorizontal: space.md, paddingVertical: 6 },
  typeChipActive: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  typeText: { color: colors.text },
  typeTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: colors.divider, borderRadius: radius.sm, padding: space.md, marginBottom: space.sm },
  textArea: { height: 90, textAlignVertical: 'top' },
  submitButton: { backgroundColor: colors.indigo, borderRadius: radius.md, padding: space.md, alignItems: 'center', marginBottom: space.sm },
  submitButtonText: { color: '#fff', fontWeight: '700' },
  cancelText: { textAlign: 'center', color: colors.mutedText },
});
