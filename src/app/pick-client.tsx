import { router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar, Button, Field } from '../components/ui';
import { emitClient } from '../lib/picker';
import { useStore } from '../lib/store';
import { colors, radius } from '../lib/theme';

export default function PickClient() {
  const { data } = useStore();
  const [q, setQ] = useState('');
  const list = data.clients
    .filter((c) => `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <FlatList
      data={list}
      keyExtractor={(c) => c.id}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={
        <View>
          <Button title="New client" icon="person-add-outline" onPress={() => router.replace('/client/new?pick=1')} style={{ marginBottom: 14 }} />
          {data.clients.length ? <Field value={q} onChangeText={setQ} placeholder="Search" autoFocus={data.clients.length > 6} /> : null}
        </View>
      }
      ListEmptyComponent={<Text style={{ color: colors.muted, textAlign: 'center', marginTop: 20 }}>{data.clients.length ? 'No match' : 'No saved clients yet'}</Text>}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => {
            emitClient(item);
            router.back();
          }}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
        >
          <Avatar name={item.name} size={36} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name}</Text>
            {item.phone || item.email ? <Text style={styles.sub}>{[item.phone, item.email].filter(Boolean).join(' · ')}</Text> : null}
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: colors.card, borderRadius: radius.md, marginBottom: 8 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  sub: { fontSize: 13, color: colors.muted, marginTop: 1 },
});
