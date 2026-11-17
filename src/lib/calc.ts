import { todayISO, daysBetween } from './format';
import type { Doc, LineItem } from './types';

const round2 = (n: number) => Math.round(n * 100) / 100;

export function lineTotal(item: LineItem): number {
  return round2((item.quantity || 0) * (item.rate || 0));
}

export interface Totals {
  subtotal: number;
  discount: number;
  taxable: number;
  tax: number;
  total: number;
}

export function totals(doc: Pick<Doc, 'items' | 'discountType' | 'discountValue' | 'taxRate'>): Totals {
  const subtotal = round2(doc.items.reduce((sum, i) => sum + lineTotal(i), 0));
  let discount =
    doc.discountType === 'percent'
      ? round2((subtotal * (doc.discountValue || 0)) / 100)
      : round2(doc.discountValue || 0);
  discount = Math.min(Math.max(discount, 0), subtotal);
  const taxable = round2(subtotal - discount);
  const tax = round2((taxable * (doc.taxRate || 0)) / 100);
  return { subtotal, discount, taxable, tax, total: round2(taxable + tax) };
}

export type DisplayStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'accepted' | 'declined' | 'expired';

export function displayStatus(doc: Doc): DisplayStatus {
  if (doc.type === 'invoice') {
    if (doc.status === 'paid') return 'paid';
    if (doc.status === 'sent' && doc.dueDate && doc.dueDate < todayISO()) return 'overdue';
    return doc.status as DisplayStatus;
  }
  if (doc.status === 'accepted' || doc.status === 'declined') return doc.status;
  if (doc.dueDate && doc.dueDate < todayISO()) return 'expired';
  return doc.status as DisplayStatus;
}

export function overdueDays(doc: Doc): number {
  if (!doc.dueDate) return 0;
  return Math.max(0, daysBetween(doc.dueDate, todayISO()));
}
