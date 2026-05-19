/**
 * TickBill — App Configuration
 */

export const APP_CONFIG = {
  name: 'TickBill',
  version: '1.0.0',
  description: 'Zeiterfassung & Rechnungsstellung für Freelancer in Österreich',

  // Default values
  defaults: {
    currency: 'EUR',
    country: 'AT',
    taxRate: 20.0,
    paymentTermDays: 14,
    invoicePrefix: 'RE',
    paymentTermsText: 'Zahlbar innerhalb von 14 Tagen',
  },

  // Invoice number format: YYYY-NNN
  invoice: {
    numberFormat: (year: number, seq: number) =>
      `${year}-${String(seq).padStart(3, '0')}`,
  },

  // Free tier limits
  freeTier: {
    maxProjects: 2,
    maxClients: 3,
    maxInvoicesPerMonth: 5,
  },

  // Supabase (will be replaced with env vars)
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  },
} as const;

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: 'Entwurf',
  sent: 'Offen',
  paid: 'Bezahlt',
  overdue: 'Überfällig',
  cancelled: 'Storniert',
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  active: 'Aktiv',
  paused: 'Pausiert',
  completed: 'Abgeschlossen',
};
