import React, { useState } from 'react';
import { View, TextInput, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGlobalSearch } from '../api/search';
import { colors, type, space, radius } from '../theme';
import FlameMark from '../components/FlameMark';

// Categorized results (People/Live/Groups/Communities) rather than a flat
// list — the four categories come from genuinely different tables with
// different shapes, and showing them separately lets someone scan for what
// they actually meant ("prayer" could be a room, a group, or a person named
// Prayer) without one category burying the others.
function SearchSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: space.lg }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const { data, isLoading } = useGlobalSearch(query);
  const navigation = useNavigation<any>();

  const hasQuery = query.trim().length >= 2;
  const hasResults = data && (data.people.length || data.rooms.length || data.groups.length || data.organizations.length);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search people, live rooms, groups, communities…"
        value={query}
        onChangeText={setQuery}
        autoFocus
        accessibilityLabel="Search PrayerHubApp"
      />

      {!hasQuery && (
        <Text style={styles.hint}>Type at least 2 characters to search.</Text>
      )}

      {hasQuery && isLoading && (
        <View style={styles.loadingRow}><FlameMark size={28} /></View>
      )}

      {hasQuery && !isLoading && !hasResults && (
        <Text style={styles.hint}>No results for "{query}".</Text>
      )}

      {hasQuery && !isLoading && hasResults && (
        <ScrollView contentContainerStyle={{ padding: space.lg }}>
          {data.people.length > 0 && (
            <SearchSection title="People">
              {data.people.map((item: any) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.row}
                  onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
                  accessibilityRole="button"
                  accessibilityLabel={`Open profile: ${item.displayName}`}
                >
                  <Text style={styles.rowTitle}>{item.displayName}</Text>
                  <Text style={styles.rowSubtitle}>@{item.username}</Text>
                </TouchableOpacity>
              ))}
            </SearchSection>
          )}

          {data.rooms.length > 0 && (
            <SearchSection title="Live Rooms">
              {data.rooms.map((item: any) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.row}
                  onPress={() => navigation.navigate('Live', { screen: 'Room', params: { roomId: item.id } })}
                  accessibilityRole="button"
                  accessibilityLabel={`Open room: ${item.title}`}
                >
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowSubtitle}>{item.topic} · {item.status}</Text>
                </TouchableOpacity>
              ))}
            </SearchSection>
          )}

          {data.groups.length > 0 && (
            <SearchSection title="Groups">
              {data.groups.map((item: any) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.row}
                  onPress={() => navigation.navigate('Community', { screen: 'GroupDetail', params: { groupId: item.id } })}
                  accessibilityRole="button"
                  accessibilityLabel={`Open group: ${item.name}`}
                >
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  <Text style={styles.rowSubtitle}>{item.groupType?.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </SearchSection>
          )}

          {data.organizations.length > 0 && (
            <SearchSection title="Communities">
              {data.organizations.map((item: any) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.row}
                  onPress={() => navigation.navigate('Community', { screen: 'OrganizationDetail', params: { orgId: item.id } })}
                  accessibilityRole="button"
                  accessibilityLabel={`Open community: ${item.name}`}
                >
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  <Text style={styles.rowSubtitle}>{item.type}</Text>
                </TouchableOpacity>
              ))}
            </SearchSection>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment, paddingTop: 56, paddingHorizontal: space.lg },
  input: { backgroundColor: colors.card, borderRadius: radius.sm, padding: space.md, marginBottom: space.sm, borderWidth: 1, borderColor: colors.cardBorder },
  hint: { textAlign: 'center', color: colors.mutedText, marginTop: space.xl },
  loadingRow: { alignItems: 'center', marginTop: space.xl },
  sectionTitle: { fontSize: type.size.xs, color: colors.mutedText, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: space.sm, fontWeight: '700' },
  row: { backgroundColor: colors.card, borderRadius: radius.sm, padding: space.md, marginBottom: space.sm, borderWidth: 1, borderColor: colors.cardBorder },
  rowTitle: { color: colors.text, fontWeight: '700' },
  rowSubtitle: { color: colors.mutedText, fontSize: type.size.xs, marginTop: 2, textTransform: 'capitalize' },
});
