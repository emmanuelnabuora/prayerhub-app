import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { useAskAssistant, useStudyQuestions, useDevotionalPrompt, useStructurePrayer } from '../api/ai';
import { colors, type, space, radius, shadow } from '../theme';
import FadeInView from '../components/FadeInView';
import FlameMark from '../components/FlameMark';

type Mode = 'ask' | 'study' | 'devotional' | 'prayer';

// A single-purpose "study & prayer companion" screen — not a general chatbot.
// The disclaimer banner is permanent and visually load-bearing (border,
// distinct background), not a light aside — it should never read as
// dismissible, matching the safety framing already enforced server-side in
// apps/api/src/ai/assistant.prompts.ts.
export default function AssistantScreen() {
  const [mode, setMode] = useState<Mode>('ask');
  const [input, setInput] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);

  const ask = useAskAssistant();
  const studyQuestions = useStudyQuestions();
  const devotionalPrompt = useDevotionalPrompt();
  const structurePrayer = useStructurePrayer();

  const isPending = ask.isPending || studyQuestions.isPending || devotionalPrompt.isPending || structurePrayer.isPending;

  const submit = () => {
    setAnswer(null);
    if (mode === 'ask') ask.mutate({ question: input }, { onSuccess: (r) => setAnswer(r.answer) });
    if (mode === 'study') studyQuestions.mutate({ passage: input }, { onSuccess: (r) => setAnswer(r.answer) });
    if (mode === 'devotional') devotionalPrompt.mutate({ theme: input || undefined }, { onSuccess: (r) => setAnswer(r.answer) });
    if (mode === 'prayer') structurePrayer.mutate({ situation: input }, { onSuccess: (r) => setAnswer(r.answer) });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: 56, paddingBottom: space.xxl }}>
      <FadeInView>
        <Text style={styles.title}>PrayerHub Assistant</Text>
        <View style={styles.disclaimer} accessibilityRole="text">
          <Text style={styles.disclaimerText}>
            A study tool, not a prophet — responses are generated, always cite Scripture
            separately from commentary, and are never God's direct word to you. For pastoral
            guidance, talk with a pastor or trusted leader.
          </Text>
        </View>
      </FadeInView>

      <View style={styles.modeRow} accessibilityRole="tablist">
        {([
          { key: 'ask', label: 'Ask' },
          { key: 'study', label: 'Study Qs' },
          { key: 'devotional', label: 'Devotional' },
          { key: 'prayer', label: 'Structure Prayer' },
        ] as const).map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[styles.modeChip, mode === m.key && styles.modeChipActive]}
            onPress={() => { setMode(m.key); setAnswer(null); }}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === m.key }}
          >
            <Text style={mode === m.key ? styles.modeTextActive : styles.modeText}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder={
          mode === 'ask' ? 'Ask about a passage, topic, or word study…' :
          mode === 'study' ? 'A passage, e.g. Romans 8:28-39' :
          mode === 'devotional' ? 'A theme (optional), e.g. gratitude' :
          'What would you like to pray about?'
        }
        value={input}
        onChangeText={setInput}
        multiline
        accessibilityLabel="Your question or topic"
      />
      <TouchableOpacity
        style={styles.submitButton}
        onPress={submit}
        disabled={isPending || (!input.trim() && mode !== 'devotional')}
        accessibilityRole="button"
        accessibilityLabel="Ask the assistant"
      >
        {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Go</Text>}
      </TouchableOpacity>

      {isPending && <View style={styles.loadingState}><FlameMark size={28} /></View>}
      {answer && (
        <FadeInView>
          <View style={styles.answerCard}>
            <Text style={styles.answerText} maxFontSizeMultiplier={1.5}>{answer}</Text>
          </View>
        </FadeInView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment, paddingHorizontal: space.lg },
  title: { fontFamily: type.fontFamily.display, fontSize: type.size.xl, color: colors.indigo, marginBottom: space.sm },
  disclaimer: { backgroundColor: '#EFE6D8', borderRadius: radius.sm, borderWidth: 1, borderColor: colors.flame, padding: space.md, marginBottom: space.lg },
  disclaimerText: { color: colors.text, fontSize: type.size.xs, lineHeight: 18 },
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.md },
  modeChip: { borderWidth: 1, borderColor: colors.divider, borderRadius: radius.lg, paddingHorizontal: space.md, paddingVertical: 6 },
  modeChipActive: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  modeText: { color: colors.text, fontSize: type.size.sm },
  modeTextActive: { color: '#fff', fontSize: type.size.sm },
  input: { borderWidth: 1, borderColor: colors.divider, borderRadius: radius.sm, padding: space.md, backgroundColor: colors.card, marginBottom: space.sm },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  submitButton: { backgroundColor: colors.flame, borderRadius: radius.md, padding: space.md, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontWeight: '700' },
  loadingState: { alignItems: 'center', marginTop: space.lg },
  answerCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, marginTop: space.lg, borderWidth: 1, borderColor: colors.cardBorder, ...shadow.card },
  answerText: { color: colors.text, lineHeight: type.size.base * type.lineHeight.relaxed },
});
