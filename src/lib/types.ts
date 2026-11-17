export type DocType = 'invoice' | 'quote';

export type InvoiceStatus = 'draft' | 'sent' | 'paid';
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined';
export type DocStatus = InvoiceStatus | QuoteStatus;

export interface Business {
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  taxId: string;
  /** Base64 data URI of the logo, so it can be embedded in PDFs. */
  logo: string | null;
  currency: string;
  defaultTaxRate: number;
  taxLabel: string;
  paymentInstructions: string;
  defaultNotes: string;
  defaultDueDays: number;
  invoicePrefix: string;
  quotePrefix: string;
  nextInvoiceNumber: number;
  nextQuoteNumber: number;
  accentColor: string;
  trade: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: number;
}

export interface SavedItem {
  id: string;
  name: string;
  description: string;
  rate: number;
  unit: string;
}

export interface LineItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  rate: number;
  unit: string;
}

export interface Doc {
  id: string;
  type: DocType;
  number: string;
  status: DocStatus;
  clientId: string | null;
  /** Snapshot of client at time of edit, so old invoices don't change if a client is edited/deleted. */
  clientSnapshot: Omit<Client, 'id' | 'createdAt' | 'notes'> | null;
  issueDate: string; // YYYY-MM-DD
  dueDate: string | null; // invoices: due date, quotes: valid-until
  items: LineItem[];
  discountType: 'percent' | 'amount';
  discountValue: number;
  taxRate: number;
  notes: string;
  paidAt: number | null;
  /** If this invoice was made from a quote, the quote's id. */
  sourceQuoteId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface AppData {
  version: 1;
  onboarded: boolean;
  business: Business;
  clients: Client[];
  items: SavedItem[];
  docs: Doc[];
  /** Free-tier usage counter keyed by YYYY-MM. */
  usage: Record<string, number>;
}
