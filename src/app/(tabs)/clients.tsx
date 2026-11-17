import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar, Button, Empty, Field } from '../../components/ui';
import { totals } from '../../lib/calc';
import { money } from '../../lib/format';
import { useStore } from '../../lib/store';
import { colors, radius } from '../../lib/theme';

export default function Clients() {
  const { data } = useStore();
  const [q, setQ] = useState('');
  const owed = useMemo(() => {
    const m: Record<string, number> = {};
    for (const d of data.docs) {
      if (d.type === 'invoice' && d.status === 'sent' && d.clientId) m[d.clientId] = (m[d.clientId] ?? 0) + totals(d).total;
    }
    return m;
  }, [data.docs]);
  const list = data.clients
    .filter((c) => `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <FlatList
      data={list}
      keyExtractor={(c) => c.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      ListHeaderComponent={
        <View>
          <Button title="New client" icon="person-add-outline" onPress={() => router.push('/client/new')} style={{ marginBottom: 14 }} />
          {data.clients.length > 4 ? <Field value={q} onChangeText={setQ} placeholder="Search clients" /> : null}
        </View>
      }
      ListEmptyComponent={
        <Empty icon="people-outline" title="No clients yet" body="Save clients once and reuse their details on every invoice and quote." />
      }
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push(`/client/${item.id}`)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}>
          <Avatar name={item.name} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.sub} numberOfLines={1}>
              {[item.phone, item.email].filter(Boolean).join(' · ') || 'No contact details'}
            </Text>
          </View>
          {owed[item.id] ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.owedLabel}>Owes</Text>
              <Text style={styles.owed}>{money(owed[item.id], data.business.currency)}</Text>
            </View>
          ) : null}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: radius.lg,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  owedLabel: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  owed: { fontSize: 15, fontWeight: '800', color: colors.warning },
});
