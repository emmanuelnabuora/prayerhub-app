import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { useLiveRoomContext } from '../live/LiveRoomContext';
import { colors, type, space, radius, shadow } from '../theme';

// Renders a persistent audio bar above the bottom tab bar whenever a live
// room connection is active AND the user isn't currently looking at that
// room's own full-screen UI. Mounted once at the RootNavigator level, above
// the Tab.Navigator, so it survives switching between Home/Pray/Community/Profile.
export default function MiniPlayer() {
  const { activeRoom, setMicEnabled, leaveRoom } = useLiveRoomContext();
  const navigation = useNavigation<any>();

  const currentRouteName = useNavigationState((state) => {
    if (!state) return undefined;
    const findDeepestRoute = (navState: any): string | undefined => {
      const route = navState.routes[navState.index];
      if (route.state) return findDeepestRoute(route.state);
      return route.name;
    };
    return findDeepestRoute(state);
  });

  if (!activeRoom || currentRouteName === 'Room') return null;

  return (
    <View style={styles.container}>
      <View style={styles.liveDot} accessibilityElementsHidden importantForAccessibility="no" />
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>{activeRoom.title}</Text>
        <Text style={styles.status}>{activeRoom.connected ? 'Live' : 'Connecting…'}</Text>
      </View>
      <TouchableOpacity
        onPress={() => setMicEnabled(!activeRoom.micEnabled)}
        accessibilityRole="button"
        accessibilityLabel={activeRoom.micEnabled ? 'Mute microphone' : 'Unmute microphone'}
        style={styles.iconButton}
      >
        <Text style={styles.icon}>{activeRoom.micEnabled ? '🎙️' : '🔇'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Live', { screen: 'Room', params: { roomId: activeRoom.roomId } })}
        accessibilityRole="button"
        accessibilityLabel="Return to room"
        style={styles.returnButton}
      >
        <Text style={styles.returnText}>Return</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={leaveRoom}
        accessibilityRole="button"
        accessibilityLabel="Leave room"
        style={styles.iconButton}
      >
        <Text style={styles.icon}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 60, left: space.md, right: space.md,
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.indigoDeep,
    borderRadius: radius.lg, padding: space.sm, gap: space.sm, ...shadow.card,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.live },
  title: { color: colors.textOnDark, fontWeight: '700', fontSize: type.size.sm },
  status: { color: colors.mutedTextOnDark, fontSize: 11, marginTop: 1 },
  iconButton: { paddingHorizontal: 6, paddingVertical: 4 },
  icon: { fontSize: 16 },
  returnButton: { backgroundColor: colors.flame, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 6 },
  returnText: { color: colors.indigoDeep, fontWeight: '700', fontSize: 12 },
});
