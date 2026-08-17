import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useTestimonies, useReactToTestimony } from '../api/social';
import { colors, type, space, radius, shadow } from '../theme';
import FadeInView from '../components/FadeInView';
import FlameMark from '../components/FlameMark';

export default function TestimoniesScreen() {
  const { data: testimonies, isLoading } = useTestimonies();
  const react = useReactToTestimony();

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Testimonies</Text>
      <Text style={styles.headerSubtitle}>Stories of answered prayer from the community</Text>

      {isLoading ? (
        <View style={styles.loadingState}><FlameMark /></View>
      ) : (
        <FlatList
          data={testimonies}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ padding: space.lg }}
          renderItem={({ item, index }: any) => (
            <FadeInView delay={Math.min(index, 6) * 40}>
              <View style={styles.card}>
                <Text style={styles.categoryBadge}>{item.category}</Text>
                <Text style={styles.cardAuthor}>{item.author.displayName}</Text>
                {!!item.body && <Text style={styles.cardBody}>{item.body}</Text>}
                <TouchableOpacity
                  onPress={() => react.mutate({ testimonyId: item.id, type: 'amen' })}
                  accessibilityRole="button"
                  accessibilityLabel={`Say amen to this testimony, ${item.reactionCount} so far`}
                >
                  <Text style={styles.reactionButton}>🙌 Amen ({item.reactionCount})</Text>
                </TouchableOpacity>
              </View>
            </FadeInView>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FlameMark size={32} />
              <Text style={styles.emptyText}>No testimonies shared yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment, paddingTop: 56 },
  headerTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.xl, color: colors.indigo, paddingHorizontal: space.lg },
  headerSubtitle: { color: colors.mutedText, paddingHorizontal: space.lg, marginTop: 2, fontSize: type.size.sm },
  loadingState: { alignItems: 'center', marginTop: 60 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, marginBottom: space.md, borderWidth: 1, borderColor: colors.cardBorder, ...shadow.card },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: colors.parchment, color: colors.indigo, fontSize: 11, fontWeight: '700', paddingHorizontal: space.sm, paddingVertical: 3, borderRadius: radius.sm, marginBottom: space.sm, textTransform: 'uppercase' },
  cardAuthor: { color: colors.mutedText, fontSize: type.size.xs, marginBottom: space.sm },
  cardBody: { color: colors.text, marginBottom: space.sm, lineHeight: type.size.base * type.lineHeight.normal },
  reactionButton: { color: colors.indigo, fontWeight: '700' },
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: space.xl },
  emptyText: { textAlign: 'center', color: colors.mutedText, marginTop: space.md, fontSize: type.size.base },
});
