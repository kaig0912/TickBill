/**
 * TickBill — Settings Store (Zustand + localStorage)
 * Stores all freelancer profile, tax, and bank data for invoice generation
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

export interface UserProfile {
  // Company / Personal
  fullName: string;
  companyName: string;
  legalForm: string;       // e.U., GmbH, etc.
  street: string;
  zip: string;
  city: string;
  country: string;
  email: string;
  phone: string;

  // Tax
  uidNumber: string;        // ATU12345678
  taxNumber: string;        // 12-345/6789
  firmenbuchNumber: string;  // FN 123456a
  firmenbuchGericht: string; // Handelsgericht Wien
  isKleinunternehmer: boolean;

  // Bank
  iban: string;
  bic: string;
  bankName: string;

  // Invoice Defaults
  defaultTaxRate: number;
  paymentTermDays: number;
  invoicePrefix: string;
  currency: string;
  paymentTermsText: string;

  // Visuals
  logoUri: string | null;
  logoBase64: string | null;
}

export type ThemeMode = 'system' | 'light' | 'dark';

interface SettingsStore {
  profile: UserProfile;
  hasOnboarded: boolean;
  themeMode: ThemeMode;
  loadProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  setOnboarded: (val: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  isProfileComplete: () => boolean;
  getProfileWarnings: () => string[];
}

const DEFAULT_PROFILE: UserProfile = {
  fullName: '',
  companyName: '',
  legalForm: '',
  street: '',
  zip: '',
  city: '',
  country: 'Österreich',
  email: '',
  phone: '',
  uidNumber: '',
  taxNumber: '',
  firmenbuchNumber: '',
  firmenbuchGericht: '',
  isKleinunternehmer: false,
  iban: '',
  bic: '',
  bankName: '',
  defaultTaxRate: 20,
  paymentTermDays: 14,
  invoicePrefix: 'RE',
  currency: 'EUR',
  paymentTermsText: 'Zahlbar innerhalb von 14 Tagen ohne Abzug.',
  logoUri: null,
  logoBase64: null,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      profile: { ...DEFAULT_PROFILE },
      hasOnboarded: false,
      themeMode: 'system' as ThemeMode,

      loadProfile: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (data && !error) {
          set({
            profile: {
              fullName: data.full_name || '',
              companyName: data.company_name || '',
              legalForm: data.legal_form || '',
              street: data.street || '',
              zip: data.zip || '',
              city: data.city || '',
              country: data.country || 'Österreich',
              email: data.email || session.user.email || '',
              phone: data.phone || '',
              uidNumber: data.uid_number || '',
              taxNumber: data.tax_number || '',
              firmenbuchNumber: data.firmenbuch_number || '',
              firmenbuchGericht: data.firmenbuch_gericht || '',
              isKleinunternehmer: data.is_kleinunternehmer || false,
              iban: data.iban || '',
              bic: data.bic || '',
              bankName: data.bank_name || '',
              defaultTaxRate: data.default_tax_rate ?? 20,
              paymentTermDays: data.payment_term_days ?? 14,
              invoicePrefix: data.invoice_prefix || 'RE',
              currency: data.currency || 'EUR',
              paymentTermsText: data.payment_terms_text || 'Zahlbar innerhalb von 14 Tagen ohne Abzug.',
              logoUri: data.logo_cloud_url || null,
              logoBase64: null,
            }
          });
        }
      },

      updateProfile: async (data) => {
        // Cloud Sync — build merged profile first, then save + update state
        const { data: { session } } = await supabase.auth.getSession();
        
        // Merge incoming data with current profile for DB write
        const p = { ...get().profile, ...data };

        // Optimistic UI update
        set({ profile: p });

        if (!session?.user) return;

        const dbData = {
          full_name: p.fullName,
          company_name: p.companyName,
          legal_form: p.legalForm,
          street: p.street,
          zip: p.zip,
          city: p.city,
          country: p.country,
          email: p.email,
          phone: p.phone,
          uid_number: p.uidNumber,
          tax_number: p.taxNumber,
          firmenbuch_number: p.firmenbuchNumber,
          firmenbuch_gericht: p.firmenbuchGericht,
          is_kleinunternehmer: p.isKleinunternehmer,
          iban: p.iban,
          bic: p.bic,
          bank_name: p.bankName,
          default_tax_rate: p.defaultTaxRate,
          payment_term_days: p.paymentTermDays,
          invoice_prefix: p.invoicePrefix,
          currency: p.currency,
          payment_terms_text: p.paymentTermsText,
          logo_cloud_url: p.logoUri,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('profiles').update(dbData).eq('id', session.user.id);
        if (error) console.error('[SettingsStore] Supabase update failed:', error.message);
      },

      setOnboarded: (val) => {
        set({ hasOnboarded: val });
      },

      setThemeMode: (mode) => {
        set({ themeMode: mode });
      },

      isProfileComplete: () => {
        const p = get().profile;
        return !!(
          p.fullName &&
          p.street &&
          p.zip &&
          p.city &&
          (p.uidNumber || p.isKleinunternehmer) &&
          p.iban
        );
      },

      getProfileWarnings: () => {
        const p = get().profile;
        const warnings: string[] = [];
        if (!p.fullName) warnings.push('Name/Firma fehlt');
        if (!p.street || !p.zip || !p.city) warnings.push('Adresse unvollständig');
        if (!p.uidNumber && !p.isKleinunternehmer) warnings.push('UID-Nummer fehlt');
        if (!p.iban) warnings.push('Bankverbindung fehlt');
        return warnings;
      },
    }),
    {
      name: 'tickbill-settings',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ themeMode: state.themeMode }), // ONLY cache themeMode, not business data!
    }
  )
);
