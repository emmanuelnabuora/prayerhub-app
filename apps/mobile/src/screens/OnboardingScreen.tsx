import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUpdateProfile } from '../api/users';
import { colors, type, space, radius, shadow } from '../theme';

const INTERESTS = [
  { key: 'prayer', label: 'Prayer', icon: '🙏' },
  { key: 'bible_study', label: 'Bible Study', icon: '📖' },
  { key: 'worship', label: 'Worship', icon: '🎵' },
  { key: 'marriage_family', label: 'Marriage & Family', icon: '♡' },
  { key: 'youth', label: 'Youth', icon: '🧑' },
  { key: 'healing', label: 'Healing', icon: '🕊️' },
  { key: 'christian_growth', label: 'Christian Growth', icon: '🌱' },
  { key: 'ministry', label: 'Ministry', icon: '⛪' },
];

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<'welcome' | 'interests'>('welcome');
  const [selected, setSelected] = useState<string[]>([]);
  const updateProfile = useUpdateProfile();

  const toggle = (key: string) => {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const finish = () => {
    updateProfile.mutate({ interests: selected }, { onSuccess: onComplete });
  };

  if (step === 'welcome') {
    return (
      <LinearGradient colors={[colors.indigoDeep, colors.indigo]} style={styles.welcomeRoot}>
        <View style={styles.welcomeContent}>
          <Text style={styles.wordmark}>PrayerHub</Text>
          <Text style={styles.welcomeTitle} maxFontSizeMultiplier={1.3}>Welcome to{'\n'}PrayerHubApp</Text>
          <Text style={styles.tagline} maxFontSizeMultiplier={1.4}>
            Pray together.{'\n'}Grow together.{'\n'}Believe together.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={() => setStep('interests')}
          accessibilityRole="button"
          accessibilityLabel="Get started"
        >
          <Text style={styles.getStartedText}>Get Started →</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.interestsRoot}>
      <ScrollView contentContainerStyle={styles.interestsContent}>
        <Text style={styles.interestsTitle} maxFontSizeMultiplier={1.3}>What are you interested in?</Text>
        <Text style={styles.interestsSubtitle}>Select all that apply</Text>
        <View style={styles.grid}>
          {INTERESTS.map((item) => {
            const isSelected = selected.includes(item.key);
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.interestChip, isSelected && styles.interestChipSelected]}
                onPress={() => toggle(item.key)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={item.label}
              >
                <Text style={styles.interestIcon}>{item.icon}</Text>
                <Text style={isSelected ? styles.interestLabelSelected : styles.interestLabel}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      <TouchableOpacity
        style={styles.continueButton}
        onPress={finish}
        disabled={updateProfile.isPending}
        accessibilityRole="button"
        accessibilityLabel="Continue"
      >
        {updateProfile.isPending ? (
          <ActivityIndicator color={colors.indigoDeep} />
        ) : (
          <Text style={styles.continueText}>Continue →</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  welcomeRoot: { flex: 1, justifyContent: 'space-between', paddingTop: 100, paddingBottom: 60, paddingHorizontal: space.xl },
  welcomeContent: { alignItems: 'center' },
  wordmark: { fontFamily: type.fontFamily.display, fontSize: type.size.lg, color: colors.flame, marginBottom: space.xxl },
  welcomeTitle: {
    fontFamily: type.fontFamily.display, fontSize: type.size.xxl, color: colors.textOnDark,
    textAlign: 'center', marginBottom: space.xl, lineHeight: type.size.xxl * 1.25,
  },
  tagline: {
    fontFamily: type.fontFamily.displayItalic, fontSize: type.size.md, color: colors.mutedTextOnDark,
    textAlign: 'center', lineHeight: type.size.md * type.lineHeight.relaxed,
  },
  getStartedButton: { backgroundColor: colors.flame, borderRadius: radius.md, paddingVertical: space.md, alignItems: 'center' },
  getStartedText: { color: colors.indigoDeep, fontWeight: '700', fontSize: type.size.base },
  interestsRoot: { flex: 1, backgroundColor: colors.parchment },
  interestsContent: { padding: space.lg, paddingTop: 72 },
  interestsTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.xl, color: colors.indigo, marginBottom: space.xs },
  interestsSubtitle: { color: colors.mutedText, fontSize: type.size.base, marginBottom: space.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  interestChip: {
    flexDirection: 'row', alignItems: 'center', gap: space.xs,
    backgroundColor: colors.card, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: space.sm,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  interestChipSelected: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  interestIcon: { fontSize: 16 },
  interestLabel: { color: colors.text, fontWeight: '600', fontSize: type.size.sm },
  interestLabelSelected: { color: colors.flame, fontWeight: '700', fontSize: type.size.sm },
  continueButton: { backgroundColor: colors.flame, borderRadius: radius.md, paddingVertical: space.md, alignItems: 'center', margin: space.lg },
  continueText: { color: colors.indigoDeep, fontWeight: '700', fontSize: type.size.base },
});
