import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCurrentUser } from '../api/users';
import { useLogout } from '../api/auth';
import { colors, type, space, radius, shadow } from '../theme';
import FadeInView from '../components/FadeInView';
import FlameMark from '../components/FlameMark';

export default function ProfileScreen({ navigation }: any) {
  const { data: user, isLoading } = useCurrentUser();
  const logout = useLogout();
  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={[colors.indigoDeep, colors.indigo]} style={styles.header}>
        <FadeInView>
          {isLoading ? (
            <FlameMark size={36} />
          ) : (
            <View>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{user?.displayName?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
              <Text style={styles.displayName}>{user?.displayName}</Text>
              <Text style={styles.username}>@{user?.username}</Text>
            </View>
          )}
        </FadeInView>
      </LinearGradient>
      <View style={styles.content}>
        {!!user?.bio && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>About</Text>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>
        )}
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
        <TouchableOpacity
          style={[styles.row, styles.logoutRow]}
          onPress={() => logout.mutate()}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <Text style={styles.rowIcon}>🚪</Text>
          <Text style={[styles.rowText, styles.logoutText]}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment },
  header: { paddingTop: 64, paddingBottom: space.xl, paddingHorizontal: space.lg, alignItems: 'center' },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.flame, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
  avatarInitial: { fontFamily: type.fontFamily.display, fontSize: type.size.xxl, color: colors.indigoDeep },
  displayName: { fontFamily: type.fontFamily.display, fontSize: type.size.xl, color: colors.textOnDark, textAlign: 'center' },
  username: { color: colors.mutedTextOnDark, fontSize: type.size.sm, marginTop: 2, textAlign: 'center' },
  content: { padding: space.lg },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, marginBottom: space.md, borderWidth: 1, borderColor: colors.cardBorder, ...shadow.card },
  cardLabel: { fontSize: type.size.xs, color: colors.mutedText, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: space.sm, fontWeight: '600' },
  bioText: { color: colors.text, fontSize: type.size.base, lineHeight: type.size.base * type.lineHeight.normal },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, marginBottom: space.sm, borderWidth: 1, borderColor: colors.cardBorder, ...shadow.card },
  logoutRow: { marginTop: space.md },
  rowIcon: { fontSize: 18, marginRight: space.sm },
  rowText: { fontSize: type.size.base, color: colors.text, flex: 1 },
  logoutText: { color: colors.danger, fontWeight: '600' },
  chevron: { color: colors.mutedText, fontSize: type.size.lg },
});
