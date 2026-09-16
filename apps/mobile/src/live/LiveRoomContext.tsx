import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import Constants from 'expo-constants';

// Owns the actual LiveKit Room connection at the app root, above navigation —
// this is what makes a mini-player possible at all. Previously the connection
// lived inside RoomScreen's own useLiveKitRoom hook and was torn down the
// instant that screen unmounted (navigating away = hanging up). Living here
// instead means "Return to room" from anywhere in the app just re-focuses
// RoomScreen; it never has to reconnect.

type ActiveRoom = {
  roomId: string;
  title: string;
  hostName?: string;
  connected: boolean;
  activeSpeakers: string[];
  micEnabled: boolean;
  unsupported: boolean;
};

type LiveRoomContextValue = {
  activeRoom: ActiveRoom | null;
  joinRoom: (args: { roomId: string; title: string; hostName?: string; sfuUrl: string; token: string }) => void;
  leaveRoom: () => void;
  setMicEnabled: (enabled: boolean) => Promise<void>;
};

const LiveRoomContext = createContext<LiveRoomContextValue | null>(null);

export function useLiveRoomContext() {
  const ctx = useContext(LiveRoomContext);
  if (!ctx) throw new Error('useLiveRoomContext must be used within LiveRoomProvider');
  return ctx;
}

export function LiveRoomProvider({ children }: { children: React.ReactNode }) {
  const roomInstanceRef = useRef<any>(null);
  const [activeRoom, setActiveRoom] = useState<ActiveRoom | null>(null);
  const isExpoGo = Constants.appOwnership === 'expo';

  const joinRoom = useCallback((args: { roomId: string; title: string; hostName?: string; sfuUrl: string; token: string }) => {
    // Already connected to this exact room (e.g. navigating back into
    // RoomScreen from the mini-player) — nothing to do, keep the connection.
    if (activeRoom?.roomId === args.roomId) return;

    // Switching rooms while one is already active — hang up the old one first.
    roomInstanceRef.current?.disconnect();

    if (isExpoGo) {
      setActiveRoom({
        roomId: args.roomId, title: args.title, hostName: args.hostName,
        connected: false, activeSpeakers: [], micEnabled: false, unsupported: true,
      });
      return;
    }

    setActiveRoom({
      roomId: args.roomId, title: args.title, hostName: args.hostName,
      connected: false, activeSpeakers: [], micEnabled: false, unsupported: false,
    });

    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const livekitReactNative = require('@livekit/react-native');
        livekitReactNative.registerGlobals();
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Room, RoomEvent } = require('livekit-client');
        const room = new Room();
        roomInstanceRef.current = room;
        room.on(RoomEvent.Connected, () => setActiveRoom((prev) => (prev ? { ...prev, connected: true } : prev)));
        room.on(RoomEvent.Disconnected, () => setActiveRoom((prev) => (prev ? { ...prev, connected: false } : prev)));
        room.on(RoomEvent.ActiveSpeakersChanged, (speakers: any[]) =>
          setActiveRoom((prev) => (prev ? { ...prev, activeSpeakers: speakers.map((s) => s.identity) } : prev)),
        );
        await room.connect(args.sfuUrl, args.token);
      } catch (err) {
        console.warn('LiveKit connect failed:', err);
        setActiveRoom((prev) => (prev ? { ...prev, unsupported: true } : prev));
      }
    })();
  }, [activeRoom?.roomId, isExpoGo]);

  const leaveRoom = useCallback(() => {
    roomInstanceRef.current?.disconnect();
    roomInstanceRef.current = null;
    setActiveRoom(null);
  }, []);

  const setMicEnabled = useCallback(async (enabled: boolean) => {
    await roomInstanceRef.current?.localParticipant?.setMicrophoneEnabled(enabled);
    setActiveRoom((prev) => (prev ? { ...prev, micEnabled: enabled } : prev));
  }, []);

  return (
    <LiveRoomContext.Provider value={{ activeRoom, joinRoom, leaveRoom, setMicEnabled }}>
      {children}
    </LiveRoomContext.Provider>
  );
}
