import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoPicker } from '../components/BusinessForm';
import { Button, Chip, Field, tap } from '../components/ui';
import { CURRENCIES } from '../lib/format';
import { useStore } from '../lib/store';
import { colors, radius } from '../lib/theme';
import { TRADES } from '../lib/trades';

function guessCurrency(): string {
  try {
    const locale = Intl.NumberFormat().resolvedOptions().locale || '';
    const region = locale.split('-').pop()?.toUpperCase();
    const map: Record<string, string> = {
      US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', NZ: 'NZD', IN: 'INR', ZA: 'ZAR', NG: 'NGN', KE: 'KES', PK: 'PKR',
      AE: 'AED', SG: 'SGD', PH: 'PHP', MX: 'MXN', BR: 'BRL', IE: 'EUR', DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR',
    };
    return (region && map[region]) || 'USD';
  } catch {
    return 'USD';
  }
}

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useStore();
  const [step, setStep] = useState(0);
  const [trade, setTrade] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState(guessCurrency);
  const [logo, setLogo] = useState<string | null>(null);

  const finish = () => {
    completeOnboarding({ name: name.trim(), phone, email: email.trim(), currency, logo }, trade ?? 'other');
    router.replace('/');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i <= step && { backgroundColor: colors.primary, width: 24 }]} />
          ))}
        </View>

        {step === 0 ? (
          <>
            <View style={styles.badge}>
              <Ionicons name="receipt" size={30} color="#fff" />
            </View>
            <Text style={styles.h1}>Get paid faster.</Text>
            <Text style={styles.p}>Professional invoices and quotes in 30 seconds, sent straight from your phone.</Text>
            <Text style={styles.h2}>What kind of work do you do?</Text>
            <Text style={styles.small}>We’ll pre-fill common services and prices. You can edit them anytime.</Text>
            <View style={styles.grid}>
              {TRADES.map((t) => {
                const active = trade === t.key;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => {
                      tap();
                      setTrade(t.key);
                    }}
                    style={[styles.trade, active && styles.tradeActive]}
                  >
                    <Ionicons name={t.icon as any} size={24} color={active ? '#fff' : colors.primary} />
                    <Text style={[styles.tradeText, active && { color: '#fff' }]}>{t.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Button title="Continue" onPress={() => setStep(1)} disabled={!trade} />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Text style={styles.h1}>Your business</Text>
            <Text style={styles.p}>This appears on your invoices. Only the name is needed now.</Text>
            <Field label="Business name" value={name} onChangeText={setName} placeholder="e.g. Sparkle Cleaning Co." autoFocus />
            <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Optional" />
            <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="Optional" />
            <Text style={styles.label}>Currency</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {CURRENCIES.map((c) => (
                <Chip key={c} label={c} active={currency === c} onPress={() => setCurrency(c)} />
              ))}
            </View>
            <Button title="Continue" onPress={() => setStep(2)} disabled={!name.trim()} />
            <Button title="Back" variant="ghost" onPress={() => setStep(0)} style={{ marginTop: 6 }} />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text style={styles.h1}>Add your logo</Text>
            <Text style={styles.p}>Branded invoices look more professional and get paid faster. You can skip this.</Text>
            <View style={styles.logoCard}>
              <LogoPicker logo={logo} onChange={setLogo} />
            </View>
            <Button title={logo ? 'Finish setup' : 'Skip for now'} icon="arrow-forward" onPress={finish} />
            <Button title="Back" variant="ghost" onPress={() => setStep(1)} style={{ marginTop: 6 }} />
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', gap: 6, marginBottom: 28 },
  dot: { height: 6, width: 6, borderRadius: 3, backgroundColor: colors.border },
  badge: { width: 60, height: 60, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  h1: { fontSize: 32, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginBottom: 8 },
  h2: { fontSize: 19, fontWeight: '700', color: colors.text, marginTop: 28 },
  p: { fontSize: 17, color: colors.muted, lineHeight: 24, marginBottom: 20 },
  small: { fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  trade: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tradeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tradeText: { fontSize: 16, fontWeight: '700', color: colors.text },
  logoCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 24 },
});
