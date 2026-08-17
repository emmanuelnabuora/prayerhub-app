import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, AccessibilityInfo } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDailyVerse } from '../api/bible';
import { useLiveRooms } from '../api/live';
import { useSuggestedGroups } from '../api/ai';
import { colors, type, space, radius, shadow } from '../theme';
import FadeInView from '../components/FadeInView';
import FlameMark from '../components/FlameMark';

// Home carries the "dusk-to-dawn" rhythm from the landing page into the app:
// a deep-indigo header that yields to warm parchment content below, echoing
// candlelight giving way to morning. The greeting is time-of-day aware rather
// than a static string, which costs nothing and makes the app feel present.
function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'Peace in the quiet hours';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Peace be with you this evening';
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { data: dailyVerse, isLoading: verseLoading } = useDailyVerse();
  const { data: rooms } = useLiveRooms();
  const { data: suggestedGroups } = useSuggestedGroups();
  const liveNow = rooms?.filter((r: any) => r.status === 'live') ?? [];

  return (
    <View style={styles.root}>
      <LinearGradient colors={[colors.indigoDeep, colors.indigo]} style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.greeting} maxFontSizeMultiplier={1.4}>{timeOfDayGreeting()}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Search')}
            accessibilityRole="button"
            accessibilityLabel="Search PrayerHubApp"
            hitSlop={10}
          >
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <FadeInView>
          <View style={[styles.card, styles.verseCard]}>
            <Text style={styles.cardLabel}>Daily Scripture</Text>
            {verseLoading ? (
              <View style={styles.verseLoading}>
                <FlameMark size={28} />
              </View>
            ) : (
              <>
                <Text style={styles.verseText} maxFontSizeMultiplier={1.6}>{dailyVerse?.text}</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('BibleReader')}
                  accessibilityRole="button"
                  accessibilityLabel={`Read ${dailyVerse?.referenceLabel} in the Bible reader`}
                >
                  <Text style={styles.verseReference}>{dailyVerse?.referenceLabel}  ›</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </FadeInView>

        {liveNow.length > 0 && (
          <FadeInView delay={80}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Live Now</Text>
              {liveNow.map((room: any) => (
                <TouchableOpacity
                  key={room.id}
                  style={styles.rowItem}
                  onPress={() => navigation.getParent()?.navigate('Live', { screen: 'Room', params: { roomId: room.id } })}
                  accessibilityRole="button"
                  accessibilityLabel={`Join live room: ${room.title}, ${room.listenerCount} listening`}
                >
                  <View style={styles.liveDot} accessibilityElementsHidden importantForAccessibility="no" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{room.title}</Text>
                    <Text style={styles.rowMeta}>{room.listenerCount} listening</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </FadeInView>
        )}

        {suggestedGroups?.length > 0 && (
          <FadeInView delay={140}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Suggested Groups</Text>
              {suggestedGroups.map((g: any) => (
                <TouchableOpacity
                  key={g.id}
                  style={styles.rowItem}
                  onPress={() => navigation.getParent()?.navigate('Community', { screen: 'GroupDetail', params: { groupId: g.id } })}
                  accessibilityRole="button"
                  accessibilityLabel={`Open group: ${g.name}, ${g.member_count} members`}
                >
                  <Text style={styles.rowTitle}>{g.name}</Text>
                  <Text style={styles.rowMeta}>{g.member_count} members</Text>
                </TouchableOpacity>
              ))}
            </View>
          </FadeInView>
        )}

        <FadeInView delay={200}>
          <View style={styles.linkGrid}>
            <LinkTile icon="💬" label="Feed" onPress={() => navigation.navigate('Feed')} />
            <LinkTile icon="✨" label="Testimonies" onPress={() => navigation.navigate('Testimonies')} />
            <LinkTile icon="🕊️" label="Assistant" onPress={() => navigation.navigate('Assistant')} />
          </View>
        </FadeInView>
      </ScrollView>
    </View>
  );
}

function LinkTile({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.linkTile}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.linkIcon}>{icon}</Text>
      <Text style={styles.linkLabel} maxFontSizeMultiplier={1.3}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.parchment },
  header: { paddingTop: 56, paddingBottom: space.xl, paddingHorizontal: space.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: {
    fontFamily: type.fontFamily.display, fontSize: type.size.xl, color: colors.textOnDark,
  },
  searchIcon: { fontSize: 20 },
  container: { flex: 1 },
  content: { padding: space.lg, paddingTop: space.lg, paddingBottom: space.xxl, marginTop: -space.lg },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg,
    marginBottom: space.md, borderWidth: 1, borderColor: colors.cardBorder, ...shadow.card,
  },
  verseCard: { borderLeftWidth: 3, borderLeftColor: colors.flame },
  cardLabel: {
    fontSize: type.size.xs, color: colors.mutedText, textTransform: 'uppercase',
    letterSpacing: 0.6, marginBottom: space.sm, fontWeight: '600',
  },
  verseLoading: { paddingVertical: space.md, alignItems: 'flex-start' },
  verseText: {
    fontFamily: type.fontFamily.displayItalic, fontSize: type.size.md,
    lineHeight: type.size.md * type.lineHeight.relaxed, color: colors.text, marginBottom: space.sm,
  },
  verseReference: { color: colors.flameDeep, fontWeight: '700', fontSize: type.size.sm },
  rowItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.sm },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.live, marginRight: space.sm },
  rowTitle: { color: colors.text, fontWeight: '600', fontSize: type.size.base },
  rowMeta: { color: colors.mutedText, fontSize: type.size.xs, marginTop: 1 },
  linkGrid: { flexDirection: 'row', gap: space.sm },
  linkTile: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md, paddingVertical: space.lg,
    alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder,
  },
  linkIcon: { fontSize: 22, marginBottom: 6 },
  linkLabel: { color: colors.indigo, fontWeight: '600', fontSize: type.size.xs },
});
