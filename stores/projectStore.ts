/**
 * TickBill — Project Store (Zustand + localStorage)
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { getProjectColor } from '@/lib/utils';

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  client_id: string;
  hourly_rate: number;
  base_fee: number;
  status: 'active' | 'paused' | 'completed';
  color: string;
  created_at: string;
  user_id?: string;
  is_archived?: boolean;
  archived_at?: string;
}

interface ProjectStore {
  projects: ProjectData[];
  loadProjects: () => Promise<void>;
  addProject: (p: Omit<ProjectData, 'id' | 'created_at' | 'color' | 'user_id' | 'is_archived' | 'archived_at'>) => Promise<string | null>;
  updateProject: (id: string, data: Partial<ProjectData>) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  restoreProject: (id: string) => Promise<void>;
  getProject: (id: string) => ProjectData | undefined;
  getActiveProjects: () => ProjectData[];
  getProjectsByClient: (clientId: string) => ProjectData[];
}

export const useProjectStore = create<ProjectStore>()((set, get) => ({
  projects: [],

  loadProjects: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (data && !error) {
      set({ projects: data });
    }
  },

  addProject: async (data) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const color = getProjectColor(get().projects.length);

    const { data: inserted, error } = await supabase
      .from('projects')
      .insert({ ...data, user_id: session.user.id, color })
      .select()
      .single();

    if (inserted && !error) {
      set((state) => ({ projects: [inserted, ...state.projects] }));
      return inserted.id;
    }
    return null;
  },

  updateProject: async (id, data) => {
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
    }));
    await supabase.from('projects').update(data).eq('id', id);
  },

  archiveProject: async (id) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    }));
    const archived_at = new Date().toISOString();
    await supabase.from('projects').update({ is_archived: true, archived_at }).eq('id', id);
  },

  restoreProject: async (id) => {
    await supabase.from('projects').update({ is_archived: false, archived_at: null }).eq('id', id);
    get().loadProjects();
  },

  getProject: (id) => {
    return get().projects.find((p) => p.id === id);
  },

  getActiveProjects: () => {
    return get().projects.filter((p) => p.status === 'active');
  },

  getProjectsByClient: (clientId) => {
    return get().projects.filter((p) => p.client_id === clientId);
  },
}));
