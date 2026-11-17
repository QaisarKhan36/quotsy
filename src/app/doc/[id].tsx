import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as StoreReview from 'expo-store-review';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, confirm, IconName, notify, StatusPill } from '../../components/ui';
import { displayStatus, lineTotal, overdueDays, totals } from '../../lib/calc';
import { money, prettyDate, toISODate } from '../../lib/format';
import { printDoc, sharePdf } from '../../lib/pdf';
import { FREE_DOCS_PER_MONTH, usePro } from '../../lib/pro';
import { useStore } from '../../lib/store';
import { colors, radius } from '../../lib/theme';

export default function DocDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const store = useStore();
  const { isPro } = usePro();
  const { data } = store;
  const doc = data.docs.find((d) => d.id === id);
  const [busy, setBusy] = useState(false);

  if (!doc) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Stack.Screen options={{ title: '' }} />
        <Text style={{ color: colors.muted }}>This document was deleted.</Text>
      </View>
    );
  }

  const b = data.business;
  const cur = b.currency;
  const t = totals(doc);
  const st = displayStatus(doc);
  const isInvoice = doc.type === 'invoice';
  const accent = b.accentColor || colors.primary;
  const c = doc.clientSnapshot;

  const send = async () => {
    setBusy(true);
    try {
      await sharePdf(doc, b, !isPro);
      if (doc.status === 'draft') store.patchDoc(doc.id, { status: 'sent' });
    } catch (e: any) {
      notify('Could not create PDF', String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  const markPaid = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    store.setPaid(doc.id, true);
    maybeAskForReview(data.docs.filter((d) => d.status === 'paid').length + 1);
  };

  const remind = async () => {
    if (!isPro) {
      router.push('/paywall');
      return;
    }
    const days = overdueDays(doc);
    const msg =
      `Hi ${c?.name?.split(' ')[0] || 'there'}, this is a friendly reminder that invoice ${doc.number} for ${money(t.total, cur)}` +
      (st === 'overdue' ? ` was due on ${prettyDate(doc.dueDate)} (${days} day${days === 1 ? '' : 's'} ago).` : ` is due on ${prettyDate(doc.dueDate)}.`) +
      (b.paymentInstructions ? `\n\nPayment details:\n${b.paymentInstructions}` : '') +
      `\n\nThank you!\n${b.ownerName || b.name}`;
    try {
      await Share.share({ message: msg });
    } catch {}
  };

  const convert = () => {
    if (!isPro && store.usageThisMonth >= FREE_DOCS_PER_MONTH) {
      router.push('/paywall?reason=limit');
      return;
    }
    const inv = store.convertQuoteToInvoice(doc.id);
    if (inv) router.replace(`/doc/${inv.id}`);
  };

  const duplicate = () => {
    if (!isPro && store.usageThisMonth >= FREE_DOCS_PER_MONTH) {
      router.push('/paywall?reason=limit');
      return;
    }
    const copy = store.duplicateDoc(doc.id);
    if (copy) router.replace(`/doc/edit?id=${copy.id}`);
  };

  const del = () =>
    confirm(`Delete ${doc.number}?`, 'This cannot be undone.', 'Delete', () => {
      store.deleteDoc(doc.id);
      router.back();
    });

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: doc.number,
          headerRight: () => (
            <Pressable onPress={() => router.push(`/doc/edit?id=${doc.id}`)} hitSlop={10}>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 17 }}>Edit</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
        {/* Status banner */}
        <View style={styles.statusRow}>
          <StatusPill status={st} />
          <Text style={styles.statusText}>
            {st === 'paid' && doc.paidAt
              ? `Paid ${prettyDate(toISODate(new Date(doc.paidAt)))}`
              : st === 'overdue'
                ? `${overdueDays(doc)} days overdue`
                : doc.dueDate
                  ? `${isInvoice ? 'Due' : 'Valid until'} ${prettyDate(doc.dueDate)}`
                  : ''}
          </Text>
        </View>

        {/* Paper preview */}
        <View style={styles.paper}>
          <View style={styles.paperTop}>
            <View style={{ flex: 1 }}>
              {b.logo ? <Image source={{ uri: b.logo }} style={styles.logo} resizeMode="contain" /> : null}
              <Text style={styles.bizName}>{b.name || 'Your Business'}</Text>
              {b.email ? <Text style={styles.small}>{b.email}</Text> : null}
              {b.phone ? <Text style={styles.small}>{b.phone}</Text> : null}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.docTitle, { color: accent }]}>{isInvoice ? 'INVOICE' : 'QUOTE'}</Text>
              <Text style={styles.small}>{doc.number}</Text>
              <Text style={styles.small}>{prettyDate(doc.issueDate)}</Text>
            </View>
          </View>
          <View style={[styles.bar, { backgroundColor: accent }]} />
          <Text style={styles.label}>{isInvoice ? 'BILL TO' : 'PREPARED FOR'}</Text>
          <Text style={styles.clientName}>{c?.name || '—'}</Text>
          {c?.address ? <Text style={styles.small}>{c.address}</Text> : null}
          {c?.email ? <Text style={styles.small}>{c.email}</Text> : null}

          <View style={[styles.tableHead, { backgroundColor: accent }]}>
            <Text style={[styles.th, { flex: 1 }]}>ITEM</Text>
            <Text style={styles.th}>AMOUNT</Text>
          </View>
          {doc.items.map((i) => (
            <View key={i.id} style={styles.tr}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.itemName}>{i.name}</Text>
                <Text style={styles.small}>
                  {i.quantity} {i.unit !== 'each' ? i.unit : '×'} {money(i.rate, cur)}
                  {i.description ? ` · ${i.description}` : ''}
                </Text>
              </View>
              <Text style={styles.itemAmt}>{money(lineTotal(i), cur)}</Text>
            </View>
          ))}
          <View style={{ marginTop: 10, alignSelf: 'flex-end', minWidth: 200 }}>
            <Line label="Subtotal" value={money(t.subtotal, cur)} />
            {t.discount > 0 ? <Line label="Discount" value={`−${money(t.discount, cur)}`} /> : null}
            {doc.taxRate > 0 ? <Line label={`${b.taxLabel || 'Tax'} (${doc.taxRate}%)`} value={money(t.tax, cur)} /> : null}
            <View style={[styles.totalLine, { borderTopColor: accent }]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={[styles.totalValue, { color: accent }]}>{money(t.total, cur)}</Text>
            </View>
          </View>
          {doc.notes ? (
            <>
              <Text style={[styles.label, { marginTop: 18 }]}>NOTES</Text>
              <Text style={styles.small}>{doc.notes}</Text>
            </>
          ) : null}
          {st === 'paid' ? (
            <View style={styles.paidStamp} pointerEvents="none">
              <Text style={styles.paidStampText}>PAID</Text>
            </View>
          ) : null}
        </View>

        {/* Actions */}
        <Card style={{ paddingVertical: 4 }}>
          {isInvoice && st !== 'paid' ? (
            <Action icon="checkmark-circle-outline" label="Mark as paid" color={colors.success} onPress={markPaid} />
          ) : null}
          {isInvoice && st === 'paid' ? (
            <Action icon="arrow-undo-outline" label="Mark as unpaid" onPress={() => store.setPaid(doc.id, false)} />
          ) : null}
          {isInvoice && (st === 'sent' || st === 'overdue') ? (
            <Action icon="notifications-outline" label="Send payment reminder" onPress={remind} />
          ) : null}
          {!isInvoice ? <Action icon="swap-horizontal-outline" label="Convert to invoice" color={colors.primary} onPress={convert} /> : null}
          {!isInvoice && doc.status !== 'accepted' ? (
            <Action icon="thumbs-up-outline" label="Mark accepted" onPress={() => store.patchDoc(doc.id, { status: 'accepted' })} />
          ) : null}
          {!isInvoice && doc.status !== 'declined' ? (
            <Action icon="thumbs-down-outline" label="Mark declined" onPress={() => store.patchDoc(doc.id, { status: 'declined' })} />
          ) : null}
          <Action icon="print-outline" label="Print / preview PDF" onPress={() => printDoc(doc, b, !isPro).catch(() => {})} />
          <Action icon="copy-outline" label="Duplicate" onPress={duplicate} />
          <Action icon="trash-outline" label="Delete" color={colors.danger} onPress={del} last />
        </Card>
        {!isPro ? (
          <Pressable onPress={() => router.push('/paywall')}>
            <Text style={styles.watermarkNote}>
              Free PDFs include a small “Created with Quotsy” footer. <Text style={{ color: colors.primary, fontWeight: '700' }}>Remove it with Pro</Text>
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Button title={doc.status === 'draft' ? `Send ${isInvoice ? 'invoice' : 'quote'}` : 'Share PDF'} icon="paper-plane" onPress={send} loading={busy} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

/** Ask happy users (just got paid, at least twice) for a store rating, once. */
async function maybeAskForReview(paidCount: number) {
  try {
    if (Platform.OS === 'web' || paidCount < 2) return;
    if (await AsyncStorage.getItem('quotsy:reviewAsked')) return;
    if (!(await StoreReview.isAvailableAsync())) return;
    await AsyncStorage.setItem('quotsy:reviewAsked', '1');
    setTimeout(() => StoreReview.requestReview().catch(() => {}), 1200);
  } catch {}
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, gap: 20 }}>
      <Text style={styles.small}>{label}</Text>
      <Text style={[styles.small, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function Action({ icon, label, onPress, color, last }: { icon: IconName; label: string; onPress: () => void; color?: string; last?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.action, !last && styles.actionBorder, pressed && { opacity: 0.6 }]}>
      <Ionicons name={icon} size={21} color={color ?? colors.text} />
      <Text style={[styles.actionText, color ? { color } : null]}>{label}</Text>
      <Ionicons name="chevron-forward" size={17} color={colors.faint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  statusText: { color: colors.muted, fontWeight: '600' },
  paper: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    overflow: 'hidden',
  },
  paperTop: { flexDirection: 'row', gap: 10 },
  logo: { width: 90, height: 44, marginBottom: 6 },
  bizName: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 2 },
  docTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  small: { fontSize: 12, color: colors.muted, lineHeight: 17 },
  bar: { height: 3, borderRadius: 2, marginVertical: 14 },
  label: { fontSize: 10, fontWeight: '800', color: colors.faint, letterSpacing: 1, marginBottom: 3 },
  clientName: { fontSize: 15, fontWeight: '700', color: colors.text },
  tableHead: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 6, marginTop: 16 },
  th: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  tr: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  itemName: { fontSize: 14, fontWeight: '600', color: colors.text },
  itemAmt: { fontSize: 14, fontWeight: '700', color: colors.text },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 2, marginTop: 6, paddingTop: 8 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: colors.text },
  totalValue: { fontSize: 18, fontWeight: '900' },
  paidStamp: {
    position: 'absolute',
    top: '40%',
    left: '22%',
    borderWidth: 5,
    borderColor: 'rgba(5,150,105,.25)',
    borderRadius: 12,
    paddingHorizontal: 18,
    transform: [{ rotate: '-16deg' }],
  },
  paidStampText: { fontSize: 52, fontWeight: '900', color: 'rgba(5,150,105,.25)' },
  action: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  actionBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  actionText: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  watermarkNote: { textAlign: 'center', color: colors.muted, fontSize: 13, paddingHorizontal: 20, lineHeight: 19 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
