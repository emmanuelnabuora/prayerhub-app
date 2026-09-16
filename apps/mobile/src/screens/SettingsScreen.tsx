import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useBlockedUsers, useUnblockUser, useDeleteAccount } from '../api/users';
import { useLogout } from '../api/auth';
import { colors, type, space, radius, shadow } from '../theme';
import FlameMark from '../components/FlameMark';

export default function SettingsScreen({ navigation }: any) {
  const { data: blockedUsers, isLoading } = useBlockedUsers();
  const unblockUser = useUnblockUser();
  const deleteAccount = useDeleteAccount();
  const logout = useLogout();
  const [showBlocked, setShowBlocked] = useState(false);

  const confirmDelete = () => {
    Alert.alert(
      'Delete your account?',
      'This will permanently deactivate your account. This cannot be undone from the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => deleteAccount.mutate(undefined, { onSuccess: () => logout.mutate() }),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings & Privacy</Text>

      <TouchableOpacity
        style={styles.row}
        onPress={() => setShowBlocked(!showBlocked)}
        accessibilityRole="button"
        accessibilityLabel="Blocked users"
      >
        <Text style={styles.rowIcon}>🚫</Text>
        <Text style={styles.rowText}>Blocked Users</Text>
        <Text style={styles.chevron}>{showBlocked ? '⌄' : '›'}</Text>
      </TouchableOpacity>

      {showBlocked && (
        isLoading ? (
          <View style={styles.loadingRow}><FlameMark size={24} /></View>
        ) : (
          <FlatList
            data={blockedUsers}
            keyExtractor={(item: any) => item.id}
            style={styles.blockedList}
            renderItem={({ item }: any) => (
              <View style={styles.blockedRow}>
                <Text style={styles.blockedName}>{item.displayName}</Text>
                <TouchableOpacity
                  onPress={() => unblockUser.mutate(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Unblock ${item.displayName}`}
                >
                  <Text style={styles.unblockText}>Unblock</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>You haven't blocked anyone.</Text>}
          />
        )
      )}

      <TouchableOpacity
        style={[styles.row, styles.dangerRow]}
        onPress={confirmDelete}
        accessibilityRole="button"
        accessibilityLabel="Delete account"
      >
        <Text style={styles.rowIcon}>⚠️</Text>
        <Text style={[styles.rowText, styles.dangerText]}>Delete Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment, paddingTop: 56, paddingHorizontal: space.lg },
  header: { fontFamily: type.fontFamily.display, fontSize: type.size.xl, color: colors.indigo, marginBottom: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, marginBottom: space.sm, borderWidth: 1, borderColor: colors.cardBorder, ...shadow.card },
  rowIcon: { fontSize: 18, marginRight: space.sm },
  rowText: { fontSize: type.size.base, color: colors.text, flex: 1 },
  chevron: { color: colors.mutedText, fontSize: type.size.lg },
  loadingRow: { alignItems: 'center', paddingVertical: space.md },
  blockedList: { maxHeight: 240, marginBottom: space.sm },
  blockedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.sm, padding: space.md, marginBottom: 6, borderWidth: 1, borderColor: colors.cardBorder },
  blockedName: { color: colors.text },
  unblockText: { color: colors.flameDeep, fontWeight: '600', fontSize: type.size.sm },
  emptyText: { textAlign: 'center', color: colors.mutedText, marginTop: space.sm },
  dangerRow: { marginTop: space.lg },
  dangerText: { color: colors.danger, fontWeight: '600' },
});
