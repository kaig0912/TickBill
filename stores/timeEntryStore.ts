/**
 * TickBill — Time Entry Store (Supabase Cloud)
 * No local cache — all data lives in Supabase.
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface TimeEntryData {
  id: string;
  user_id?: string;
  project_id: string;
  description: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  is_manual: boolean;
  is_billable: boolean;
  is_invoiced: boolean;
  invoice_id: string | null;
  created_at: string;
  is_archived?: boolean;
  archived_at?: string;
}

interface TimeEntryStore {
  entries: TimeEntryData[];
  loadEntries: () => Promise<void>;
  addEntry: (e: Omit<TimeEntryData, 'id' | 'created_at' | 'user_id' | 'is_archived' | 'archived_at'>) => Promise<string | null>;
  updateEntry: (id: string, data: Partial<TimeEntryData>) => Promise<void>;
  archiveEntry: (id: string) => Promise<void>;
  restoreEntry: (id: string) => Promise<void>;
  hardDeleteEntry: (id: string) => Promise<void>;
  getEntriesByProject: (projectId: string) => TimeEntryData[];
  getEntriesToday: () => TimeEntryData[];
  getEntriesThisWeek: () => TimeEntryData[];
  getRecentEntries: (limit: number) => TimeEntryData[];
  getTotalSecondsByProject: (projectId: string) => number;
  getUninvoicedByProject: (projectId: string) => TimeEntryData[];
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday start
  r.setDate(r.getDate() - diff);
  r.setHours(0, 0, 0, 0);
  return r;
}

export const useTimeEntryStore = create<TimeEntryStore>()((set, get) => ({
  entries: [],

  loadEntries: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_archived', false)
      .order('start_time', { ascending: false });

    if (data && !error) {
      set({ entries: data });
    }
  },

  addEntry: async (data) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: inserted, error } = await supabase
      .from('time_entries')
      .insert({
        ...data,
        user_id: session.user.id,
        description: data.description || '',
      })
      .select()
      .single();

    if (inserted && !error) {
      set((state) => ({ entries: [inserted, ...state.entries] }));
      return inserted.id;
    }
    if (error) console.error('[TimeEntryStore] addEntry failed:', error.message);
    return null;
  },

  updateEntry: async (id, data) => {
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? { ...e, ...data } : e)),
    }));
    await supabase.from('time_entries').update(data).eq('id', id);
  },

  archiveEntry: async (id) => {
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    }));
    const archived_at = new Date().toISOString();
    await supabase.from('time_entries').update({ is_archived: true, archived_at }).eq('id', id);
  },

  restoreEntry: async (id) => {
    await supabase.from('time_entries').update({ is_archived: false, archived_at: null }).eq('id', id);
    get().loadEntries();
  },

  hardDeleteEntry: async (id) => {
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    }));
    await supabase.from('time_entries').delete().eq('id', id);
  },

  getEntriesByProject: (projectId) => {
    return get().entries.filter((e) => e.project_id === projectId);
  },

  getEntriesToday: () => {
    const today = startOfDay(new Date()).getTime();
    return get().entries.filter(
      (e) => new Date(e.start_time).getTime() >= today
    );
  },

  getEntriesThisWeek: () => {
    const weekStart = startOfWeek(new Date()).getTime();
    return get().entries.filter(
      (e) => new Date(e.start_time).getTime() >= weekStart
    );
  },

  getRecentEntries: (limit) => {
    return get()
      .entries
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
      .slice(0, limit);
  },

  getTotalSecondsByProject: (projectId) => {
    return get()
      .entries
      .filter((e) => e.project_id === projectId)
      .reduce((sum, e) => sum + e.duration_seconds, 0);
  },

  getUninvoicedByProject: (projectId) => {
    return get().entries.filter(
      (e) => e.project_id === projectId && !e.is_invoiced && e.is_billable
    );
  },
}));
