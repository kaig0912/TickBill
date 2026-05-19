/**
 * TickBill — Client Store (Zustand + localStorage)
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface ClientData {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  uid_number: string;
  firmenbuch_number: string;
  notes: string;
  created_at: string;
  user_id?: string;
  is_archived?: boolean;
  archived_at?: string;
}

interface ClientStore {
  clients: ClientData[];
  loadClients: () => Promise<void>;
  addClient: (c: Omit<ClientData, 'id' | 'created_at' | 'user_id' | 'is_archived' | 'archived_at'>) => Promise<string | null>;
  updateClient: (id: string, data: Partial<ClientData>) => Promise<void>;
  archiveClient: (id: string) => Promise<void>;
  restoreClient: (id: string) => Promise<void>;
  getClient: (id: string) => ClientData | undefined;
}

export const useClientStore = create<ClientStore>()((set, get) => ({
  clients: [],

  loadClients: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    // Also fire a cleanup RPC asynchronously
    supabase.rpc('cleanup_trash').then();

    if (data && !error) {
      set({ clients: data });
    }
  },

  addClient: async (data) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    // Only send fields that exist in the DB table
    const dbData = {
      user_id: session.user.id,
      company_name: data.company_name,
      contact_person: data.contact_person || '',
      email: data.email || '',
      phone: data.phone || '',
      street: data.street || '',
      zip: data.zip || '',
      city: data.city || '',
      country: data.country || 'Österreich',
      uid_number: data.uid_number || '',
      notes: data.notes || '',
    };

    const { data: inserted, error } = await supabase
      .from('clients')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('[ClientStore] addClient failed:', error.message);
      return null;
    }

    if (inserted) {
      set((state) => ({ clients: [inserted, ...state.clients] }));
      return inserted.id;
    }
    return null;
  },

  updateClient: async (id, data) => {
    // Optimistic UI update
    set((state) => ({
      clients: state.clients.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));

    await supabase.from('clients').update(data).eq('id', id);
  },

  archiveClient: async (id) => {
    // Optimistic UI update
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id),
    }));

    const archived_at = new Date().toISOString();
    await supabase.from('clients').update({ is_archived: true, archived_at }).eq('id', id);
    // Cascade archive projects
    await supabase.from('projects').update({ is_archived: true, archived_at }).eq('client_id', id);
  },

  restoreClient: async (id) => {
    await supabase.from('clients').update({ is_archived: false, archived_at: null }).eq('id', id);
    get().loadClients();
  },

  getClient: (id) => {
    return get().clients.find((c) => c.id === id);
  },
}));
