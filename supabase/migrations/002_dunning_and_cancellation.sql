-- Migration 002: Add Dunning and Cancellation Invoices support
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS document_type VARCHAR(50) DEFAULT 'invoice';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS parent_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS dunning_level INT DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS dunning_fee NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS dunning_last_sent_at TIMESTAMP WITH TIME ZONE;

-- Add index on parent_invoice_id
CREATE INDEX IF NOT EXISTS idx_invoices_parent_id ON invoices(parent_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_doc_type ON invoices(document_type);
