import Constants from 'expo-constants';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * In-app purchases via RevenueCat.
 *
 * Setup (once): create a RevenueCat project, add your Google Play / App Store app,
 * create an entitlement called "pro" and an offering with monthly + annual packages.
 * Then put the public SDK keys in app.json → expo.extra.revenueCat.{android,ios}.
 *
 * Without keys (e.g. in Expo Go or while developing) purchases are disabled and,
 * in development builds only, a "dev unlock" toggle is available for testing.
 */

export const FREE_DOCS_PER_MONTH = 3;
export const ENTITLEMENT = 'pro';

export interface ProPackage {
  id: string;
  title: string;
  price: string;
  period: 'monthly' | 'annual' | 'lifetime' | 'other';
  raw: unknown;
}

interface ProState {
  isPro: boolean;
  available: boolean;
  packages: ProPackage[];
  purchase: (pkg: ProPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  devToggle: () => void;
}

const Ctx = createContext<ProState | null>(null);
const DEV_KEY = 'quotsy:devpro';

function apiKey(): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as { revenueCat?: { android?: string; ios?: string } };
  const rc = extra.revenueCat ?? {};
  return (Platform.OS === 'ios' ? rc.ios : Platform.OS === 'android' ? rc.android : '') ?? '';
}

function loadPurchases(): any | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-purchases').default;
  } catch {
    return null;
  }
}

export function ProProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [devPro, setDevPro] = useState(false);
  const [packages, setPackages] = useState<ProPackage[]>([]);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (__DEV__) AsyncStorage.getItem(DEV_KEY).then((v) => setDevPro(v === '1')).catch(() => {});
    const key = apiKey();
    const Purchases = loadPurchases();
    if (!key || !Purchases) return;
    let cancelled = false;
    (async () => {
      try {
        Purchases.configure({ apiKey: key });
        const apply = (info: any) => !cancelled && setIsPro(!!info?.entitlements?.active?.[ENTITLEMENT]);
        Purchases.addCustomerInfoUpdateListener(apply);
        apply(await Purchases.getCustomerInfo());
        const offerings = await Purchases.getOfferings();
        const pkgs: ProPackage[] = (offerings?.current?.availablePackages ?? []).map((p: any) => ({
          id: p.identifier,
          title: p.product?.title ?? p.identifier,
          price: p.product?.priceString ?? '',
          period:
            p.packageType === 'MONTHLY' ? 'monthly' : p.packageType === 'ANNUAL' ? 'annual' : p.packageType === 'LIFETIME' ? 'lifetime' : 'other',
          raw: p,
        }));
        if (!cancelled) {
          setPackages(pkgs);
          setAvailable(pkgs.length > 0);
        }
      } catch (e) {
        console.warn('RevenueCat init failed', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const purchase = useCallback(async (pkg: ProPackage) => {
    const Purchases = loadPurchases();
    if (!Purchases) return false;
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg.raw);
      const active = !!customerInfo?.entitlements?.active?.[ENTITLEMENT];
      setIsPro(active);
      return active;
    } catch (e: any) {
      if (!e?.userCancelled) throw e;
      return false;
    }
  }, []);

  const restore = useCallback(async () => {
    const Purchases = loadPurchases();
    if (!Purchases || !apiKey()) return false;
    const info = await Purchases.restorePurchases();
    const active = !!info?.entitlements?.active?.[ENTITLEMENT];
    setIsPro(active);
    return active;
  }, []);

  const devToggle = useCallback(() => {
    if (!__DEV__) return;
    setDevPro((v) => {
      AsyncStorage.setItem(DEV_KEY, v ? '0' : '1').catch(() => {});
      return !v;
    });
  }, []);

  const value = useMemo(
    () => ({ isPro: isPro || (__DEV__ && devPro), available, packages, purchase, restore, devToggle }),
    [isPro, devPro, available, packages, purchase, restore, devToggle],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePro(): ProState {
  const s = useContext(Ctx);
  if (!s) throw new Error('usePro must be used inside ProProvider');
  return s;
}
