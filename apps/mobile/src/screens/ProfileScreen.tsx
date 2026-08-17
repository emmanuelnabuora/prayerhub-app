import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, type, space, radius, shadow } from '../theme';
import FadeInView from '../components/FadeInView';
import FlameMark from '../components/FlameMark';

export default function ProfileScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <FadeInView>
        <View style={styles.avatarBlock}>
          <FlameMark size={36} />
          <Text style={styles.title}>Profile</Text>
        </View>
      </FadeInView>

      <FadeInView delay={60}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('Journal')}
          accessibilityRole="button"
          accessibilityLabel="My Prayer Journal"
        >
          <Text style={styles.rowIcon}>📓</Text>
          <Text style={styles.rowText}>My Prayer Journal</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </FadeInView>

      <FadeInView delay={100}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('Conversations')}
          accessibilityRole="button"
          accessibilityLabel="Messages"
        >
          <Text style={styles.rowIcon}>💬</Text>
          <Text style={styles.rowText}>Messages</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </FadeInView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment, paddingTop: 56, paddingHorizontal: space.lg },
  avatarBlock: { alignItems: 'flex-start', marginBottom: space.xl },
  title: { fontFamily: type.fontFamily.display, fontSize: type.size.xl, color: colors.indigo, marginTop: space.sm },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md,
    padding: space.md, marginBottom: space.sm, borderWidth: 1, borderColor: colors.cardBorder, ...shadow.card,
  },
  rowIcon: { fontSize: 18, marginRight: space.sm },
  rowText: { fontSize: type.size.base, color: colors.text, flex: 1 },
  chevron: { color: colors.mutedText, fontSize: type.size.lg },
});
