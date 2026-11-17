import { router } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Empty } from '../../components/ui';
import { money } from '../../lib/format';
import { useStore } from '../../lib/store';
import { colors, radius } from '../../lib/theme';

export default function Items() {
  const { data } = useStore();
  const list = [...data.items].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <FlatList
      data={list}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      ListHeaderComponent={
        <View>
          <Button title="New item" icon="add-circle-outline" onPress={() => router.push('/item/new')} style={{ marginBottom: 8 }} />
          <Text style={styles.help}>Save your services and prices once, then add them to any invoice in one tap.</Text>
        </View>
      }
      ListEmptyComponent={<Empty icon="pricetags-outline" title="No saved items" body="Add the services you charge for most often." />}
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push(`/item/${item.id}`)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name}</Text>
            {item.description ? <Text style={styles.sub} numberOfLines={1}>{item.description}</Text> : null}
          </View>
          <Text style={styles.price}>
            {money(item.rate, data.business.currency)}
            <Text style={styles.unit}> /{item.unit}</Text>
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  help: { color: colors.muted, fontSize: 13, marginBottom: 14, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    padding: 15,
    borderRadius: radius.lg,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  price: { fontSize: 15, fontWeight: '800', color: colors.text },
  unit: { fontSize: 12, fontWeight: '500', color: colors.muted },
});
