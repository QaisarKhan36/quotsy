import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { addDays, monthKey, todayISO, uid } from './format';
import { TRADES } from './trades';
import type { AppData, Business, Client, Doc, DocType, SavedItem } from './types';

const KEY = 'quotsy:data:v1';

export const defaultBusiness: Business = {
  name: '',
  ownerName: '',
  email: '',
  phone: '',
  address: '',
  website: '',
  taxId: '',
  logo: null,
  currency: 'USD',
  defaultTaxRate: 0,
  taxLabel: 'Tax',
  paymentInstructions: '',
  defaultNotes: 'Thank you for your business!',
  defaultDueDays: 14,
  invoicePrefix: 'INV-',
  quotePrefix: 'QUO-',
  nextInvoiceNumber: 1,
  nextQuoteNumber: 1,
  accentColor: '#2563EB',
  trade: 'other',
};

const emptyData: AppData = {
  version: 1,
  onboarded: false,
  business: defaultBusiness,
  clients: [],
  items: [],
  docs: [],
  usage: {},
};

interface Store {
  ready: boolean;
  data: AppData;
  updateBusiness: (patch: Partial<Business>) => void;
  completeOnboarding: (business: Partial<Business>, tradeKey: string) => void;
  upsertClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  upsertItem: (item: SavedItem) => void;
  deleteItem: (id: string) => void;
  /** Builds a new unsaved document with defaults. Not persisted until saveDoc. */
  draftDoc: (type: DocType, clientId?: string | null) => Doc;
  saveDoc: (doc: Doc) => Doc;
  patchDoc: (id: string, patch: Partial<Doc>) => void;
  setPaid: (id: string, paid: boolean) => void;
  deleteDoc: (id: string) => void;
  duplicateDoc: (id: string) => Doc | null;
  convertQuoteToInvoice: (quoteId: string) => Doc | null;
  usageThisMonth: number;
  resetAll: () => void;
}

const Ctx = createContext<Store | null>(null);

function pad(n: number) {
  return String(n).padStart(4, '0');
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [ready, setReady] = useState(false);
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as AppData;
          setData({ ...emptyData, ...parsed, business: { ...defaultBusiness, ...parsed.business } });
        }
      } catch (e) {
        console.warn('Failed to load data', e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Persist changes, batched (300ms) so rapid edits don't hammer storage.
  const pending = useRef<AppData | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const d = pending.current;
    pending.current = null;
    if (d) AsyncStorage.setItem(KEY, JSON.stringify(d)).catch((e) => console.warn('Failed to save', e));
  }, []);
  useEffect(() => {
    if (!ready) return;
    pending.current = data;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 300);
  }, [data, ready, flush]);
  // Never lose data if the app is backgrounded/killed right after an edit.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') flush();
    });
    return () => sub.remove();
  }, [flush]);

  const update = useCallback((fn: (d: AppData) => AppData) => setData((d) => fn(d)), []);

  const updateBusiness = useCallback(
    (patch: Partial<Business>) => update((d) => ({ ...d, business: { ...d.business, ...patch } })),
    [update],
  );

  const completeOnboarding = useCallback(
    (business: Partial<Business>, tradeKey: string) =>
      update((d) => {
        const trade = TRADES.find((t) => t.key === tradeKey) ?? TRADES[TRADES.length - 1];
        const items = d.items.length ? d.items : trade.items.map((i) => ({ ...i, id: uid() }));
        return { ...d, onboarded: true, items, business: { ...d.business, ...business, trade: tradeKey } };
      }),
    [update],
  );

  const upsertClient = useCallback(
    (client: Client) =>
      update((d) => {
        const exists = d.clients.some((c) => c.id === client.id);
        const clients = exists ? d.clients.map((c) => (c.id === client.id ? client : c)) : [client, ...d.clients];
        return { ...d, clients };
      }),
    [update],
  );

  const deleteClient = useCallback(
    (id: string) => update((d) => ({ ...d, clients: d.clients.filter((c) => c.id !== id) })),
    [update],
  );

  const upsertItem = useCallback(
    (item: SavedItem) =>
      update((d) => {
        const exists = d.items.some((i) => i.id === item.id);
        const items = exists ? d.items.map((i) => (i.id === item.id ? item : i)) : [item, ...d.items];
        return { ...d, items };
      }),
    [update],
  );

  const deleteItem = useCallback(
    (id: string) => update((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) })),
    [update],
  );

  const draftDoc = useCallback((type: DocType, clientId: string | null = null): Doc => {
    const b = dataRef.current.business;
    const client = clientId ? dataRef.current.clients.find((c) => c.id === clientId) : undefined;
    const issue = todayISO();
    return {
      id: uid(),
      type,
      number: '',
      status: 'draft',
      clientId: client?.id ?? null,
      clientSnapshot: client
        ? { name: client.name, email: client.email, phone: client.phone, address: client.address }
        : null,
      issueDate: issue,
      dueDate: addDays(issue, type === 'invoice' ? b.defaultDueDays : 30),
      items: [],
      discountType: 'percent',
      discountValue: 0,
      taxRate: b.defaultTaxRate,
      notes: b.defaultNotes,
      paidAt: null,
      sourceQuoteId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }, []);

  const saveDoc = useCallback((doc: Doc): Doc => {
    const d = dataRef.current;
    const exists = d.docs.some((x) => x.id === doc.id);
    let saved = { ...doc, updatedAt: Date.now() };
    let business = d.business;
    let usage = d.usage;
    if (!exists) {
      if (!saved.number) {
        if (doc.type === 'invoice') {
          saved.number = business.invoicePrefix + pad(business.nextInvoiceNumber);
          business = { ...business, nextInvoiceNumber: business.nextInvoiceNumber + 1 };
        } else {
          saved.number = business.quotePrefix + pad(business.nextQuoteNumber);
          business = { ...business, nextQuoteNumber: business.nextQuoteNumber + 1 };
        }
      }
      const mk = monthKey();
      usage = { ...usage, [mk]: (usage[mk] ?? 0) + 1 };
    }
    const docs = exists ? d.docs.map((x) => (x.id === doc.id ? saved : x)) : [saved, ...d.docs];
    const next = { ...d, docs, business, usage };
    dataRef.current = next;
    setData(next);
    return saved;
  }, []);

  const patchDoc = useCallback(
    (id: string, patch: Partial<Doc>) =>
      update((d) => ({
        ...d,
        docs: d.docs.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x)),
      })),
    [update],
  );

  const setPaid = useCallback(
    (id: string, paid: boolean) => patchDoc(id, paid ? { status: 'paid', paidAt: Date.now() } : { status: 'sent', paidAt: null }),
    [patchDoc],
  );

  const deleteDoc = useCallback(
    (id: string) => update((d) => ({ ...d, docs: d.docs.filter((x) => x.id !== id) })),
    [update],
  );

  const duplicateDoc = useCallback(
    (id: string) => {
      const src = dataRef.current.docs.find((x) => x.id === id);
      if (!src) return null;
      const fresh = draftDoc(src.type, src.clientId);
      return saveDoc({
        ...fresh,
        clientSnapshot: src.clientSnapshot,
        items: src.items.map((i) => ({ ...i, id: uid() })),
        discountType: src.discountType,
        discountValue: src.discountValue,
        taxRate: src.taxRate,
        notes: src.notes,
      });
    },
    [draftDoc, saveDoc],
  );

  const convertQuoteToInvoice = useCallback(
    (quoteId: string) => {
      const q = dataRef.current.docs.find((x) => x.id === quoteId);
      if (!q || q.type !== 'quote') return null;
      const fresh = draftDoc('invoice', q.clientId);
      const inv = saveDoc({
        ...fresh,
        clientSnapshot: q.clientSnapshot,
        items: q.items.map((i) => ({ ...i, id: uid() })),
        discountType: q.discountType,
        discountValue: q.discountValue,
        taxRate: q.taxRate,
        notes: q.notes,
        sourceQuoteId: q.id,
      });
      patchDoc(q.id, { status: 'accepted' });
      return inv;
    },
    [draftDoc, saveDoc, patchDoc],
  );

  const resetAll = useCallback(() => {
    pending.current = null;
    if (timer.current) clearTimeout(timer.current);
    setData(emptyData);
    AsyncStorage.removeItem(KEY).catch(() => {});
  }, []);

  const value = useMemo<Store>(
    () => ({
      ready,
      data,
      updateBusiness,
      completeOnboarding,
      upsertClient,
      deleteClient,
      upsertItem,
      deleteItem,
      draftDoc,
      saveDoc,
      patchDoc,
      setPaid,
      deleteDoc,
      duplicateDoc,
      convertQuoteToInvoice,
      usageThisMonth: data.usage[monthKey()] ?? 0,
      resetAll,
    }),
    [ready, data, updateBusiness, completeOnboarding, upsertClient, deleteClient, upsertItem, deleteItem, draftDoc, saveDoc, patchDoc, setPaid, deleteDoc, duplicateDoc, convertQuoteToInvoice, resetAll],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}
