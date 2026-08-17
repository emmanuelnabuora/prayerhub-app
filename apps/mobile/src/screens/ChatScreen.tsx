import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useMessages, useSendMessage, useMarkRead } from '../api/messages';
import { useMessagesSocket } from '../audio/useMessagesSocket';
import { colors, type, space, radius } from '../theme';

export default function ChatScreen({ route }: any) {
  const { conversationId } = route.params;
  const { data: messages } = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId);
  const markRead = useMarkRead(conversationId);
  const queryClient = useQueryClient();
  const [text, setText] = useState('');

  useEffect(() => { markRead.mutate(); }, [conversationId]);

  useMessagesSocket(conversationId, () => {
    queryClient.invalidateQueries({ queryKey: ['conversations', conversationId, 'messages'] });
  });

  const submit = () => {
    if (!text.trim()) return;
    sendMessage.mutate({ type: 'text', body: text }, { onSuccess: () => setText('') });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={messages}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: space.lg, paddingTop: 56 }}
        renderItem={({ item }: any) => (
          <View style={styles.bubbleRow} accessible accessibilityLabel={`${item.sender.displayName} said: ${item.body}`}>
            <Text style={styles.senderName}>{item.sender.displayName}</Text>
            <View style={styles.bubble}>
              <Text style={styles.bubbleText}>{item.body}</Text>
            </View>
          </View>
        )}
      />
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Message…"
          value={text}
          onChangeText={setText}
          onSubmitEditing={submit}
          accessibilityLabel="Message text"
        />
        <TouchableOpacity style={styles.sendButton} onPress={submit} accessibilityRole="button" accessibilityLabel="Send message">
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment },
  bubbleRow: { marginBottom: space.md },
  senderName: { fontSize: 11, color: colors.mutedText, marginBottom: 2 },
  bubble: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.md, alignSelf: 'flex-start', maxWidth: '85%', borderWidth: 1, borderColor: colors.cardBorder },
  bubbleText: { color: colors.text },
  composer: { flexDirection: 'row', padding: space.md, gap: space.sm, borderTopWidth: 1, borderTopColor: colors.divider },
  input: { flex: 1, backgroundColor: colors.card, borderRadius: radius.pill, paddingHorizontal: space.lg, paddingVertical: space.sm, borderWidth: 1, borderColor: colors.cardBorder },
  sendButton: { backgroundColor: colors.indigo, borderRadius: radius.pill, paddingHorizontal: space.lg, justifyContent: 'center' },
  sendButtonText: { color: '#fff', fontWeight: '700' },
});
