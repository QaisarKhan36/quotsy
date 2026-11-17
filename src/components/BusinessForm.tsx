import Ionicons from '@expo/vector-icons/Ionicons';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CURRENCIES, numText, parseNum } from '../lib/format';
import { ACCENTS, colors, radius } from '../lib/theme';
import type { Business } from '../lib/types';
import { Card, Chip, Field, notify, SectionTitle } from './ui';

export async function pickLogo(): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 1 });
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  try {
    // Shrink to a sensible size so storage stays small and PDFs generate quickly.
    const ctx = ImageManipulator.manipulate(a.uri);
    if (a.width > 600) ctx.resize({ width: 600 });
    const ref = await ctx.renderAsync();
    const out = await ref.saveAsync({ format: SaveFormat.PNG, base64: true });
    if (!out.base64) throw new Error('No image data');
    if (out.base64.length > 1_400_000) {
      notify('Image too large', 'Please choose a simpler logo image.');
      return null;
    }
    return `data:image/png;base64,${out.base64}`;
  } catch (e: any) {
    notify('Could not use this image', String(e?.message ?? e));
    return null;
  }
}

export function LogoPicker({ logo, onChange }: { logo: string | null; onChange: (l: string | null) => void }) {
  return (
    <View style={styles.logoRow}>
      <Pressable onPress={async () => { const l = await pickLogo(); if (l) onChange(l); }} style={styles.logoBox}>
        {logo ? <Image source={{ uri: logo }} style={styles.logo} resizeMode="contain" /> : <Ionicons name="image-outline" size={28} color={colors.faint} />}
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={styles.logoTitle}>Business logo</Text>
        <Text style={styles.logoSub}>Appears at the top of every PDF.</Text>
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 6 }}>
          <Pressable onPress={async () => { const l = await pickLogo(); if (l) onChange(l); }}>
            <Text style={styles.link}>{logo ? 'Change' : 'Upload'}</Text>
          </Pressable>
          {logo ? (
            <Pressable onPress={() => onChange(null)}>
              <Text style={[styles.link, { color: colors.danger }]}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function BusinessForm({ b, set }: { b: Business; set: (p: Partial<Business>) => void }) {
  const [taxText, setTaxText] = useState(numText(b.defaultTaxRate));
  return (
    <>
      <SectionTitle>Branding</SectionTitle>
      <Card>
        <LogoPicker logo={b.logo} onChange={(logo) => set({ logo })} />
        <Text style={[styles.label, { marginTop: 16 }]}>Accent colour</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {ACCENTS.map((c) => (
            <Pressable key={c} onPress={() => set({ accentColor: c })} style={[styles.swatch, { backgroundColor: c }, b.accentColor === c && styles.swatchActive]}>
              {b.accentColor === c ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}
            </Pressable>
          ))}
        </View>
      </Card>

      <SectionTitle>Business details</SectionTitle>
      <Card>
        <Field label="Business name" value={b.name} onChangeText={(v) => set({ name: v })} placeholder="e.g. Sparkle Cleaning Co." />
        <Field label="Your name" value={b.ownerName} onChangeText={(v) => set({ ownerName: v })} placeholder="Optional" />
        <Field label="Phone" value={b.phone} onChangeText={(v) => set({ phone: v })} keyboardType="phone-pad" />
        <Field label="Email" value={b.email} onChangeText={(v) => set({ email: v })} keyboardType="email-address" autoCapitalize="none" />
        <Field label="Address" value={b.address} onChangeText={(v) => set({ address: v })} multiline />
        <Field label="Website" value={b.website} onChangeText={(v) => set({ website: v })} autoCapitalize="none" />
        <Field label="Tax / registration number" value={b.taxId} onChangeText={(v) => set({ taxId: v })} placeholder="Optional (VAT, GST, EIN, ABN…)" />
      </Card>

      <SectionTitle>Money</SectionTitle>
      <Card>
        <Text style={styles.label}>Currency</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {CURRENCIES.map((c) => (
            <Chip key={c} label={c} active={b.currency === c} onPress={() => set({ currency: c })} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Field label="Tax name" value={b.taxLabel} onChangeText={(v) => set({ taxLabel: v })} placeholder="Tax / VAT / GST" style={{ flex: 1 }} />
          <Field
            label="Default rate %"
            value={taxText}
            onChangeText={(v) => {
              setTaxText(v);
              set({ defaultTaxRate: parseNum(v) });
            }}
            keyboardType="decimal-pad"
            placeholder="0"
            style={{ flex: 1 }}
          />
        </View>
        <Field
          label="Payment instructions"
          value={b.paymentInstructions}
          onChangeText={(v) => set({ paymentInstructions: v })}
          multiline
          placeholder={'e.g. Bank: 12-34-56 Acc: 12345678\nor PayPal / Venmo / Zelle: you@email.com'}
          hint="Printed on every invoice so clients know how to pay you."
        />
      </Card>

      <SectionTitle>Defaults</SectionTitle>
      <Card>
        <Text style={styles.label}>Invoice payment terms</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {[0, 7, 14, 30].map((d) => (
            <Chip key={d} label={d === 0 ? 'On receipt' : `${d} days`} active={b.defaultDueDays === d} onPress={() => set({ defaultDueDays: d })} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Field label="Invoice prefix" value={b.invoicePrefix} onChangeText={(v) => set({ invoicePrefix: v })} autoCapitalize="characters" style={{ flex: 1 }} />
          <Field label="Quote prefix" value={b.quotePrefix} onChangeText={(v) => set({ quotePrefix: v })} autoCapitalize="characters" style={{ flex: 1 }} />
        </View>
        <Field
          label="Next invoice number"
          value={String(b.nextInvoiceNumber)}
          onChangeText={(v) => set({ nextInvoiceNumber: Math.max(1, Math.floor(parseNum(v)) || 1) })}
          keyboardType="number-pad"
          hint="Switching from another app? Continue your numbering here."
        />
        <Field label="Default notes" value={b.defaultNotes} onChangeText={(v) => set({ defaultNotes: v })} multiline />
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 8 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logoBox: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: { width: '100%', height: '100%' },
  logoTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  logoSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  link: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  swatch: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  swatchActive: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, elevation: 3 },
});
