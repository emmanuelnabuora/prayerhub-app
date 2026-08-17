import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useBibleBooks, useBibleChapter, useAddBookmark } from '../api/bible';
import { colors, type, space, radius } from '../theme';
import FlameMark from '../components/FlameMark';

export default function BibleReaderScreen({ route }: any) {
  const initial = route?.params ?? {};
  const [bookId, setBookId] = useState(initial.bookId ?? 'JHN');
  const [chapter, setChapter] = useState(initial.chapter ?? 3);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: books } = useBibleBooks();
  const { data: passage, isLoading } = useBibleChapter(bookId, chapter);
  const addBookmark = useAddBookmark();

  const bookName = books?.find((b: any) => b.id === bookId)?.name ?? bookId;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.chapterPicker}
          onPress={() => setPickerOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={`${bookName} chapter ${chapter}. Tap to change book`}
        >
          <Text style={styles.chapterPickerText}>{bookName} {chapter} ▾</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => addBookmark.mutate({ bookId, chapter, verseStart: 1, referenceLabel: `${bookName} ${chapter}` })}
          accessibilityRole="button"
          accessibilityLabel={`Save ${bookName} ${chapter} to bookmarks`}
        >
          <Text style={styles.bookmarkAction}>🔖 Save</Text>
        </TouchableOpacity>
      </View>

      {pickerOpen && (
        <ScrollView horizontal style={styles.bookRow} showsHorizontalScrollIndicator={false}>
          {books?.map((b: any) => (
            <TouchableOpacity
              key={b.id}
              style={[styles.bookChip, b.id === bookId && styles.bookChipActive]}
              onPress={() => { setBookId(b.id); setChapter(1); setPickerOpen(false); }}
              accessibilityRole="button"
              accessibilityLabel={`Open ${b.name}`}
            >
              <Text style={b.id === bookId ? styles.bookChipTextActive : styles.bookChipText}>{b.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {isLoading ? (
        <View style={styles.loadingState}><FlameMark size={32} /></View>
      ) : (
        <ScrollView style={styles.passageScroll} contentContainerStyle={{ padding: space.xl }}>
          <Text style={styles.passageText} maxFontSizeMultiplier={1.6}>{passage?.text}</Text>
          {passage?.copyright && <Text style={styles.copyright}>{passage.copyright}</Text>}
        </ScrollView>
      )}

      <View style={styles.chapterNav}>
        <TouchableOpacity onPress={() => setChapter((c: number) => Math.max(1, c - 1))} accessibilityRole="button" accessibilityLabel="Previous chapter">
          <Text style={styles.navButton}>‹ Prev</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setChapter((c: number) => c + 1)} accessibilityRole="button" accessibilityLabel="Next chapter">
          <Text style={styles.navButton}>Next ›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment, paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.lg, marginBottom: space.sm },
  chapterPicker: {},
  chapterPickerText: { fontFamily: type.fontFamily.display, fontSize: type.size.lg, color: colors.indigo },
  bookmarkAction: { color: colors.flameDeep, fontWeight: '700' },
  bookRow: { paddingHorizontal: space.lg, marginBottom: space.sm, maxHeight: 40 },
  bookChip: { borderWidth: 1, borderColor: colors.divider, borderRadius: radius.lg, paddingHorizontal: space.md, paddingVertical: 6, marginRight: 6 },
  bookChipActive: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  bookChipText: { color: colors.text, fontSize: type.size.sm },
  bookChipTextActive: { color: '#fff', fontSize: type.size.sm },
  loadingState: { alignItems: 'center', marginTop: 60 },
  passageScroll: { flex: 1 },
  passageText: {
    fontFamily: type.fontFamily.displayItalic, fontSize: type.size.md, color: colors.text,
    lineHeight: type.size.md * type.lineHeight.relaxed,
  },
  copyright: { marginTop: space.lg, fontSize: 11, color: colors.mutedText, fontStyle: 'italic' },
  chapterNav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.xl, paddingVertical: space.lg },
  navButton: { color: colors.indigo, fontWeight: '700', fontSize: type.size.base },
});
