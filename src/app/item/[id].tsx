import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button, Card, Chip, confirm, Field, notify } from '../../components/ui';
import { numText, parseNum, uid } from '../../lib/format';
import { emitItem } from '../../lib/picker';
import { useStore } from '../../lib/store';
import { colors } from '../../lib/theme';
import { UNITS } from '../../lib/trades';
import type { SavedItem } from '../../lib/types';

export default function ItemEdit() {
  const { id, pick } = useLocalSearchParams<{ id: string; pick?: string }>();
  const store = useStore();
  const existing = store.data.items.find((i) => i.id === id);
  const [item, setItem] = useState<SavedItem>(() => existing ?? { id: uid(), name: '', description: '', rate: 0, unit: 'each' });
  const [rateText, setRateText] = useState(() => numText(existing?.rate ?? 0));
  const set = (p: Partial<SavedItem>) => setItem((x) => ({ ...x, ...p }));

  const save = () => {
    if (!item.name.trim()) return notify('Name required', 'What is this item or service called?');
    const clean = { ...item, name: item.name.trim() };
    store.upsertItem(clean);
    if (pick) emitItem(clean);
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Stack.Screen
        options={{
          title: existing ? 'Edit item' : 'New item',
          headerRight: () => (
            <Pressable onPress={save} hitSlop={10}>
              <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 17 }}>Save</Text>
            </Pressable>
          ),
        }}
      />
      <Card>
        <Field label="Name *" value={item.name} onChangeText={(v) => set({ name: v })} placeholder="e.g. Standard clean" autoFocus={!existing} />
        <Field label="Description" value={item.description} onChangeText={(v) => set({ description: v })} placeholder="Optional, shown on PDFs" multiline />
        <Field
          label={`Price (${store.data.business.currency})`}
          value={rateText}
          onChangeText={(v) => {
            setRateText(v);
            set({ rate: parseNum(v) });
          }}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 8 }}>Charged per</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {UNITS.map((u) => (
            <Chip key={u} label={u} active={item.unit === u} onPress={() => set({ unit: u })} />
          ))}
        </View>
      </Card>
      <Button title="Save item" icon="checkmark" onPress={save} />
      {existing ? (
        <Button
          title="Delete item"
          variant="danger"
          icon="trash-outline"
          style={{ marginTop: 12 }}
          onPress={() =>
            confirm('Delete item?', 'Invoices that already use it are not affected.', 'Delete', () => {
              store.deleteItem(existing.id);
              router.back();
            })
          }
        />
      ) : null}
    </ScrollView>
  );
}
