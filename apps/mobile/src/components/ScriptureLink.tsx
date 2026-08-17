import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

// Per the product spec ("Users should be able to tap a Scripture reference anywhere
// in PrayerHubApp and open the relevant passage"), this is the one component every
// screen uses to render a reference — the prayer feed, testimonies, group posts,
// and the daily verse card all wrap references in this instead of plain <Text>.
export default function ScriptureLink({ bookId, chapter, verseStart, label }: {
  bookId: string; chapter: number; verseStart?: number; label: string;
}) {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity onPress={() => navigation.navigate('BibleReader', { bookId, chapter, verseStart })}>
      <Text style={styles.link}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  link: { color: theme.colors.flame, fontWeight: '600', textDecorationLine: 'underline' },
});
