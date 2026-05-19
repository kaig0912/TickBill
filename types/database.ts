/**
 * TickBill — Database Types
 * TypeScript types matching the PostgreSQL schema
 * Will be auto-generated from Supabase once connected
 */

// ─── Enums ──────────────────────────────────────────
export type ProjectStatus = 'active' | 'paused' | 'completed';
export type InvoiceStatus = 'draft' | 'open' | 'sent' | 'paid' | 'overdue' | 'cancelled';

// ─── Users ──────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  full_name: string;
  company_name: string | null;
  street: string | null;
  zip: string | null;
  city: string | null;
  country: string;
  phone: string | null;
  uid_number: string | null;
  tax_number: string | null;
  iban: string | null;
  bic: string | null;
  bank_name: string | null;
  logo_url: string | null;
  invoice_prefix: string;
  next_invoice_number: number;
  default_tax_rate: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

// ─── Clients ────────────────────────────────────────
export interface Client {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  street: string | null;
  zip: string | null;
  city: string | null;
  country: string;
  uid_number: string | null;
  firmenbuch_number: string | null;
  notes: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Projects ───────────────────────────────────────
export interface Project {
  id: string;
  user_id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  hourly_rate: number;
  budget_hours: number | null;
  status: ProjectStatus;
  color: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  client?: Client;
}

// ─── Time Entries ───────────────────────────────────
export interface TimeEntry {
  id: string;
  user_id: string;
  project_id: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  is_manual: boolean;
  is_billable: boolean;
  is_invoiced: boolean;
  invoice_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  project?: Project;
}

// ─── Invoices ───────────────────────────────────────
export interface Invoice {
  id: string;
  user_id: string;
  client_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  seller_name: string;
  seller_address: string;
  seller_uid: string | null;
  buyer_name: string;
  buyer_address: string;
  buyer_uid: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  payment_terms: string;
  payment_info: string | null;
  notes: string | null;
  pdf_url: string | null;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  client?: Client;
  items?: InvoiceItem[];
}

// ─── Invoice Items ──────────────────────────────────
export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  sort_order: number;
  created_at: string;
}

// ─── Supabase Database Type ─────────────────────────
// Simplified version — full version will be generated
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Partial<User> & { id: string; email: string; full_name: string };
        Update: Partial<User>;
      };
      clients: {
        Row: Client;
        Insert: Partial<Client> & { user_id: string; company_name: string };
        Update: Partial<Client>;
      };
      projects: {
        Row: Project;
        Insert: Partial<Project> & { user_id: string; name: string; hourly_rate: number };
        Update: Partial<Project>;
      };
      time_entries: {
        Row: TimeEntry;
        Insert: Partial<TimeEntry> & { user_id: string; project_id: string; start_time: string };
        Update: Partial<TimeEntry>;
      };
      invoices: {
        Row: Invoice;
        Insert: Partial<Invoice> & {
          user_id: string;
          client_id: string;
          invoice_number: string;
          seller_name: string;
          seller_address: string;
          buyer_name: string;
          buyer_address: string;
        };
        Update: Partial<Invoice>;
      };
      invoice_items: {
        Row: InvoiceItem;
        Insert: Partial<InvoiceItem> & {
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
        };
        Update: Partial<InvoiceItem>;
      };
    };
    Enums: {
      project_status: ProjectStatus;
      invoice_status: InvoiceStatus;
    };
  };
}
