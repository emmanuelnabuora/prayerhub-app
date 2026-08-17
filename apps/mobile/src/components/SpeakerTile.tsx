import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { colors, type, space, radius } from '../theme';
import { useReducedMotion } from '../hooks/useReducedMotion';

// The room's signature visual: an active speaker gets a soft flame-colored
// glow ring rather than a generic green "speaking" dot — ties the live-audio
// experience back to the candlelight motif instead of borrowing a
// videoconferencing app's visual language wholesale.
export default function SpeakerTile({
  displayName, role, handRaised, isActiveSpeaker, isModerator, canPromote, onPromote, onMute, onRemove,
}: {
  displayName: string; role: string; handRaised: boolean; isActiveSpeaker?: boolean;
  isModerator: boolean; canPromote: boolean;
  onPromote?: () => void; onMute?: () => void; onRemove?: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) { glow.setValue(isActiveSpeaker ? 1 : 0); return; }
    Animated.timing(glow, { toValue: isActiveSpeaker ? 1 : 0, duration: 220, useNativeDriver: false }).start();
  }, [isActiveSpeaker, reducedMotion]);

  const borderColor = glow.interpolate({ inputRange: [0, 1], outputRange: ['rgba(232,161,93,0)', colors.flame] });

  return (
    <View style={styles.tile} accessibilityRole="text" accessibilityLabel={`${displayName}, ${role}${handRaised ? ', hand raised' : ''}${isActiveSpeaker ? ', speaking' : ''}`}>
      <Animated.View style={[styles.avatarRing, { borderColor }]}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>{displayName[0]}</Text>
        </View>
      </Animated.View>
      <Text style={styles.name} numberOfLines={1} maxFontSizeMultiplier={1.2}>{displayName}</Text>
      <Text style={styles.role}>{role}{handRaised ? ' ✋' : ''}</Text>
      {isModerator && role !== 'host' && (
        <View style={styles.modRow}>
          {role === 'listener' && handRaised && (
            <TouchableOpacity onPress={onPromote} accessibilityRole="button" accessibilityLabel={`Promote ${displayName} to speaker`}>
              <Text style={styles.modAction}>Promote</Text>
            </TouchableOpacity>
          )}
          {role === 'speaker' && (
            <TouchableOpacity onPress={onMute} accessibilityRole="button" accessibilityLabel={`Mute ${displayName}`}>
              <Text style={styles.modAction}>Mute</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onRemove} accessibilityRole="button" accessibilityLabel={`Remove ${displayName} from room`}>
            <Text style={styles.modActionDanger}>Remove</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1 / 3, alignItems: 'center', marginBottom: space.lg },
  avatarRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.flame, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 20, fontWeight: '700' },
  name: { color: '#fff', fontSize: type.size.xs, maxWidth: 80 },
  role: { color: 'rgba(255,255,255,0.55)', fontSize: 10, marginTop: 1 },
  modRow: { flexDirection: 'row', gap: space.sm, marginTop: 4 },
  modAction: { color: '#9FD3C7', fontSize: 11 },
  modActionDanger: { color: '#E88', fontSize: 11 },
});
