import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

// A crash in a standalone build otherwise exits silently with nothing to
// debug — no Metro terminal exists once JS is bundled into the APK. This
// shows the actual error and stack on-screen so we can see what broke.
export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView style={styles.root} contentContainerStyle={styles.content}>
          <Text style={styles.title}>Something crashed</Text>
          <Text style={styles.message}>{this.state.error.message}</Text>
          <Text style={styles.stack}>{this.state.error.stack}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a0000' },
  content: { padding: 20, paddingTop: 60 },
  title: { color: '#ff6b6b', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  message: { color: '#fff', fontSize: 14, marginBottom: 20 },
  stack: { color: '#ffaaaa', fontSize: 11, fontFamily: 'monospace' },
});
