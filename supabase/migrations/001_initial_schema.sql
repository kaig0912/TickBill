-- =============================================
-- TickBill Database Schema
-- Version: 001 — Initial Setup
-- PostgreSQL 15 (Supabase)
-- =============================================

-- =========================================
-- 1. USERS (extends Supabase auth.users)
-- =========================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    company_name TEXT,
    street TEXT,
    zip TEXT,
    city TEXT,
    country TEXT DEFAULT 'AT',
    phone TEXT,
    uid_number TEXT,
    tax_number TEXT,
    iban TEXT,
    bic TEXT,
    bank_name TEXT,
    logo_url TEXT,
    invoice_prefix TEXT DEFAULT 'RE',
    next_invoice_number INTEGER DEFAULT 1,
    default_tax_rate NUMERIC(5,2) DEFAULT 20.00,
    currency TEXT DEFAULT 'EUR',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================
-- 2. CLIENTS
-- =========================================
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    street TEXT,
    zip TEXT,
    city TEXT,
    country TEXT DEFAULT 'AT',
    uid_number TEXT,
    firmenbuch_number TEXT,
    notes TEXT,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================
-- 3. PROJECTS
-- =========================================
CREATE TYPE project_status AS ENUM ('active', 'paused', 'completed');

CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    hourly_rate NUMERIC(10,2) NOT NULL,
    budget_hours NUMERIC(10,2),
    status project_status DEFAULT 'active',
    color TEXT DEFAULT '#6366F1',
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================
-- 4. INVOICES (before time_entries due to FK)
-- =========================================
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id),
    invoice_number TEXT NOT NULL UNIQUE,
    status invoice_status DEFAULT 'draft',
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    seller_name TEXT NOT NULL,
    seller_address TEXT NOT NULL,
    seller_uid TEXT,
    buyer_name TEXT NOT NULL,
    buyer_address TEXT NOT NULL,
    buyer_uid TEXT,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 20.00,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_terms TEXT DEFAULT 'Zahlbar innerhalb von 14 Tagen',
    payment_info TEXT,
    notes TEXT,
    pdf_url TEXT,
    sent_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================
-- 5. TIME ENTRIES
-- =========================================
CREATE TABLE public.time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER,
    is_manual BOOLEAN DEFAULT false,
    is_billable BOOLEAN DEFAULT true,
    is_invoiced BOOLEAN DEFAULT false,
    invoice_id UUID REFERENCES public.invoices(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================
-- 6. INVOICE ITEMS
-- =========================================
CREATE TABLE public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(10,2) NOT NULL,
    unit TEXT DEFAULT 'Stunden',
    unit_price NUMERIC(10,2) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================
-- INDEXES
-- =========================================
CREATE INDEX idx_clients_user ON public.clients(user_id);
CREATE INDEX idx_projects_user ON public.projects(user_id);
CREATE INDEX idx_projects_client ON public.projects(client_id);
CREATE INDEX idx_time_entries_user ON public.time_entries(user_id);
CREATE INDEX idx_time_entries_project ON public.time_entries(project_id);
CREATE INDEX idx_time_entries_dates ON public.time_entries(start_time, end_time);
CREATE INDEX idx_invoices_user ON public.invoices(user_id);
CREATE INDEX idx_invoices_client ON public.invoices(client_id);
CREATE INDEX idx_invoices_number ON public.invoices(invoice_number);
CREATE INDEX idx_invoice_items_invoice ON public.invoice_items(invoice_id);

-- =========================================
-- ROW LEVEL SECURITY
-- =========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_data" ON public.users
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "clients_own_data" ON public.clients
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "projects_own_data" ON public.projects
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "time_entries_own_data" ON public.time_entries
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "invoices_own_data" ON public.invoices
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "invoice_items_own_data" ON public.invoice_items
    FOR ALL USING (
        auth.uid() = (
            SELECT user_id FROM public.invoices WHERE id = invoice_id
        )
    );

-- =========================================
-- TRIGGER: Auto-update updated_at
-- =========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_time_entries_updated_at BEFORE UPDATE ON public.time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
