import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip, Empty, StatusPill, tap } from '../../components/ui';
import { displayStatus, totals } from '../../lib/calc';
import { money, monthKey, prettyDate } from '../../lib/format';
import { FREE_DOCS_PER_MONTH, usePro } from '../../lib/pro';
import { useStore } from '../../lib/store';
import { colors, radius } from '../../lib/theme';
import type { Doc } from '../../lib/types';

type Filter = 'all' | 'invoices' | 'quotes' | 'unpaid' | 'paid';

export default function Home() {
  const insets = useSafeAreaInsets();
  const { data, usageThisMonth } = useStore();
  const { isPro } = usePro();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [fabOpen, setFabOpen] = useState(false);
  const cur = data.business.currency;

  const stats = useMemo(() => {
    let outstanding = 0;
    let overdue = 0;
    let overdueCount = 0;
    let paidThisMonth = 0;
    let openQuotes = 0;
    const mk = monthKey();
    for (const d of data.docs) {
      const t = totals(d).total;
      const st = displayStatus(d);
      if (d.type === 'invoice') {
        if (st === 'draft' || st === 'sent' || st === 'overdue') outstanding += t;
        if (st === 'overdue') {
          overdue += t;
          overdueCount++;
        }
        if (st === 'paid' && d.paidAt && monthKey(new Date(d.paidAt)) === mk) paidThisMonth += t;
      } else if (st === 'sent' || st === 'draft') openQuotes += t;
    }
    return { outstanding, overdue, overdueCount, paidThisMonth, openQuotes };
  }, [data.docs]);

  const docs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.docs
      .filter((d) => {
        const st = displayStatus(d);
        if (filter === 'invoices' && d.type !== 'invoice') return false;
        if (filter === 'quotes' && d.type !== 'quote') return false;
        if (filter === 'unpaid' && !(d.type === 'invoice' && (st === 'sent' || st === 'overdue' || st === 'draft'))) return false;
        if (filter === 'paid' && st !== 'paid') return false;
        if (q && !`${d.number} ${d.clientSnapshot?.name ?? ''}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [data.docs, filter, query]);

  const create = (type: 'invoice' | 'quote') => {
    setFabOpen(false);
    if (!isPro && usageThisMonth >= FREE_DOCS_PER_MONTH) {
      router.push('/paywall?reason=limit');
      return;
    }
    router.push(`/doc/edit?type=${type}`);
  };

  const header = (
    <View>
      <View style={[styles.hero, { paddingTop: insets.top + 14 }]}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello} numberOfLines={1}>
              {data.business.name || 'Your business'}
            </Text>
            <Text style={styles.heroLabel}>Outstanding</Text>
          </View>
          {!isPro ? (
            <Pressable onPress={() => router.push('/paywall')} style={styles.proBadge}>
              <Ionicons name="diamond" size={14} color={colors.gold} />
              <Text style={styles.proBadgeText}>Go Pro</Text>
            </Pressable>
          ) : (
            <View style={styles.proBadge}>
              <Ionicons name="diamond" size={14} color={colors.gold} />
              <Text style={styles.proBadgeText}>Pro</Text>
            </View>
          )}
        </View>
        <Text style={styles.heroAmount}>{money(stats.outstanding, cur)}</Text>
        <View style={styles.statRow}>
          <Stat label="Paid this month" value={money(stats.paidThisMonth, cur)} />
          <Stat
            label={stats.overdueCount ? `Overdue (${stats.overdueCount})` : 'Overdue'}
            value={money(stats.overdue, cur)}
            alert={stats.overdue > 0}
          />
          <Stat label="Open quotes" value={money(stats.openQuotes, cur)} />
        </View>
      </View>

      {!isPro ? (
        <Pressable style={styles.usage} onPress={() => router.push('/paywall')}>
          <Text style={styles.usageText}>
            {Math.min(usageThisMonth, FREE_DOCS_PER_MONTH)} of {FREE_DOCS_PER_MONTH} free documents used this month
          </Text>
          <Text style={styles.usageLink}>Unlimited →</Text>
        </Pressable>
      ) : null}

      {data.docs.length > 0 ? (
        <>
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={colors.faint} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by client or number"
              placeholderTextColor={colors.faint}
              style={styles.searchInput}
            />
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}
            data={[
              ['all', 'All'],
              ['invoices', 'Invoices'],
              ['quotes', 'Quotes'],
              ['unpaid', 'Unpaid'],
              ['paid', 'Paid'],
            ] as [Filter, string][]}
            keyExtractor={(i) => i[0]}
            renderItem={({ item }) => <Chip label={item[1]} active={filter === item[0]} onPress={() => setFilter(item[0])} />}
          />
        </>
      ) : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={docs}
        keyExtractor={(d) => d.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => <DocRow doc={item} currency={cur} />}
        initialNumToRender={12}
        windowSize={7}
        ListEmptyComponent={
          data.docs.length === 0 ? (
            <Empty
              icon="document-text-outline"
              title="Create your first invoice"
              body="It takes about 30 seconds. Add a client, pick your items, and send a professional PDF straight from your phone."
            />
          ) : (
            <Text style={{ textAlign: 'center', color: colors.muted, marginTop: 30 }}>Nothing matches.</Text>
          )
        }
      />

      {fabOpen ? <Pressable style={StyleSheet.absoluteFill} onPress={() => setFabOpen(false)} /> : null}
      {fabOpen ? (
        <View style={[styles.fabMenu, { bottom: 92 }]}>
          <FabOption icon="receipt-outline" label="New invoice" onPress={() => create('invoice')} />
          <FabOption icon="clipboard-outline" label="New quote" onPress={() => create('quote')} />
        </View>
      ) : null}
      <Pressable
        accessibilityLabel="Create new"
        onPress={() => {
          tap();
          setFabOpen((v) => !v);
        }}
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.95 }] }]}
      >
        <Ionicons name={fabOpen ? 'close' : 'add'} size={30} color="#fff" />
        {!fabOpen ? <Text style={styles.fabText}>New</Text> : null}
      </Pressable>
    </View>
  );
}

function Stat({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.statValue, alert && { color: '#FCA5A5' }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function FabOption({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.fabOption, pressed && { opacity: 0.8 }]}>
      <View style={styles.fabOptionIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={styles.fabOptionText}>{label}</Text>
    </Pressable>
  );
}

const DocRow = React.memo(function DocRow({ doc, currency }: { doc: Doc; currency: string }) {
  const st = displayStatus(doc);
  return (
    <Pressable
      onPress={() => router.push(`/doc/${doc.id}`)}
      style={({ pressed }) => [styles.docRow, pressed && { backgroundColor: '#F8FAFC' }]}
    >
      <View style={[styles.docIcon, doc.type === 'quote' && { backgroundColor: '#F3EEFF' }]}>
        <Ionicons
          name={doc.type === 'invoice' ? 'receipt-outline' : 'clipboard-outline'}
          size={20}
          color={doc.type === 'invoice' ? colors.primary : '#7C3AED'}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.docClient} numberOfLines={1}>
          {doc.clientSnapshot?.name || 'No client'}
        </Text>
        <Text style={styles.docMeta}>
          {doc.number} · {prettyDate(doc.issueDate)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 5 }}>
        <Text style={styles.docAmount}>{money(totals(doc).total, currency)}</Text>
        <StatusPill status={st} />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 14,
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start' },
  hello: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 14 },
  heroLabel: { color: 'rgba(255,255,255,.75)', fontSize: 14, fontWeight: '600' },
  heroAmount: { color: '#fff', fontSize: 38, fontWeight: '800', marginTop: 2, letterSpacing: -0.5 },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,.16)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },
  proBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  statRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  stat: { flex: 1, backgroundColor: 'rgba(255,255,255,.13)', borderRadius: radius.md, padding: 10 },
  statLabel: { color: 'rgba(255,255,255,.75)', fontSize: 11, fontWeight: '600' },
  statValue: { color: '#fff', fontSize: 15, fontWeight: '800', marginTop: 3 },
  usage: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageText: { color: '#92400E', fontSize: 13, fontWeight: '600', flex: 1 },
  usageLink: { color: '#92400E', fontWeight: '800', fontSize: 13 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: colors.text },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  docIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  docClient: { fontSize: 16, fontWeight: '700', color: colors.text },
  docMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  docAmount: { fontSize: 16, fontWeight: '800', color: colors.text },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    height: 58,
    minWidth: 58,
    paddingHorizontal: 18,
    borderRadius: 29,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  fabMenu: { position: 'absolute', right: 20, gap: 10, alignItems: 'flex-end' },
  fabOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 18,
    borderRadius: 999,
    shadowColor: '#0F172A',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  fabOptionIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  fabOptionText: { fontSize: 16, fontWeight: '700', color: colors.text },
});
