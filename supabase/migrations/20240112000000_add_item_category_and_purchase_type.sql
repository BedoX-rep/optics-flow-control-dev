
-- Add item_category column to invoice_items table
ALTER TABLE invoice_items 
ADD COLUMN item_category TEXT DEFAULT 'Single Vision Lenses';

-- Add purchase_type column to invoices table  
ALTER TABLE invoices
ADD COLUMN purchase_type TEXT;

-- Update existing invoice_items to have default category
UPDATE invoice_items 
SET item_category = 'Single Vision Lenses' 
WHERE item_category IS NULL;

-- Update existing invoices to calculate purchase_type from their items
UPDATE invoices 
SET purchase_type = (
  SELECT string_agg(DISTINCT item_category, ' + ' ORDER BY item_category)
  FROM invoice_items 
  WHERE invoice_items.invoice_id = invoices.id
  GROUP BY invoice_id
)
WHERE purchase_type IS NULL;
