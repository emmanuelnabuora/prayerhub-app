import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useLiveRooms, useCreateRoom } from '../api/live';
import { colors, type, space, radius, shadow } from '../theme';
import FadeInView from '../components/FadeInView';
import FlameMark from '../components/FlameMark';

export default function LiveScreen({ navigation }: any) {
  const { data: rooms, isLoading } = useLiveRooms();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Prayer</Text>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Start a new prayer room"
        >
          <Text style={styles.newButtonText}>+ Start</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingState}><FlameMark /></View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: space.lg }}
          renderItem={({ item, index }) => (
            <FadeInView delay={Math.min(index, 6) * 40}>
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('Room', { roomId: item.id })}
                accessibilityRole="button"
                accessibilityLabel={`${item.status === 'live' ? 'Live now: ' : 'Scheduled: '}${item.title}, hosted by ${item.host.displayName}`}
              >
                <View style={styles.cardTop}>
                  {item.status === 'live' && (
                    <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>LIVE</Text></View>
                  )}
                  <Text style={styles.cardTopic}>{item.topic ?? 'Prayer'}</Text>
                </View>
                <Text style={styles.cardTitle} maxFontSizeMultiplier={1.3}>{item.title}</Text>
                <Text style={styles.cardMeta}>
                  Hosted by {item.host.displayName} · {item.listenerCount} listening
                </Text>
              </TouchableOpacity>
            </FadeInView>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FlameMark size={32} />
              <Text style={styles.emptyText}>No prayer rooms right now — start one.</Text>
            </View>
          }
        />
      )}

      <NewRoomModal visible={modalVisible} onClose={() => setModalVisible(false)} onCreated={(id) => navigation.navigate('Room', { roomId: id })} />
    </View>
  );
}

function NewRoomModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('Morning Prayer');
  const createRoom = useCreateRoom();

  const submit = () => {
    if (!title.trim()) return;
    Keyboard.dismiss();
    createRoom.mutate(
      { title, topic },
      { onSuccess: (room) => { setTitle(''); onClose(); onCreated(room.id); } },
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Start a Prayer Room</Text>
          <TextInput style={styles.input} placeholder="Room title" value={title} onChangeText={setTitle} accessibilityLabel="Room title" />
          <TextInput style={styles.input} placeholder="Topic (e.g. Healing Prayer)" value={topic} onChangeText={setTopic} accessibilityLabel="Room topic" />
          <TouchableOpacity
            style={styles.submitButton}
            onPress={submit}
            disabled={createRoom.isPending}
            accessibilityRole="button"
            accessibilityLabel="Go live"
          >
            {createRoom.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Go Live</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { Keyboard.dismiss(); onClose(); }} accessibilityRole="button" accessibilityLabel="Cancel">
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: space.lg, paddingTop: 56 },
  headerTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.xl, color: colors.indigo },
  newButton: { backgroundColor: colors.flame, paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.pill },
  newButtonText: { color: '#fff', fontWeight: '700', fontSize: type.size.sm },
  loadingState: { alignItems: 'center', marginTop: 60 },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, marginBottom: space.md,
    borderWidth: 1, borderColor: colors.cardBorder, ...shadow.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: 6 },
  liveBadge: { backgroundColor: colors.live, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  liveBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardTopic: { color: colors.mutedText, fontSize: type.size.xs, textTransform: 'uppercase' },
  cardTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.md, color: colors.text, marginBottom: 4 },
  cardMeta: { color: colors.mutedText, fontSize: type.size.sm },
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: space.xl },
  emptyText: { textAlign: 'center', color: colors.mutedText, marginTop: space.md, fontSize: type.size.base },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(31,30,51,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.xl },
  modalTitle: { fontFamily: type.fontFamily.display, fontSize: type.size.lg, marginBottom: space.md, color: colors.indigo },
  input: { borderWidth: 1, borderColor: colors.divider, borderRadius: radius.sm, padding: space.md, marginBottom: space.sm },
  submitButton: { backgroundColor: colors.indigo, borderRadius: radius.md, padding: space.md, alignItems: 'center', marginBottom: space.sm },
  submitButtonText: { color: '#fff', fontWeight: '700' },
  cancelText: { textAlign: 'center', color: colors.mutedText },
});
