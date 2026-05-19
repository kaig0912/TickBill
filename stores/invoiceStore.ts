/**
 * TickBill — Invoice Store (Supabase Cloud)
 * No local cache — all data lives in Supabase.
 * Rules:
 *   DRAFT  → can be deleted (hard delete, frees number)
 *   open/paid/overdue → can only be CANCELLED (sets status = 'cancelled')
 *   cancelled → read-only, visible in list with grey badge
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface InvoiceItemData {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  sort_order?: number;
}

export interface InvoiceData {
  id: string;
  user_id?: string;
  client_id: string;
  project_id: string;
  invoice_number: string;
  status: 'draft' | 'sent' | 'paid' | 'cancelled' | 'overdue';
  issue_date: string;
  due_date: string;
  service_period_start: string;
  service_period_end: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  tax_type?: 'standard' | 'reverse_charge' | 'export' | 'kleinunternehmer';
  total_amount: number;
  document_type?: 'invoice' | 'cancellation';
  parent_invoice_id?: string;
  dunning_level?: number;
  dunning_fee?: number;
  dunning_last_sent_at?: string;
  // Legacy local-only alias — keep for PDF generation compatibility
  total?: number;
  notes: string;
  items: InvoiceItemData[];
  time_entry_ids?: string[];
  created_at: string;
  is_archived?: boolean;
}

interface InvoiceStore {
  invoices: InvoiceData[];
  loadInvoices: () => Promise<void>;
  addInvoice: (data: Omit<InvoiceData, 'id' | 'created_at' | 'invoice_number' | 'user_id' | 'is_archived'>) => Promise<string | null>;
  updateInvoice: (id: string, data: Partial<InvoiceData>) => Promise<void>;
  cancelInvoice: (id: string) => Promise<void>;
  createStorno: (invoiceId: string) => Promise<string | null>;
  createDunning: (invoiceId: string, level: number, fee: number, newDueDate: string) => Promise<void>;
  archiveInvoice: (id: string) => Promise<void>;
  setStatus: (id: string, status: InvoiceData['status']) => Promise<void>;
  getInvoicesByClient: (clientId: string) => InvoiceData[];
  getInvoicesByProject: (projectId: string) => InvoiceData[];
  getTotalOpen: () => number;
  getTotalPaid: () => number;
}

export const useInvoiceStore = create<InvoiceStore>()((set, get) => ({
  invoices: [],

  loadInvoices: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('user_id', session.user.id)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (data && !error) {
      // Normalize: map total_amount → total for PDF compatibility
      const normalized = data.map((inv: any) => ({
        ...inv,
        total: inv.total_amount,
        items: inv.invoice_items || [],
      }));
      set({ invoices: normalized });
    }
  },

  addInvoice: async (data) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    // Generate invoice number by finding the highest existing number for this year
    // This is robust: it doesn't reset when invoices are deleted
    const year = new Date().getFullYear();
    const { data: existingNumbers } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', session.user.id)
      .like('invoice_number', `${year}-%`);

    // Parse the sequence numbers and find the max
    const maxSeq = (existingNumbers ?? []).reduce((max, inv) => {
      const parts = inv.invoice_number?.split('-');
      const seq = parts?.length >= 2 ? parseInt(parts[parts.length - 1], 10) : 0;
      return isNaN(seq) ? max : Math.max(max, seq);
    }, 0);

    const invoice_number = `${year}-${String(maxSeq + 1).padStart(3, '0')}`;

    const { items, time_entry_ids, total, ...invoiceFields } = data;

    const { data: inserted, error } = await supabase
      .from('invoices')
      .insert({
        ...invoiceFields,
        user_id: session.user.id,
        invoice_number,
        total_amount: data.total_amount,
      })
      .select()
      .single();

    if (error || !inserted) {
      console.error('[InvoiceStore] Error inserting invoice:', error);
      return null;
    }

    // Insert line items
    if (items && items.length > 0) {
      await supabase.from('invoice_items').insert(
        items.map((item, idx) => ({
          invoice_id: inserted.id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          amount: item.amount,
          sort_order: idx,
        }))
      );
    }

    const newInvoice: InvoiceData = {
      ...inserted,
      total: inserted.total_amount,
      items: items || [],
      time_entry_ids: time_entry_ids || [],
    };

    set((state) => ({ invoices: [newInvoice, ...state.invoices] }));
    return inserted.id;
  },

  updateInvoice: async (id, data) => {
    // Optimistic update
    set((state) => ({
      invoices: state.invoices.map((i) => (i.id === id ? { ...i, ...data, total: data.total_amount ?? i.total_amount } : i)),
    }));

    const { items, time_entry_ids, total, ...dbData } = data;
    await supabase.from('invoices').update(dbData).eq('id', id);
  },

  cancelInvoice: async (id) => {
    // Cancels a finalized invoice — does NOT free the number
    set((state) => ({
      invoices: state.invoices.map((i) => (i.id === id ? { ...i, status: 'cancelled' } : i)),
    }));
    await supabase.from('invoices').update({ status: 'cancelled' }).eq('id', id);
  },

  createStorno: async (invoiceId) => {
    const original = get().invoices.find((i) => i.id === invoiceId);
    if (!original) return null;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const year = new Date().getFullYear();
    // Get highest SR sequence number
    const { data: existingNumbers } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', session.user.id)
      .like('invoice_number', `SR-${year}-%`);

    const maxSeq = (existingNumbers ?? []).reduce((max, inv) => {
      const parts = inv.invoice_number?.split('-');
      const seq = parts?.length >= 3 ? parseInt(parts[parts.length - 1], 10) : 0;
      return isNaN(seq) ? max : Math.max(max, seq);
    }, 0);

    const invoice_number = `SR-${year}-${String(maxSeq + 1).padStart(3, '0')}`;

    // Create the storno invoice
    const { data: inserted, error } = await supabase
      .from('invoices')
      .insert({
        user_id: session.user.id,
        client_id: original.client_id,
        project_id: original.project_id,
        invoice_number,
        status: 'cancelled',
        document_type: 'cancellation',
        parent_invoice_id: original.id,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        service_period_start: original.service_period_start,
        service_period_end: original.service_period_end,
        subtotal: -original.subtotal,
        tax_rate: original.tax_rate,
        tax_amount: -original.tax_amount,
        tax_type: original.tax_type,
        total_amount: -original.total_amount,
        notes: `Stornorechnung / Gutschrift zur Rechnung #${original.invoice_number} vom ${original.issue_date}.`,
      })
      .select()
      .single();

    if (error || !inserted) {
      console.error('[InvoiceStore] Error inserting storno:', error);
      return null;
    }

    // Negate and insert line items
    if (original.items && original.items.length > 0) {
      await supabase.from('invoice_items').insert(
        original.items.map((item, idx) => ({
          invoice_id: inserted.id,
          description: `Storno: ${item.description}`,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          amount: -item.amount,
          sort_order: idx,
        }))
      );
    }

    // Set original invoice status to cancelled
    await supabase.from('invoices').update({ status: 'cancelled' }).eq('id', original.id);

    // Refresh invoices list to display both documents correctly
    await get().loadInvoices();
    return inserted.id;
  },

  createDunning: async (invoiceId, level, fee, newDueDate) => {
    const original = get().invoices.find((i) => i.id === invoiceId);
    if (!original) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    // Update dunning state in database
    await supabase
      .from('invoices')
      .update({
        dunning_level: level,
        dunning_fee: fee,
        dunning_last_sent_at: new Date().toISOString(),
        due_date: newDueDate,
        status: 'overdue' // Enforce overdue status for dunned invoices
      })
      .eq('id', invoiceId);

    // Update state locally
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              dunning_level: level,
              dunning_fee: fee,
              dunning_last_sent_at: new Date().toISOString(),
              due_date: newDueDate,
              status: 'overdue',
            }
          : inv
      ),
    }));
  },

  archiveInvoice: async (id) => {
    // Soft-deletes an invoice into the trash
    set((state) => ({
      invoices: state.invoices.filter((i) => i.id !== id),
    }));
    const archived_at = new Date().toISOString();
    await supabase.from('invoices').update({ is_archived: true, archived_at }).eq('id', id);
  },

  setStatus: async (id, status) => {
    set((state) => ({
      invoices: state.invoices.map((i) => (i.id === id ? { ...i, status } : i)),
    }));
    await supabase.from('invoices').update({ status }).eq('id', id);
  },

  getInvoicesByClient: (clientId) => {
    return get().invoices.filter((i) => i.client_id === clientId);
  },

  getInvoicesByProject: (projectId) => {
    return get().invoices.filter((i) => i.project_id === projectId);
  },

  getTotalOpen: () => {
    return get()
      .invoices
      .filter((i) => i.status === 'sent' || i.status === 'overdue')
      .reduce((sum, i) => sum + (i.total_amount ?? i.total ?? 0), 0);
  },

  getTotalPaid: () => {
    return get()
      .invoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + (i.total_amount ?? i.total ?? 0), 0);
  },
}));
