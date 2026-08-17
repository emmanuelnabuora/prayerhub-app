import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { useJournal, useCreateJournalEntry, useMarkAnswered, useConvertToTestimony } from '../api/journal';
import { colors, type, space, radius, shadow } from '../theme';
import FadeInView from '../components/FadeInView';
import FlameMark from '../components/FlameMark';

export default function JournalScreen() {
  const { data: entries, isLoading } = useJournal();
  const createEntry = useCreateJournalEntry();
  const markAnswered = useMarkAnswered();
  const convertToTestimony = useConvertToTestimony();
  const [body, setBody] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Prayer Journal</Text>
      <Text style={styles.headerSubtitle}>A private space, just between you and God</Text>

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="What are you praying about?"
          value={body}
          onChangeText={setBody}
          multiline
          accessibilityLabel="New journal entry"
        />
        <TouchableOpacity
          style={styles.addButton}
          disabled={!body.trim() || createEntry.isPending}
          onPress={() => createEntry.mutate({ body }, { onSuccess: () => setBody('') })}
          accessibilityRole="button"
          accessibilityLabel="Add journal entry"
        >
          {createEntry.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.addButtonText}>Add Entry</Text>}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingState}><FlameMark /></View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ padding: space.lg }}
          renderItem={({ item, index }: any) => (
            <FadeInView delay={Math.min(index, 6) * 40}>
              <View style={styles.card}>
                <Text style={styles.statusBadge}>{item.status}</Text>
                <Text style={styles.cardBody}>{item.body}</Text>
                {item.status !== 'answered' ? (
                  <TouchableOpacity onPress={() => markAnswered.mutate(item.id)} accessibilityRole="button" accessibilityLabel="Mark this prayer as answered">
                    <Text style={styles.actionLink}>Mark as answered</Text>
                  </TouchableOpacity>
                ) : !item.converted_to_testimony_id ? (
                  <TouchableOpacity onPress={() => convertToTestimony.mutate(item.id)} accessibilityRole="button" accessibilityLabel="Share this answered prayer as a testimony">
                    <Text style={styles.actionLink}>Share as testimony</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.sharedText}>Shared as a testimony</Text>
                )}
              </View>
            </FadeInView>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FlameMark size={32} />
              <Text style={styles.emptyText}>Your journal is empty — start with one line.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment, paddingTop: 56 },
  headerTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.xl, color: colors.indigo, paddingHorizontal: space.lg },
  headerSubtitle: { color: colors.mutedText, paddingHorizontal: space.lg, marginTop: 2, marginBottom: space.md, fontSize: type.size.sm },
  composer: { paddingHorizontal: space.lg, marginBottom: space.sm },
  input: { backgroundColor: colors.card, borderRadius: radius.sm, padding: space.md, minHeight: 60, textAlignVertical: 'top', borderWidth: 1, borderColor: colors.cardBorder },
  addButton: { backgroundColor: colors.indigo, borderRadius: radius.sm, padding: space.sm, alignItems: 'center', marginTop: space.sm },
  addButtonText: { color: '#fff', fontWeight: '700' },
  loadingState: { alignItems: 'center', marginTop: 40 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, marginBottom: space.md, borderWidth: 1, borderColor: colors.cardBorder, ...shadow.card },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: colors.parchment, color: colors.indigo, fontSize: 11, fontWeight: '700', paddingHorizontal: space.sm, paddingVertical: 3, borderRadius: radius.sm, marginBottom: space.sm, textTransform: 'uppercase' },
  cardBody: { color: colors.text, marginBottom: space.sm, lineHeight: type.size.base * type.lineHeight.normal },
  actionLink: { color: colors.flameDeep, fontWeight: '700' },
  sharedText: { color: colors.mutedText, fontStyle: 'italic' },
  emptyState: { alignItems: 'center', marginTop: 40, paddingHorizontal: space.xl },
  emptyText: { textAlign: 'center', color: colors.mutedText, marginTop: space.md, fontSize: type.size.base },
});
