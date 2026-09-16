import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoom, useJoinRoomToken, useRaiseHand, useChangeRole, useRemoveParticipant, useEndRoom } from '../api/live';
import { useLiveSocket } from '../audio/useLiveSocket';
import { useLiveRoomContext } from '../live/LiveRoomContext';
import SpeakerTile from '../components/SpeakerTile';
import FlameMark from '../components/FlameMark';
import { colors, type, space, radius } from '../theme';

// Full in-room experience: server-authoritative roles (host/co-host/speaker/
// listener) drive both the mic UI and what actions are offered — a listener
// never even sees a mute button, because they were never issued publish
// rights by the SFU token in the first place (apps/api/src/live/sfu.provider.ts).
export default function RoomScreen({ route, navigation }: any) {
  const { roomId } = route.params;
  const { data: room, refetch } = useRoom(roomId);
  const joinToken = useJoinRoomToken(roomId);
  const raiseHand = useRaiseHand(roomId);
  const changeRole = useChangeRole(roomId);
  const removeParticipant = useRemoveParticipant(roomId);
  const endRoom = useEndRoom(roomId);
  const [tokenData, setTokenData] = useState<{ token: string; sfuUrl: string; role: string } | null>(null);

  useLiveSocket(roomId, {
    onParticipantJoined: () => refetch(),
    onParticipantLeft: () => refetch(),
    onHandRaised: () => refetch(),
    onRoleChanged: () => refetch(),
    onParticipantRemoved: () => refetch(),
  });

  const { activeRoom, joinRoom, leaveRoom, setMicEnabled } = useLiveRoomContext();
  const connected = activeRoom?.roomId === roomId && activeRoom.connected;
  const activeSpeakers = activeRoom?.roomId === roomId ? activeRoom.activeSpeakers : [];
  const unsupported = activeRoom?.roomId === roomId && activeRoom.unsupported;

  React.useEffect(() => {
    joinToken.mutate(undefined, { onSuccess: setTokenData });
  }, [roomId]);

  // Connects via the app-root LiveRoomProvider rather than owning the
  // connection here — this is what lets the mini-player keep audio alive
  // when the user navigates away without explicitly leaving/ending.
  React.useEffect(() => {
    if (tokenData?.sfuUrl && tokenData?.token && room) {
      joinRoom({ roomId, title: room.title, sfuUrl: tokenData.sfuUrl, token: tokenData.token });
    }
  }, [tokenData?.sfuUrl, tokenData?.token, room?.title]);

  const isModerator = tokenData?.role === 'host' || tokenData?.role === 'co_host';
  const canSpeak = tokenData?.role === 'host' || tokenData?.role === 'co_host' || tokenData?.role === 'speaker';

  if (!room) {
    return (
      <LinearGradient colors={[colors.indigoDeep, colors.indigo]} style={styles.loadingRoot}>
        <FlameMark size={44} />
        <Text style={styles.loadingText}>Entering the room…</Text>
      </LinearGradient>
    );
  }

  if (unsupported) {
    return (
      <LinearGradient colors={[colors.indigoDeep, colors.indigo]} style={styles.loadingRoot}>
        <FlameMark size={44} />
        <Text style={styles.loadingText}>
          Live audio needs the full PrayerHubApp build{'\n'}(not available in Expo Go preview)
        </Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.indigoDeep, colors.indigo]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.roomTitle} maxFontSizeMultiplier={1.3}>{room.title}</Text>
        <Text style={styles.roomTopic}>{room.topic}</Text>
        <View style={styles.connectionRow}>
          <View style={[styles.connectionDot, { backgroundColor: connected ? colors.success : colors.flame }]} />
          <Text style={styles.connectionState}>{connected ? 'Connected' : 'Connecting…'}</Text>
        </View>
      </View>

      <FlatList
        data={room.participants}
        keyExtractor={(p: any) => p.userId}
        numColumns={3}
        contentContainerStyle={{ padding: space.lg }}
        renderItem={({ item }: any) => (
          <SpeakerTile
            displayName={item.displayName}
            role={item.role}
            handRaised={item.handRaised}
            isActiveSpeaker={activeSpeakers.includes(item.userId)}
            isModerator={isModerator}
            canPromote={item.role === 'listener' && item.handRaised}
            onPromote={() => changeRole.mutate({ targetUserId: item.userId, role: 'speaker' })}
            onMute={() => changeRole.mutate({ targetUserId: item.userId, role: 'listener' })}
            onRemove={() => removeParticipant.mutate(item.userId)}
          />
        )}
      />

      <View style={styles.controls}>
        {canSpeak ? (
          <TouchableOpacity
            style={styles.micButton}
            onPress={() => setMicEnabled(true)}
            accessibilityRole="button"
            accessibilityLabel="Unmute your microphone"
          >
            <Text style={styles.micButtonText}>🎙️ Unmute</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.handButton}
            onPress={() => raiseHand.mutate()}
            accessibilityRole="button"
            accessibilityLabel="Raise your hand to request to speak"
          >
            <Text style={styles.handButtonText}>✋ Raise Hand</Text>
          </TouchableOpacity>
        )}
        {tokenData?.role === 'host' ? (
          <TouchableOpacity
            style={styles.endButton}
            onPress={() => endRoom.mutate(undefined, { onSuccess: () => { leaveRoom(); navigation.goBack(); } })}
            accessibilityRole="button"
            accessibilityLabel="End the prayer room for everyone"
          >
            <Text style={styles.endButtonText}>End Room</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={() => { leaveRoom(); navigation.goBack(); }}
            accessibilityRole="button"
            accessibilityLabel="Leave the room quietly"
          >
            <Text style={styles.leaveButtonText}>Leave Quietly</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  loadingText: { color: colors.textOnDark, fontSize: type.size.base },
  container: { flex: 1 },
  header: { paddingTop: 56, paddingHorizontal: space.lg, paddingBottom: space.md },
  roomTitle: { fontFamily: type.fontFamily.display, color: '#fff', fontSize: type.size.lg },
  roomTopic: { color: colors.flame, marginTop: 2, fontSize: type.size.sm },
  connectionRow: { flexDirection: 'row', alignItems: 'center', marginTop: space.sm, gap: 6 },
  connectionDot: { width: 6, height: 6, borderRadius: 3 },
  connectionState: { color: 'rgba(255,255,255,0.65)', fontSize: type.size.xs },
  controls: { flexDirection: 'row', gap: space.md, padding: space.xl, justifyContent: 'center' },
  micButton: { backgroundColor: colors.flame, borderRadius: radius.pill, paddingHorizontal: space.xl, paddingVertical: space.md },
  micButtonText: { color: '#fff', fontWeight: '700' },
  handButton: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.pill, paddingHorizontal: space.xl, paddingVertical: space.md },
  handButtonText: { color: '#fff', fontWeight: '700' },
  endButton: { backgroundColor: colors.danger, borderRadius: radius.pill, paddingHorizontal: space.xl, paddingVertical: space.md },
  endButtonText: { color: '#fff', fontWeight: '700' },
  leaveButton: { backgroundColor: 'transparent', borderRadius: radius.pill, paddingHorizontal: space.xl, paddingVertical: space.md },
  leaveButtonText: { color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
});
