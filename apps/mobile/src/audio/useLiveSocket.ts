import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

// App-state events only (hand-raise, joins, reactions) — see the matching
// comment in apps/api/src/live/live.gateway.ts. Audio itself is handled by
// useLiveKitRoom below, talking directly to the SFU.
export function useLiveSocket(roomId: string | undefined, handlers: {
  onParticipantJoined?: (data: any) => void;
  onParticipantLeft?: (data: any) => void;
  onHandRaised?: (data: any) => void;
  onRoleChanged?: (data: any) => void;
  onParticipantRemoved?: (data: any) => void;
  onReaction?: (data: any) => void;
}) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;

    (async () => {
      const token = await SecureStore.getItemAsync('accessToken');
      if (cancelled) return;
      const base = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1').replace('/api/v1', '');
      const socket = io(`${base}/live`, { auth: { token } });
      socketRef.current = socket;

      socket.emit('join_room', { roomId });
      socket.on('participant_joined', (d) => handlers.onParticipantJoined?.(d));
      socket.on('participant_left', (d) => handlers.onParticipantLeft?.(d));
      socket.on('hand_raised', (d) => handlers.onHandRaised?.(d));
      socket.on('role_changed', (d) => handlers.onRoleChanged?.(d));
      socket.on('participant_removed', (d) => handlers.onParticipantRemoved?.(d));
      socket.on('reaction', (d) => handlers.onReaction?.(d));
    })();

    return () => { cancelled = true; socketRef.current?.disconnect(); };
  }, [roomId]);

  return {
    sendReaction: (emoji: string) => socketRef.current?.emit('reaction', { emoji }),
    sendHandRaised: () => socketRef.current?.emit('hand_raised'),
  };
}
