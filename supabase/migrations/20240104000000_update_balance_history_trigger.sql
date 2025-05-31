
-- Update the track_balance_changes function to better handle recurring purchases
CREATE OR REPLACE FUNCTION track_balance_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if balance actually changed
  IF (OLD.balance IS DISTINCT FROM NEW.balance) THEN
    DECLARE
      change_reason TEXT;
    BEGIN
      -- Check if this is a recurring purchase renewal by looking at multiple indicators
      IF (NEW.recurring_type IS NOT NULL 
          AND (OLD.next_recurring_date IS DISTINCT FROM NEW.next_recurring_date)
          AND (OLD.purchase_date IS DISTINCT FROM NEW.purchase_date)
          AND (NEW.balance - COALESCE(OLD.balance, 0)) > 0) THEN
        -- This is definitely a recurring purchase renewal
        IF COALESCE(OLD.balance, 0) = 0 THEN
          change_reason := 'Recurring purchase renewed - new cycle started';
        ELSE
          change_reason := 'Recurring purchase renewed - balance accumulated with new amount';
        END IF;
      ELSIF (TG_OP = 'INSERT') THEN
        -- This is a new purchase being created
        change_reason := 'Initial purchase created';
      ELSIF (OLD.advance_payment IS DISTINCT FROM NEW.advance_payment) THEN
        -- Advance payment was updated
        change_reason := 'Advance payment updated';
      ELSIF (OLD.amount_ttc IS DISTINCT FROM NEW.amount_ttc OR OLD.amount_ht IS DISTINCT FROM NEW.amount_ht) THEN
        -- Purchase amount was updated
        change_reason := 'Purchase amount updated';
      ELSE
        -- Fallback for other balance changes
        change_reason := 'Balance manually adjusted';
      END IF;

      INSERT INTO purchase_balance_history (
        purchase_id,
        user_id,
        old_balance,
        new_balance,
        change_amount,
        change_reason,
        change_date
      ) VALUES (
        NEW.id,
        NEW.user_id,
        COALESCE(OLD.balance, 0),
        NEW.balance,
        NEW.balance - COALESCE(OLD.balance, 0),
        change_reason,
        NOW()
      );
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
