import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCreateReport } from '../api/moderation';
import { colors, type, space, radius } from '../theme';

const REASONS = ['Harassment', 'Spam', 'Hate or abuse', 'Sexual content', 'Fraud or scam', 'Dangerous content', 'Other'];

// A single reusable modal for reporting any kind of content — the backend's
// CreateReportDto already accepts a generic targetType/targetId, so this
// component just needs to be told what it's reporting, not duplicated per
// screen. Drop it into any screen with content from other users.
export default function ReportModal({
  visible, onClose, targetType, targetId,
}: {
  visible: boolean;
  onClose: () => void;
  targetType: 'user' | 'prayer_request' | 'comment' | 'message' | 'room' | 'post' | 'testimony';
  targetId: string;
}) {
  const insets = useSafeAreaInsets();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const createReport = useCreateReport();

  const submit = () => {
    if (!selectedReason) return;
    const reason = details.trim() ? `${selectedReason}: ${details.trim()}` : selectedReason;
    createReport.mutate(
      { targetType, targetId, reason },
      {
        onSuccess: () => {
          setSelectedReason(null);
          setDetails('');
          onClose();
          Alert.alert('Report submitted', 'Thank you — our moderation team will review this.');
        },
      },
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={[styles.card, { paddingBottom: space.xl + insets.bottom }]}>
          <Text style={styles.title}>Report content</Text>
          <Text style={styles.subtitle}>Why are you reporting this?</Text>

          <View style={styles.reasonList}>
            {REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[styles.reasonChip, selectedReason === reason && styles.reasonChipSelected]}
                onPress={() => setSelectedReason(reason)}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedReason === reason }}
              >
                <Text style={selectedReason === reason ? styles.reasonTextSelected : styles.reasonText}>{reason}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Additional details (optional)"
            value={details}
            onChangeText={setDetails}
            multiline
            accessibilityLabel="Additional report details"
          />

          <TouchableOpacity
            style={[styles.submitButton, !selectedReason && styles.submitButtonDisabled]}
            onPress={submit}
            disabled={!selectedReason || createReport.isPending}
            accessibilityRole="button"
            accessibilityLabel="Submit report"
          >
            <Text style={styles.submitText}>Submit Report</Text>
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
  overlay: { flex: 1, backgroundColor: 'rgba(31,30,51,0.45)', justifyContent: 'center', alignItems: 'center', padding: space.lg },
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: space.xl, width: '100%', maxWidth: 420 },
  title: { fontFamily: type.fontFamily.display, fontSize: type.size.lg, color: colors.indigo, marginBottom: 4 },
  subtitle: { color: colors.mutedText, fontSize: type.size.sm, marginBottom: space.md },
  reasonList: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginBottom: space.md },
  reasonChip: { backgroundColor: colors.parchment, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: space.sm, borderWidth: 1, borderColor: colors.cardBorder },
  reasonChipSelected: { backgroundColor: colors.danger, borderColor: colors.danger },
  reasonText: { color: colors.text, fontSize: type.size.sm, fontWeight: '600' },
  reasonTextSelected: { color: '#fff', fontSize: type.size.sm, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: colors.divider, borderRadius: radius.sm, padding: space.md, marginBottom: space.md },
  textArea: { height: 70, textAlignVertical: 'top' },
  submitButton: { backgroundColor: colors.danger, borderRadius: radius.md, padding: space.md, alignItems: 'center' },
  submitButtonDisabled: { opacity: 0.4 },
  submitText: { color: '#fff', fontWeight: '700' },
  cancelText: { textAlign: 'center', color: colors.mutedText, marginTop: space.sm },
});
