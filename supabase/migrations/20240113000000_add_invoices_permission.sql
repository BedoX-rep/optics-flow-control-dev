
-- Add can_manage_invoices column to permissions table
ALTER TABLE permissions 
ADD COLUMN can_manage_invoices BOOLEAN DEFAULT TRUE;

-- Update existing users to have invoice management permissions by default
UPDATE permissions 
SET can_manage_invoices = TRUE 
WHERE can_manage_invoices IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE permissions 
ALTER COLUMN can_manage_invoices SET NOT NULL;
