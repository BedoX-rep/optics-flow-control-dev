
-- Add purchase_type column to purchases table
ALTER TABLE purchases 
ADD COLUMN purchase_type TEXT DEFAULT 'Operational Expenses' 
CHECK (purchase_type IN ('Operational Expenses', 'Capital Expenditure'));

-- Create purchase_balance_history table to track balance changes
CREATE TABLE IF NOT EXISTS purchase_balance_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  old_balance DECIMAL(10,2) NOT NULL,
  new_balance DECIMAL(10,2) NOT NULL,
  change_amount DECIMAL(10,2) NOT NULL,
  change_reason TEXT,
  change_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS for purchase_balance_history
ALTER TABLE purchase_balance_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for purchase_balance_history
CREATE POLICY "Users can view their own balance history" ON purchase_balance_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own balance history" ON purchase_balance_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_balance_history_purchase_id ON purchase_balance_history(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_balance_history_user_id ON purchase_balance_history(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_balance_history_change_date ON purchase_balance_history(change_date);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_type ON purchases(purchase_type);

-- Create function to automatically track balance changes
CREATE OR REPLACE FUNCTION track_balance_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if balance actually changed
  IF OLD.balance IS DISTINCT FROM NEW.balance THEN
    INSERT INTO purchase_balance_history (
      purchase_id,
      old_balance,
      new_balance,
      change_amount,
      change_reason,
      user_id
    ) VALUES (
      NEW.id,
      COALESCE(OLD.balance, 0),
      COALESCE(NEW.balance, 0),
      COALESCE(NEW.balance, 0) - COALESCE(OLD.balance, 0),
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'Initial purchase created'
        WHEN OLD.advance_payment IS DISTINCT FROM NEW.advance_payment THEN 'Advance payment updated'
        WHEN OLD.amount_ttc IS DISTINCT FROM NEW.amount_ttc THEN 'Purchase amount updated'
        ELSE 'Balance manually adjusted'
      END,
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically track balance changes
DROP TRIGGER IF EXISTS trigger_track_balance_changes ON purchases;
CREATE TRIGGER trigger_track_balance_changes
  AFTER INSERT OR UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION track_balance_changes();
