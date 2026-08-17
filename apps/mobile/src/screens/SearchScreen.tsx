import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSearchUsers } from '../api/social';
import { colors, type, space, radius } from '../theme';
import FadeInView from '../components/FadeInView';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const { data: users } = useSearchUsers(query);
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search people…"
        value={query}
        onChangeText={setQuery}
        autoFocus
        accessibilityLabel="Search people"
      />
      <FlatList
        data={users}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: space.lg }}
        renderItem={({ item, index }: any) => (
          <FadeInView delay={Math.min(index, 6) * 30}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
              accessibilityRole="button"
              accessibilityLabel={`Open profile: ${item.display_name}`}
            >
              <Text style={styles.name}>{item.display_name}</Text>
              <Text style={styles.username}>@{item.username}</Text>
            </TouchableOpacity>
          </FadeInView>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment, paddingTop: 56, paddingHorizontal: space.lg },
  input: { backgroundColor: colors.card, borderRadius: radius.sm, padding: space.md, marginBottom: space.sm, borderWidth: 1, borderColor: colors.cardBorder },
  row: { backgroundColor: colors.card, borderRadius: radius.sm, padding: space.md, marginBottom: space.sm, borderWidth: 1, borderColor: colors.cardBorder },
  name: { color: colors.text, fontWeight: '700' },
  username: { color: colors.mutedText, fontSize: type.size.xs },
});
