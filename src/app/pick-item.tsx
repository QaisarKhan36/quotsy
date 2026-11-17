import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Field } from '../components/ui';
import { money } from '../lib/format';
import { emitItem } from '../lib/picker';
import { useStore } from '../lib/store';
import { colors, radius } from '../lib/theme';

export default function PickItem() {
  const { data } = useStore();
  const [q, setQ] = useState('');
  const list = data.items
    .filter((i) => `${i.name} ${i.description}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <FlatList
      data={list}
      keyExtractor={(i) => i.id}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={
        <View>
          <Button title="Create new saved item" icon="add-circle-outline" variant="secondary" onPress={() => router.replace('/item/new?pick=1')} style={{ marginBottom: 14 }} />
          {data.items.length > 6 ? <Field value={q} onChangeText={setQ} placeholder="Search items" /> : null}
        </View>
      }
      ListEmptyComponent={<Text style={{ color: colors.muted, textAlign: 'center', marginTop: 20 }}>No saved items</Text>}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => {
            emitItem(item);
            router.back();
          }}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.sub}>
              {money(item.rate, data.business.currency)} / {item.unit}
            </Text>
          </View>
          <Ionicons name="add-circle" size={26} color={colors.primary} />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: colors.card, borderRadius: radius.md, marginBottom: 8 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
