import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLogin, useRegister } from '../api/auth';
import { colors, type, space, radius, shadow } from '../theme';

// Single screen toggling between Login and Register — matches the onboarding
// principle of getting someone into the app fast rather than a multi-step wizard.
export default function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  const login = useLogin();
  const register = useRegister();
  const pending = login.isPending || register.isPending;
  const error = login.error || register.error;

  const submit = () => {
    if (mode === 'login') {
      login.mutate({ email, password });
    } else {
      register.mutate({ email, password, username, displayName });
    }
  };

  const errorMessage = (error as any)?.response?.data?.message ?? (error ? 'Something went wrong. Please try again.' : null);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={[colors.indigoDeep, colors.indigo]} style={styles.header}>
        <Text style={styles.wordmark} maxFontSizeMultiplier={1.3}>PrayerHub</Text>
        <Text style={styles.tagline} maxFontSizeMultiplier={1.4}>Pray Together. Grow Together. Believe Together.</Text>
      </LinearGradient>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
            onPress={() => setMode('login')}
            accessibilityRole="button"
            accessibilityLabel="Switch to login"
          >
            <Text style={mode === 'login' ? styles.modeTextActive : styles.modeText}>Log In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'register' && styles.modeTabActive]}
            onPress={() => setMode('register')}
            accessibilityRole="button"
            accessibilityLabel="Switch to register"
          >
            <Text style={mode === 'register' ? styles.modeTextActive : styles.modeText}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {mode === 'register' && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Display name"
              placeholderTextColor={colors.mutedText}
              value={displayName}
              onChangeText={setDisplayName}
              accessibilityLabel="Display name"
            />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={colors.mutedText}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              accessibilityLabel="Username"
            />
          </>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.mutedText}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          accessibilityLabel="Email"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.mutedText}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel="Password"
        />

        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={submit}
          disabled={pending}
          accessibilityRole="button"
          accessibilityLabel={mode === 'login' ? 'Log in' : 'Create account'}
        >
          {pending ? (
            <ActivityIndicator color={colors.indigo} />
          ) : (
            <Text style={styles.submitButtonText}>{mode === 'login' ? 'Log In' : 'Create Account'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.parchment },
  header: { paddingTop: 80, paddingBottom: space.xxl, paddingHorizontal: space.lg, alignItems: 'center' },
  wordmark: { fontFamily: type.fontFamily.display, fontSize: type.size.xxl, color: colors.textOnDark },
  tagline: {
    fontFamily: type.fontFamily.displayItalic, fontSize: type.size.base, color: colors.mutedTextOnDark,
    marginTop: space.sm, textAlign: 'center',
  },
  container: { flex: 1 },
  content: { padding: space.lg, paddingTop: space.xl },
  modeRow: {
    flexDirection: 'row', backgroundColor: colors.parchmentDeep, borderRadius: radius.pill,
    padding: 4, marginBottom: space.lg,
  },
  modeTab: { flex: 1, paddingVertical: space.sm, borderRadius: radius.pill, alignItems: 'center' },
  modeTabActive: { backgroundColor: colors.card, ...shadow.card },
  modeText: { color: colors.mutedText, fontWeight: '600', fontSize: type.size.base },
  modeTextActive: { color: colors.indigo, fontWeight: '700', fontSize: type.size.base },
  input: {
    backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder,
    padding: space.md, marginBottom: space.md, fontSize: type.size.base, color: colors.text,
  },
  errorText: { color: colors.danger, marginBottom: space.md, fontSize: type.size.sm },
  submitButton: {
    backgroundColor: colors.flame, borderRadius: radius.md, paddingVertical: space.md,
    alignItems: 'center', marginTop: space.sm, ...shadow.flameGlow,
  },
  submitButtonText: { color: colors.indigoDeep, fontWeight: '700', fontSize: type.size.base },
});
