import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { usePrayerFeed, useMarkPrayed, useCreatePrayerRequest } from '../api/prayers';
import { colors, type, space, radius, shadow } from '../theme';
import FadeInView from '../components/FadeInView';
import FlameMark from '../components/FlameMark';

// Prayer cards echo the landing page's corkboard note cards — a warm card
// with a small accent tab, handwritten-feeling italic Fraunces for the
// prayer's own words, and a quiet "I Prayed" interaction rather than a loud
// like button, matching the product's explicit "avoid popularity contests"
// principle for sensitive prayer content.
export default function PrayScreen() {
  const { data: prayers, isLoading } = usePrayerFeed();
  const markPrayed = useMarkPrayed();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Prayer Requests</Text>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Share a new prayer request"
        >
          <Text style={styles.newButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingState}><FlameMark /></View>
      ) : (
        <FlatList
          data={prayers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: space.lg }}
          renderItem={({ item, index }) => (
            <FadeInView delay={Math.min(index, 6) * 40}>
              <View style={styles.card}>
                <View style={styles.cardAccent} accessibilityElementsHidden importantForAccessibility="no" />
                <View style={styles.cardBody}>
                  <Text style={styles.cardAuthor}>
                    {item.author.anonymous ? 'Anonymous' : item.author.displayName}
                  </Text>
                  <Text style={styles.cardTitle} maxFontSizeMultiplier={1.4}>{item.title}</Text>
                  <Text style={styles.cardText} maxFontSizeMultiplier={1.5}>{item.description}</Text>
                  <View style={styles.cardFooter}>
                    <TouchableOpacity
                      style={[styles.prayButton, item.viewerHasPrayed && styles.prayButtonActive]}
                      disabled={item.viewerHasPrayed}
                      onPress={() => markPrayed.mutate(item.id)}
                      accessibilityRole="button"
                      accessibilityLabel={item.viewerHasPrayed ? 'You have prayed for this request' : 'Mark that you prayed for this request'}
                      accessibilityState={{ disabled: item.viewerHasPrayed }}
                    >
                      <Text style={styles.prayButtonText}>
                        🙏 {item.viewerHasPrayed ? 'Prayed' : 'I Prayed'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.prayedCount}>{item.prayedCount} people prayed</Text>
                  </View>
                </View>
              </View>
            </FadeInView>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FlameMark size={32} />
              <Text style={styles.emptyText}>No prayer requests yet — be the first to share one.</Text>
            </View>
          }
        />
      )}

      <NewPrayerModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

function NewPrayerModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const createPrayer = useCreatePrayerRequest();

  const submit = () => {
    if (!title.trim() || !description.trim()) return;
    Keyboard.dismiss();
    createPrayer.mutate(
      { title, description, visibility },
      { onSuccess: () => { setTitle(''); setDescription(''); onClose(); } },
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Share a Prayer Request</Text>
          <TextInput
            style={styles.input}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            accessibilityLabel="Prayer request title"
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What's on your heart?"
            value={description}
            onChangeText={setDescription}
            multiline
            accessibilityLabel="Prayer request details"
          />
          <View style={styles.visibilityRow}>
            {(['public', 'followers', 'private'] as const).map((v) => (
              <TouchableOpacity
                key={v}
                style={[styles.visibilityChip, visibility === v && styles.visibilityChipActive]}
                onPress={() => setVisibility(v)}
                accessibilityRole="radio"
                accessibilityState={{ selected: visibility === v }}
                accessibilityLabel={`Visibility: ${v}`}
              >
                <Text style={visibility === v ? styles.visibilityTextActive : styles.visibilityText}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={submit}
            disabled={createPrayer.isPending}
            accessibilityRole="button"
            accessibilityLabel="Post prayer request"
          >
            {createPrayer.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Post Request</Text>}
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
  container: { flex: 1, backgroundColor: colors.parchment },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: space.lg, paddingTop: 56,
  },
  headerTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.xl, color: colors.indigo },
  newButton: { backgroundColor: colors.flame, paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.pill },
  newButtonText: { color: '#fff', fontWeight: '700', fontSize: type.size.sm },
  loadingState: { alignItems: 'center', marginTop: 60 },
  card: {
    flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.lg,
    marginBottom: space.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.cardBorder, ...shadow.card,
  },
  cardAccent: { width: 4, backgroundColor: colors.flame },
  cardBody: { flex: 1, padding: space.lg },
  cardAuthor: { color: colors.mutedText, fontSize: type.size.xs, marginBottom: 4 },
  cardTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.md, color: colors.text, marginBottom: 6 },
  cardText: {
    color: colors.text, marginBottom: space.md, fontSize: type.size.base,
    lineHeight: type.size.base * type.lineHeight.normal,
  },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prayButton: { backgroundColor: colors.parchment, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 6 },
  prayButtonActive: { backgroundColor: colors.flameGlow },
  prayButtonText: { color: colors.indigo, fontWeight: '700', fontSize: type.size.sm },
  prayedCount: { color: colors.mutedText, fontSize: type.size.xs },
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: space.xl },
  emptyText: { textAlign: 'center', color: colors.mutedText, marginTop: space.md, fontSize: type.size.base },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(31,30,51,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.xl },
  modalTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.lg, marginBottom: space.md, color: colors.indigo },
  input: { borderWidth: 1, borderColor: colors.divider, borderRadius: radius.sm, padding: space.md, marginBottom: space.sm },
  textArea: { height: 90, textAlignVertical: 'top' },
  visibilityRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.lg },
  visibilityChip: { borderWidth: 1, borderColor: colors.divider, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 6 },
  visibilityChipActive: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  visibilityText: { color: colors.text },
  visibilityTextActive: { color: '#fff' },
  submitButton: { backgroundColor: colors.indigo, borderRadius: radius.md, padding: space.md, alignItems: 'center', marginBottom: space.sm },
  submitButtonText: { color: '#fff', fontWeight: '700' },
  cancelText: { textAlign: 'center', color: colors.mutedText },
});
