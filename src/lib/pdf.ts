import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { lineTotal, totals } from './calc';
import { money, prettyDate } from './format';
import type { Business, Doc } from './types';

function esc(s: string | null | undefined): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br/>');
}

export function docTitle(doc: Doc) {
  return doc.type === 'invoice' ? 'Invoice' : 'Quote';
}

export function buildHtml(doc: Doc, b: Business, opts: { watermark: boolean }): string {
  const t = totals(doc);
  const c = doc.clientSnapshot;
  const accent = b.accentColor || '#2563EB';
  const cur = b.currency;
  const isInvoice = doc.type === 'invoice';
  const paid = isInvoice && doc.status === 'paid';

  const rows = doc.items
    .map(
      (i) => `
      <tr>
        <td>
          <div class="item">${esc(i.name)}</div>
          ${i.description ? `<div class="desc">${esc(i.description)}</div>` : ''}
        </td>
        <td class="num">${i.quantity}${i.unit && i.unit !== 'each' ? ` <span class="unit">${esc(i.unit)}</span>` : ''}</td>
        <td class="num">${money(i.rate, cur)}</td>
        <td class="num strong">${money(lineTotal(i), cur)}</td>
      </tr>`,
    )
    .join('');

  const businessLines = [b.ownerName && b.ownerName !== b.name ? b.ownerName : '', b.address, b.phone, b.email, b.website, b.taxId ? `Tax ID: ${b.taxId}` : '']
    .filter(Boolean)
    .map(esc)
    .join('<br/>');

  const clientLines = c ? [c.address, c.phone, c.email].filter(Boolean).map(esc).join('<br/>') : '';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  @page { margin: 36px; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Helvetica Neue', Roboto, Arial, sans-serif; color: #0f172a; font-size: 12px; margin: 0; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
  .logo { max-width: 160px; max-height: 80px; object-fit: contain; margin-bottom: 10px; }
  .bizname { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
  .muted { color: #64748b; line-height: 1.5; }
  .title { text-align: right; }
  .title h1 { margin: 0; font-size: 30px; letter-spacing: 1px; color: ${accent}; text-transform: uppercase; }
  .meta { margin-top: 8px; border-collapse: collapse; margin-left: auto; }
  .meta td { padding: 2px 0 2px 16px; text-align: right; }
  .meta td:first-child { color: #64748b; }
  .bar { height: 4px; background: ${accent}; border-radius: 2px; margin: 22px 0; }
  .label { font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin-bottom: 4px; }
  .billto { display: flex; justify-content: space-between; margin-bottom: 20px; }
  .clientname { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
  .amountdue { text-align: right; }
  .amountdue .big { font-size: 22px; font-weight: 800; color: ${accent}; }
  table.items { width: 100%; border-collapse: collapse; }
  table.items th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .8px; color: #fff; background: ${accent}; padding: 9px 10px; }
  table.items th.num { text-align: right; }
  table.items td { padding: 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  table.items tr:nth-child(even) td { background: #f8fafc; }
  .num { text-align: right; white-space: nowrap; }
  .strong { font-weight: 700; }
  .item { font-weight: 600; }
  .desc { color: #64748b; margin-top: 2px; }
  .unit { color: #94a3b8; font-size: 10px; }
  .summary { display: flex; justify-content: flex-end; margin-top: 14px; }
  .summary table { border-collapse: collapse; min-width: 240px; }
  .summary td { padding: 5px 10px; }
  .summary td:last-child { text-align: right; }
  .summary .total td { font-size: 15px; font-weight: 800; border-top: 2px solid ${accent}; padding-top: 9px; }
  .notes { margin-top: 28px; display: flex; gap: 24px; }
  .notes > div { flex: 1; }
  .paid { position: fixed; top: 38%; left: 18%; transform: rotate(-18deg); font-size: 90px; font-weight: 900; color: rgba(5,150,105,.14); border: 8px solid rgba(5,150,105,.14); padding: 0 30px; border-radius: 18px; }
  .footer { margin-top: 36px; text-align: center; color: #94a3b8; font-size: 10px; }
</style></head>
<body>
  ${paid ? '<div class="paid">PAID</div>' : ''}
  <div class="top">
    <div>
      ${b.logo ? `<img class="logo" src="${b.logo}"/>` : ''}
      <div class="bizname">${esc(b.name || 'Your Business')}</div>
      <div class="muted">${businessLines}</div>
    </div>
    <div class="title">
      <h1>${docTitle(doc)}</h1>
      <table class="meta">
        <tr><td>${isInvoice ? 'Invoice' : 'Quote'} #</td><td><b>${esc(doc.number)}</b></td></tr>
        <tr><td>Date</td><td>${prettyDate(doc.issueDate)}</td></tr>
        ${doc.dueDate ? `<tr><td>${isInvoice ? 'Due' : 'Valid until'}</td><td>${prettyDate(doc.dueDate)}</td></tr>` : ''}
      </table>
    </div>
  </div>
  <div class="bar"></div>
  <div class="billto">
    <div>
      <div class="label">${isInvoice ? 'Bill to' : 'Prepared for'}</div>
      ${c ? `<div class="clientname">${esc(c.name)}</div><div class="muted">${clientLines}</div>` : '<div class="muted">—</div>'}
    </div>
    <div class="amountdue">
      <div class="label">${paid ? 'Amount paid' : isInvoice ? 'Amount due' : 'Quote total'}</div>
      <div class="big">${money(t.total, cur)}</div>
    </div>
  </div>
  <table class="items">
    <thead><tr><th>Description</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="4" class="muted">No items</td></tr>'}</tbody>
  </table>
  <div class="summary"><table>
    <tr><td class="muted">Subtotal</td><td>${money(t.subtotal, cur)}</td></tr>
    ${t.discount > 0 ? `<tr><td class="muted">Discount${doc.discountType === 'percent' ? ` (${doc.discountValue}%)` : ''}</td><td>−${money(t.discount, cur)}</td></tr>` : ''}
    ${doc.taxRate > 0 ? `<tr><td class="muted">${esc(b.taxLabel || 'Tax')} (${doc.taxRate}%)</td><td>${money(t.tax, cur)}</td></tr>` : ''}
    <tr class="total"><td>Total</td><td>${money(t.total, cur)}</td></tr>
  </table></div>
  <div class="notes">
    ${isInvoice && b.paymentInstructions ? `<div><div class="label">Payment details</div><div class="muted">${esc(b.paymentInstructions)}</div></div>` : ''}
    ${doc.notes ? `<div><div class="label">Notes</div><div class="muted">${esc(doc.notes)}</div></div>` : ''}
  </div>
  ${opts.watermark ? '<div class="footer">Created with Quotsy · Free invoice &amp; quote maker app</div>' : ''}
</body></html>`;
}

export async function sharePdf(doc: Doc, b: Business, watermark: boolean) {
  const html = buildHtml(doc, b, { watermark });
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  // Give the file a friendly name, e.g. "Invoice INV-0001.pdf"
  let shareUri = uri;
  try {
    const { File, Paths } = await import('expo-file-system');
    const safe = `${docTitle(doc)} ${doc.number}`.replace(/[^\w\- ]/g, '');
    const target = new File(Paths.cache, `${safe}.pdf`);
    if (target.exists) target.delete();
    new File(uri).copy(target);
    shareUri = target.uri;
  } catch {
    // fall back to the generated name
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(shareUri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: `Share ${docTitle(doc)} ${doc.number}`,
    });
  } else {
    await Print.printAsync({ uri });
  }
}

export async function printDoc(doc: Doc, b: Business, watermark: boolean) {
  await Print.printAsync({ html: buildHtml(doc, b, { watermark }) });
}
