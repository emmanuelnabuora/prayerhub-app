import { useEffect, useRef, useState } from 'react';
import Constants from 'expo-constants';
// Requires @livekit/react-native + @livekit/react-native-webrtc, which are native
// modules — this hook needs an Expo Dev Client build (`expo prebuild` /
// `eas build --profile development`), not plain Expo Go. See apps/mobile/README.md.
//
// Constants.appOwnership === 'expo' means we're running inside the Expo Go
// client app, which ships a fixed set of native modules and cannot include
// LiveKit's native WebRTC bindings. We check this BEFORE ever touching
// livekit-client or @livekit/react-native, rather than requiring them and
// catching the failure — some native-module Invariant Violations are thrown
// through React Native's internal error-reporting path in a way that bypasses
// a normal try/catch, so the safest fix is to never attempt the require at all.
export function useLiveKitRoom(sfuUrl: string | undefined, token: string | undefined) {
  const roomRef = useRef<any>(null);
  const [connected, setConnected] = useState(false);
  const [activeSpeakers, setActiveSpeakers] = useState<string[]>([]);
  const isExpoGo = Constants.appOwnership === 'expo';
  const [unsupported, setUnsupported] = useState(isExpoGo);

  useEffect(() => {
    if (!sfuUrl || !token || isExpoGo) return;
    let cancelled = false;

    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const livekitReactNative = require('@livekit/react-native');
        livekitReactNative.registerGlobals();
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Room, RoomEvent } = require('livekit-client');
        if (cancelled) return;
        const room = new Room();
        roomRef.current = room;
        room.on(RoomEvent.Connected, () => setConnected(true));
        room.on(RoomEvent.Disconnected, () => setConnected(false));
        room.on(RoomEvent.ActiveSpeakersChanged, (speakers: any[]) =>
          setActiveSpeakers(speakers.map((s) => s.identity)),
        );
        await room.connect(sfuUrl, token);
      } catch (err) {
        console.warn('LiveKit connect failed:', err);
        if (!cancelled) setUnsupported(true);
      }
    })();

    return () => {
      cancelled = true;
      roomRef.current?.disconnect();
    };
  }, [sfuUrl, token, isExpoGo]);

  const setMicEnabled = async (enabled: boolean) => {
    await roomRef.current?.localParticipant?.setMicrophoneEnabled(enabled);
  };

  return { connected, activeSpeakers, setMicEnabled, unsupported };
}
