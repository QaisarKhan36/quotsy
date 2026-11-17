import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams, usePreventRemove } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Button, Card, Chip, confirm, Field, notify, SectionTitle, tap } from '../../components/ui';
import { lineTotal, totals } from '../../lib/calc';
import { addDays, daysBetween, money, numText, parseNum, prettyDate, uid } from '../../lib/format';
import { onClientPicked, onItemPicked } from '../../lib/picker';
import { useStore } from '../../lib/store';
import { colors, radius } from '../../lib/theme';
import type { Doc, DocType, LineItem } from '../../lib/types';

const INVOICE_TERMS = [
  { label: 'On receipt', days: 0 },
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
];
const QUOTE_TERMS = [
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
  { label: '60 days', days: 60 },
];

export default function EditDoc() {
  const params = useLocalSearchParams<{ id?: string; type?: DocType; clientId?: string }>();
  const insets = useSafeAreaInsets();
  const store = useStore();
  const { data } = store;
  const cur = data.business.currency;

  const [doc, setDoc] = useState<Doc>(() => {
    const existing = params.id ? data.docs.find((d) => d.id === params.id) : undefined;
    return existing ? structuredCloneSafe(existing) : store.draftDoc(params.type === 'quote' ? 'quote' : 'invoice', params.clientId ?? null);
  });
  const isNew = !data.docs.some((d) => d.id === doc.id);
  const [initialJson] = useState(() => JSON.stringify(doc));
  const [leaving, setLeaving] = useState(false);
  const dirty = !leaving && JSON.stringify(doc) !== initialJson;
  const disablePrevention = usePreventRemove(dirty, ({ repeat }) =>
    confirm('Discard changes?', 'Your changes have not been saved.', 'Discard', () => {
      setLeaving(true);
      repeat();
    }),
  );
  const isInvoice = doc.type === 'invoice';
  const t = useMemo(() => totals(doc), [doc]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const set = (patch: Partial<Doc>) => setDoc((d) => ({ ...d, ...patch }));
  const setItem = (id: string, patch: Partial<LineItem>) =>
    setDoc((d) => ({ ...d, items: d.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));

  useEffect(() => {
    onClientPicked((c) =>
      set({ clientId: c.id, clientSnapshot: { name: c.name, email: c.email, phone: c.phone, address: c.address } }),
    );
    onItemPicked((i) => {
      const id = uid();
      setDoc((d) => ({ ...d, items: [...d.items, { id, name: i.name, description: i.description, rate: i.rate, unit: i.unit, quantity: 1 }] }));
    });
  }, []);

  const termDays = doc.dueDate ? daysBetween(doc.issueDate, doc.dueDate) : -1;
  const terms = isInvoice ? INVOICE_TERMS : QUOTE_TERMS;

  const save = () => {
    if (!doc.clientSnapshot?.name) {
      notify('Add a client', `Who is this ${isInvoice ? 'invoice' : 'quote'} for?`);
      router.push('/pick-client');
      return;
    }
    if (doc.items.length === 0) {
      notify('Add an item', 'Add at least one line item.');
      return;
    }
    const cleaned = { ...doc, items: doc.items.filter((i) => i.name.trim() || i.rate) };
    const saved = store.saveDoc(cleaned);
    setLeaving(true);
    disablePrevention();
    if (isNew) router.replace(`/doc/${saved.id}`);
    else router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen
        options={{
          title: isNew ? `New ${isInvoice ? 'invoice' : 'quote'}` : `Edit ${doc.number}`,
          headerRight: () => (
            <Pressable onPress={save} hitSlop={10}>
              <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 17 }}>Save</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
        {/* Client */}
        <SectionTitle>{isInvoice ? 'Bill to' : 'Quote for'}</SectionTitle>
        <Pressable onPress={() => router.push('/pick-client')}>
          <Card style={styles.clientCard}>
            {doc.clientSnapshot ? (
              <>
                <Avatar name={doc.clientSnapshot.name} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.clientName}>{doc.clientSnapshot.name}</Text>
                  <Text style={styles.clientSub} numberOfLines={1}>
                    {[doc.clientSnapshot.email, doc.clientSnapshot.phone].filter(Boolean).join(' · ') || 'Tap to change'}
                  </Text>
                </View>
                <Ionicons name="swap-horizontal" size={20} color={colors.faint} />
              </>
            ) : (
              <>
                <View style={styles.addCircle}>
                  <Ionicons name="person-add-outline" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.clientName, { color: colors.primary, flex: 1 }]}>Add client</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.faint} />
              </>
            )}
          </Card>
        </Pressable>

        {/* Items */}
        <SectionTitle>Items</SectionTitle>
        {doc.items.map((item) => {
          const open = expanded === item.id || !item.name;
          return (
            <Card key={item.id} style={{ padding: 14 }}>
              <Pressable onPress={() => setExpanded(open && item.name ? null : item.id)} style={styles.itemHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name || 'New item'}
                  </Text>
                  <Text style={styles.itemSub}>
                    {item.quantity} {item.unit !== 'each' ? item.unit : '×'} {money(item.rate, cur)}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>{money(lineTotal(item), cur)}</Text>
              </Pressable>
              <View style={styles.qtyRow}>
                <Stepper
                  value={item.quantity}
                  onChange={(q) => setItem(item.id, { quantity: q })}
                />
                <View style={{ flex: 1 }} />
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    tap();
                    setDoc((d) => ({ ...d, items: d.items.filter((i) => i.id !== item.id) }));
                  }}
                  style={styles.trash}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
                <Pressable hitSlop={8} onPress={() => setExpanded(open && item.name ? null : item.id)} style={styles.trash}>
                  <Ionicons name={open ? 'chevron-up' : 'create-outline'} size={18} color={colors.muted} />
                </Pressable>
              </View>
              {open ? (
                <View style={{ marginTop: 12 }}>
                  <Field label="Item" value={item.name} onChangeText={(v) => setItem(item.id, { name: v })} placeholder="e.g. Deep clean" autoFocus={!item.name} />
                  <Field label="Description (optional)" value={item.description} onChangeText={(v) => setItem(item.id, { description: v })} placeholder="Details shown on the PDF" />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <NumField label="Rate" value={item.rate} onChange={(n) => setItem(item.id, { rate: n })} style={{ flex: 1 }} />
                    <NumField label="Qty" value={item.quantity} onChange={(n) => setItem(item.id, { quantity: n })} style={{ flex: 1 }} />
                    <Field label="Unit" value={item.unit} onChangeText={(v) => setItem(item.id, { unit: v })} style={{ flex: 1 }} autoCapitalize="none" />
                  </View>
                </View>
              ) : null}
            </Card>
          );
        })}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <Button title="Add item" icon="add-circle-outline" variant="secondary" onPress={() => router.push('/pick-item')} style={{ flex: 1 }} />
          <Button
            title="Custom"
            icon="create-outline"
            variant="secondary"
            onPress={() => {
              const id = uid();
              setDoc((d) => ({ ...d, items: [...d.items, { id, name: '', description: '', quantity: 1, rate: 0, unit: 'each' }] }));
              setExpanded(id);
            }}
            style={{ flex: 1 }}
          />
        </View>

        {/* Terms */}
        <SectionTitle>{isInvoice ? 'Payment due' : 'Valid for'}</SectionTitle>
        <View style={styles.chips}>
          {terms.map((tm) => (
            <Chip
              key={tm.label}
              label={tm.label}
              active={termDays === tm.days}
              onPress={() => set({ dueDate: addDays(doc.issueDate, tm.days) })}
            />
          ))}
        </View>
        <Text style={styles.dateLine}>
          Issued {prettyDate(doc.issueDate)}
          {doc.dueDate ? ` · ${isInvoice ? 'Due' : 'Valid until'} ${prettyDate(doc.dueDate)}` : ''}
        </Text>

        {/* Adjustments */}
        <SectionTitle>Discount & tax</SectionTitle>
        <Card>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
            <NumField
              label={doc.discountType === 'percent' ? 'Discount %' : `Discount (${cur})`}
              value={doc.discountValue}
              onChange={(n) => set({ discountValue: n })}
              style={{ flex: 1 }}
            />
            <View style={styles.segment}>
              {(['percent', 'amount'] as const).map((k) => (
                <Pressable key={k} onPress={() => set({ discountType: k })} style={[styles.segBtn, doc.discountType === k && styles.segActive]}>
                  <Text style={[styles.segText, doc.discountType === k && { color: '#fff' }]}>{k === 'percent' ? '%' : cur}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <NumField label={`${data.business.taxLabel || 'Tax'} rate %`} value={doc.taxRate} onChange={(n) => set({ taxRate: n })} />
        </Card>

        {/* Notes */}
        <SectionTitle>Notes</SectionTitle>
        <Field value={doc.notes} onChangeText={(v) => set({ notes: v })} multiline placeholder="Thank you note, terms, warranty info…" />

        {/* Totals */}
        <Card style={{ marginTop: 6 }}>
          <TotalRow label="Subtotal" value={money(t.subtotal, cur)} />
          {t.discount > 0 ? <TotalRow label="Discount" value={`−${money(t.discount, cur)}`} /> : null}
          {doc.taxRate > 0 ? <TotalRow label={`${data.business.taxLabel || 'Tax'} (${doc.taxRate}%)`} value={money(t.tax, cur)} /> : null}
          <View style={styles.totalDivider} />
          <TotalRow label="Total" value={money(t.total, cur)} big />
        </Card>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bottomLabel}>Total</Text>
          <Text style={styles.bottomTotal}>{money(t.total, cur)}</Text>
        </View>
        <Button title={isNew ? `Create ${isInvoice ? 'invoice' : 'quote'}` : 'Save changes'} icon="checkmark" onPress={save} style={{ flex: 1.4 }} />
      </View>
    </KeyboardAvoidingView>
  );
}

function structuredCloneSafe<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function NumField({ label, value, onChange, style }: { label: string; value: number; onChange: (n: number) => void; style?: any }) {
  const [text, setText] = useState(() => numText(value));
  const [prev, setPrev] = useState(value);
  // Sync when the value changes from outside (e.g. stepper), without clobbering what the user is typing.
  if (value !== prev) {
    setPrev(value);
    if (parseNum(text) !== value) setText(numText(value));
  }
  return (
    <Field
      label={label}
      value={text}
      keyboardType="decimal-pad"
      placeholder="0"
      onChangeText={(v) => {
        setText(v);
        onChange(parseNum(v));
      }}
      style={style}
    />
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={styles.stepper}>
      <Pressable hitSlop={6} onPress={() => { tap(); onChange(Math.max(0, Math.round((value - 1) * 100) / 100)); }} style={styles.stepBtn}>
        <Ionicons name="remove" size={18} color={colors.text} />
      </Pressable>
      <TextInput
        value={String(value)}
        onChangeText={(v) => onChange(parseNum(v))}
        keyboardType="decimal-pad"
        style={styles.stepValue}
        selectTextOnFocus
      />
      <Pressable hitSlop={6} onPress={() => { tap(); onChange(Math.round((value + 1) * 100) / 100); }} style={styles.stepBtn}>
        <Ionicons name="add" size={18} color={colors.text} />
      </Pressable>
    </View>
  );
}

function TotalRow({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={[{ color: colors.muted, fontSize: 15 }, big && { color: colors.text, fontWeight: '800', fontSize: 18 }]}>{label}</Text>
      <Text style={[{ color: colors.text, fontSize: 15, fontWeight: '600' }, big && { fontWeight: '800', fontSize: 18 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  clientCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clientName: { fontSize: 17, fontWeight: '700', color: colors.text },
  clientSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  addCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemName: { fontSize: 16, fontWeight: '700', color: colors.text },
  itemSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  itemTotal: { fontSize: 16, fontWeight: '800', color: colors.text },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 10, alignSelf: 'flex-start' },
  stepBtn: { width: 40, height: 36, alignItems: 'center', justifyContent: 'center' },
  stepValue: { width: 52, flexGrow: 0, flexShrink: 0, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.text, paddingVertical: 6 },
  trash: { width: 38, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  dateLine: { color: colors.muted, fontSize: 13, marginBottom: 20 },
  segment: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: radius.md, padding: 3, marginBottom: 12 },
  segBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9 },
  segActive: { backgroundColor: colors.primary },
  segText: { fontWeight: '700', color: colors.muted },
  totalDivider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  bottomLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  bottomTotal: { color: colors.text, fontSize: 20, fontWeight: '800' },
});
