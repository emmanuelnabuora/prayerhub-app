import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

// Same shape as useLiveSocket — a thin real-time layer on top of the REST
// endpoints that remain the actual source of truth and authorization boundary
// (see apps/api/src/messages/messages.gateway.ts).
export function useMessagesSocket(conversationId: string | undefined, onNewMessage: (msg: any) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;

    (async () => {
      const token = await SecureStore.getItemAsync('accessToken');
      if (cancelled) return;
      const base = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1').replace('/api/v1', '');
      const socket = io(`${base}/messages`, { auth: { token } });
      socketRef.current = socket;
      socket.emit('join_conversation', { conversationId });
      socket.on('new_message', onNewMessage);
    })();

    return () => { cancelled = true; socketRef.current?.disconnect(); };
  }, [conversationId]);
}
