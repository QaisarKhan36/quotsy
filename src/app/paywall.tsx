import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconName, notify } from '../components/ui';
import { FREE_DOCS_PER_MONTH, ProPackage, usePro } from '../lib/pro';
import { colors, radius } from '../lib/theme';

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'infinite', title: 'Unlimited invoices & quotes', body: `Free plan is limited to ${FREE_DOCS_PER_MONTH} per month` },
  { icon: 'sparkles', title: 'No Quotsy footer', body: 'Clean, fully branded PDFs' },
  { icon: 'notifications', title: 'Payment reminders', body: 'Chase late payers with one tap' },
];

export default function Paywall() {
  const insets = useSafeAreaInsets();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const { isPro, available, packages, purchase, restore, devToggle } = usePro();
  const [picked, setPicked] = useState<ProPackage | null>(null);
  const selected = picked ?? packages.find((p) => p.period === 'annual') ?? packages[0] ?? null;
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isPro) router.back();
  }, [isPro]);

  const buy = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      if (await purchase(selected)) router.back();
    } catch (e: any) {
      notify('Purchase failed', String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  const monthly = packages.find((p) => p.period === 'monthly');

  return (
    <View style={{ flex: 1, backgroundColor: '#0B1736' }}>
      <ScrollView contentContainerStyle={{ padding: 22, paddingTop: insets.top + 12, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.close}>
          <Ionicons name="close" size={24} color="rgba(255,255,255,.7)" />
        </Pressable>
        <View style={styles.crown}>
          <Ionicons name="diamond" size={34} color={colors.gold} />
        </View>
        <Text style={styles.h1}>{reason === 'limit' ? "You've hit this month's free limit" : 'Quotsy Pro'}</Text>
        <Text style={styles.sub}>Look professional. Get paid faster. Cancel anytime.</Text>

        <View style={{ marginTop: 26, gap: 18 }}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.feature}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={20} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureBody}>{f.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 30, gap: 10 }}>
          {available ? (
            packages.map((p) => {
              const active = selected?.id === p.id;
              return (
                <Pressable key={p.id} onPress={() => setPicked(p)} style={[styles.plan, active && styles.planActive]}>
                  <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={22} color={active ? colors.gold : 'rgba(255,255,255,.5)'} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planTitle}>{p.period === 'annual' ? 'Yearly' : p.period === 'monthly' ? 'Monthly' : p.period === 'lifetime' ? 'Lifetime' : p.title}</Text>
                    {p.period === 'annual' && monthly ? <Text style={styles.planNote}>Best value — save vs monthly</Text> : null}
                  </View>
                  <Text style={styles.planPrice}>{p.price}</Text>
                  {p.period === 'annual' ? (
                    <View style={styles.saveTag}>
                      <Text style={styles.saveTagText}>BEST VALUE</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })
          ) : (
            <View style={styles.plan}>
              <Text style={[styles.featureBody, { flex: 1 }]}>
                Subscriptions become available once the app is published on the store with in-app purchases set up.
              </Text>
            </View>
          )}
        </View>

        <Button
          title={available ? 'Continue' : 'Not available yet'}
          onPress={buy}
          loading={busy}
          disabled={!available || !selected}
          style={{ marginTop: 18, backgroundColor: colors.gold, borderColor: colors.gold }}
        />
        <View style={styles.links}>
          <Pressable
            onPress={async () => {
              try {
                const ok = await restore();
                notify(ok ? 'Purchases restored' : 'Nothing to restore', ok ? 'Welcome back to Pro!' : 'No active subscription found for this account.');
              } catch (e: any) {
                notify('Restore failed', String(e?.message ?? e));
              }
            }}
          >
            <Text style={styles.link}>Restore purchases</Text>
          </Pressable>
          {__DEV__ ? (
            <Pressable onPress={devToggle}>
              <Text style={styles.link}>[Dev] toggle Pro</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.legal}>
          Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel anytime in your
          store account settings.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  close: { alignSelf: 'flex-end', padding: 4 },
  crown: { width: 70, height: 70, borderRadius: 22, backgroundColor: 'rgba(245,158,11,.14)', alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 18 },
  h1: { color: '#fff', fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  sub: { color: 'rgba(255,255,255,.7)', fontSize: 16, marginTop: 8, lineHeight: 22 },
  feature: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  featureIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  featureTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  featureBody: { color: 'rgba(255,255,255,.6)', fontSize: 14, marginTop: 2 },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,.15)',
    backgroundColor: 'rgba(255,255,255,.04)',
  },
  planActive: { borderColor: colors.gold, backgroundColor: 'rgba(245,158,11,.08)' },
  planTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  planNote: { color: colors.gold, fontSize: 12, fontWeight: '600', marginTop: 2 },
  planPrice: { color: '#fff', fontSize: 17, fontWeight: '800' },
  saveTag: { position: 'absolute', top: -10, right: 14, backgroundColor: colors.gold, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  saveTagText: { color: '#0B1736', fontSize: 10, fontWeight: '900' },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 16 },
  link: { color: 'rgba(255,255,255,.7)', fontSize: 14, fontWeight: '600' },
  legal: { color: 'rgba(255,255,255,.4)', fontSize: 11, textAlign: 'center', marginTop: 18, lineHeight: 16 },
});
