import { useEffect, useRef, useState } from 'react';
// Requires @livekit/react-native + @livekit/react-native-webrtc, which are native
// modules — this hook needs an Expo Dev Client build (`expo prebuild` /
// `eas build --profile development`), not plain Expo Go. See apps/mobile/README.md.
import { Room, RoomEvent } from 'livekit-client';

// Wraps the LiveKit client SDK: connects with the server-issued token (which
// already encodes publish/subscribe rights per docs/02-ARCHITECTURE.md section 3),
// exposes connection state and the current speaker list for the room UI.
export function useLiveKitRoom(sfuUrl: string | undefined, token: string | undefined) {
  const roomRef = useRef<Room | null>(null);
  const [connected, setConnected] = useState(false);
  const [activeSpeakers, setActiveSpeakers] = useState<string[]>([]);

  useEffect(() => {
    if (!sfuUrl || !token) return;
    const room = new Room();
    roomRef.current = room;

    room.on(RoomEvent.Connected, () => setConnected(true));
    room.on(RoomEvent.Disconnected, () => setConnected(false));
    room.on(RoomEvent.ActiveSpeakersChanged, (speakers) =>
      setActiveSpeakers(speakers.map((s) => s.identity)),
    );

    room.connect(sfuUrl, token).catch((err) => console.warn('LiveKit connect failed', err));

    return () => { room.disconnect(); };
  }, [sfuUrl, token]);

  const setMicEnabled = async (enabled: boolean) => {
    await roomRef.current?.localParticipant.setMicrophoneEnabled(enabled);
  };

  return { connected, activeSpeakers, setMicEnabled };
}
