import Constants from 'expo-constants';
import { router } from 'expo-router';
import React from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import { Card, confirm, Divider, Row, SectionTitle } from '../../components/ui';
import { FREE_DOCS_PER_MONTH, usePro } from '../../lib/pro';
import { useStore } from '../../lib/store';
import { colors } from '../../lib/theme';

const extra = (Constants.expoConfig?.extra ?? {}) as { supportEmail?: string; privacyUrl?: string };

export default function Settings() {
  const { data, usageThisMonth, resetAll } = useStore();
  const { isPro } = usePro();
  const b = data.business;
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Card style={{ paddingVertical: 4 }}>
        <Row
          icon="diamond-outline"
          title={isPro ? 'Quotsy Pro' : 'Upgrade to Pro'}
          subtitle={isPro ? 'Thanks for your support!' : `${usageThisMonth}/${FREE_DOCS_PER_MONTH} free documents used this month`}
          onPress={isPro ? undefined : () => router.push('/paywall')}
        />
      </Card>

      <SectionTitle>Business</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <Row icon="business-outline" title={b.name || 'Business profile'} subtitle="Logo, contact details, tax, payment info" onPress={() => router.push('/business')} />
      </Card>

      <SectionTitle>Support</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        {extra.supportEmail ? (
          <>
            <Row icon="mail-outline" title="Contact support" onPress={() => Linking.openURL(`mailto:${extra.supportEmail}?subject=Quotsy%20feedback`)} />
            <Divider />
          </>
        ) : null}
        {extra.privacyUrl ? (
          <>
            <Row icon="shield-checkmark-outline" title="Privacy policy" onPress={() => Linking.openURL(extra.privacyUrl!)} />
            <Divider />
          </>
        ) : null}
        <Row
          icon="trash-outline"
          title="Erase all data"
          danger
          onPress={() =>
            confirm('Erase everything?', 'All invoices, quotes, clients and settings on this device will be permanently deleted.', 'Erase', () => {
              resetAll();
              router.replace('/onboarding');
            })
          }
        />
      </Card>
      <View style={{ alignItems: 'center', marginTop: 10 }}>
        <Text style={{ color: colors.faint, fontSize: 12 }}>
          Quotsy v{Constants.expoConfig?.version ?? '1.0.0'} · Your data stays on this device
        </Text>
      </View>
    </ScrollView>
  );
}
