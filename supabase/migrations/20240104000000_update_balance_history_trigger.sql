
-- Update the track_balance_changes function to better handle recurring purchases
CREATE OR REPLACE FUNCTION track_balance_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if balance actually changed
  IF (OLD.balance IS DISTINCT FROM NEW.balance) THEN
    -- Determine if this is a recurring purchase renewal
    -- (when next_recurring_date is updated and balance increases significantly)
    DECLARE
      change_reason TEXT;
    BEGIN
      IF (OLD.next_recurring_date IS DISTINCT FROM NEW.next_recurring_date) 
         AND NEW.recurring_type IS NOT NULL 
         AND (NEW.balance - COALESCE(OLD.balance, 0)) > 0 THEN
        -- This is a recurring purchase renewal
        IF COALESCE(OLD.balance, 0) = 0 THEN
          change_reason := 'Recurring purchase renewed - new cycle started';
        ELSE
          change_reason := 'Recurring purchase renewed - balance accumulated with new amount';
        END IF;
      ELSE
        -- Regular balance update
        change_reason := 'Purchase amount updated';
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
