import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Button, Card, confirm, Field, notify, Row, SectionTitle, StatusPill } from '../../components/ui';
import { displayStatus, totals } from '../../lib/calc';
import { money, uid } from '../../lib/format';
import { emitClient } from '../../lib/picker';
import { FREE_DOCS_PER_MONTH, usePro } from '../../lib/pro';
import { useStore } from '../../lib/store';
import { colors } from '../../lib/theme';
import type { Client } from '../../lib/types';

export default function ClientEdit() {
  const { id, pick } = useLocalSearchParams<{ id: string; pick?: string }>();
  const store = useStore();
  const { isPro } = usePro();
  const existing = store.data.clients.find((c) => c.id === id);
  const [c, setC] = useState<Client>(
    () => existing ?? { id: uid(), name: '', email: '', phone: '', address: '', notes: '', createdAt: Date.now() },
  );
  const set = (patch: Partial<Client>) => setC((x) => ({ ...x, ...patch }));
  const docs = existing ? store.data.docs.filter((d) => d.clientId === existing.id) : [];

  const save = () => {
    if (!c.name.trim()) {
      notify('Name required', 'Enter the client or company name.');
      return;
    }
    const clean = { ...c, name: c.name.trim(), email: c.email.trim() };
    store.upsertClient(clean);
    if (pick) emitClient(clean);
    router.back();
  };

  const newDoc = (type: 'invoice' | 'quote') => {
    if (!isPro && store.usageThisMonth >= FREE_DOCS_PER_MONTH) return router.push('/paywall?reason=limit');
    router.push(`/doc/edit?type=${type}&clientId=${c.id}`);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{
          title: existing ? 'Edit client' : 'New client',
          headerRight: () => (
            <Pressable onPress={save} hitSlop={10}>
              <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 17 }}>Save</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Card>
          <Field label="Name *" value={c.name} onChangeText={(v) => set({ name: v })} placeholder="Client or company name" autoFocus={!existing} />
          <Field label="Phone" value={c.phone} onChangeText={(v) => set({ phone: v })} keyboardType="phone-pad" placeholder="Optional" />
          <Field label="Email" value={c.email} onChangeText={(v) => set({ email: v })} keyboardType="email-address" autoCapitalize="none" placeholder="Optional" />
          <Field label="Address" value={c.address} onChangeText={(v) => set({ address: v })} multiline placeholder="Job or billing address" />
          <Field label="Private notes" value={c.notes} onChangeText={(v) => set({ notes: v })} multiline placeholder="Gate code, pets, preferences… (not shown on PDFs)" />
        </Card>
        <Button title="Save client" icon="checkmark" onPress={save} />

        {existing ? (
          <>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Button title="Invoice" icon="receipt-outline" variant="secondary" onPress={() => newDoc('invoice')} style={{ flex: 1 }} />
              <Button title="Quote" icon="clipboard-outline" variant="secondary" onPress={() => newDoc('quote')} style={{ flex: 1 }} />
            </View>
            {docs.length ? (
              <View style={{ marginTop: 22 }}>
                <SectionTitle>History</SectionTitle>
                <Card style={{ paddingVertical: 4 }}>
                  {docs.map((d) => (
                    <Row
                      key={d.id}
                      title={`${d.number} · ${money(totals(d).total, store.data.business.currency)}`}
                      right={<StatusPill status={displayStatus(d)} />}
                      onPress={() => router.push(`/doc/${d.id}`)}
                    />
                  ))}
                </Card>
              </View>
            ) : null}
            <Button
              title="Delete client"
              variant="danger"
              icon="trash-outline"
              style={{ marginTop: 22 }}
              onPress={() =>
                confirm('Delete client?', 'Existing invoices keep their copy of the client details.', 'Delete', () => {
                  store.deleteClient(existing.id);
                  router.back();
                })
              }
            />
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
