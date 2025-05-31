
-- Function to automatically link new receipts to purchases with matching date ranges
CREATE OR REPLACE FUNCTION link_new_receipts_to_purchases()
RETURNS TRIGGER AS $$
DECLARE
    purchase_record RECORD;
    montage_data RECORD;
    linked_receipt_ids TEXT[];
    total_montage DECIMAL := 0;
    paid_montage DECIMAL := 0;
    unpaid_montage DECIMAL := 0;
    receipt_count INTEGER := 0;
BEGIN
    -- Only process if the receipt has montage costs
    IF NEW.montage_costs IS NULL OR NEW.montage_costs = 0 THEN
        RETURN NEW;
    END IF;

    -- Find all purchases that have date ranges covering this new receipt
    FOR purchase_record IN 
        SELECT id, link_date_from, link_date_to, user_id
        FROM purchases 
        WHERE user_id = NEW.user_id
        AND link_date_from IS NOT NULL 
        AND link_date_to IS NOT NULL
        AND DATE(NEW.created_at) >= link_date_from 
        AND DATE(NEW.created_at) <= link_date_to
        AND is_deleted = FALSE
    LOOP
        -- Get all receipts in the date range for this purchase
        SELECT 
            COALESCE(SUM(CASE WHEN r.montage_costs IS NOT NULL THEN r.montage_costs ELSE 0 END), 0) as total_montage_costs,
            COALESCE(SUM(CASE WHEN r.montage_status = 'Paid costs' AND r.montage_costs IS NOT NULL THEN r.montage_costs ELSE 0 END), 0) as paid_montage_costs,
            COUNT(*) as receipt_count,
            ARRAY_AGG(r.id) as receipt_ids
        INTO montage_data
        FROM receipts r
        WHERE r.user_id = purchase_record.user_id
        AND DATE(r.created_at) >= purchase_record.link_date_from
        AND DATE(r.created_at) <= purchase_record.link_date_to
        AND r.is_deleted = FALSE
        AND r.montage_costs IS NOT NULL
        AND r.montage_costs > 0;

        -- Calculate values
        total_montage := COALESCE(montage_data.total_montage_costs, 0);
        paid_montage := COALESCE(montage_data.paid_montage_costs, 0);
        unpaid_montage := total_montage - paid_montage;
        receipt_count := COALESCE(montage_data.receipt_count, 0);
        linked_receipt_ids := COALESCE(montage_data.receipt_ids, ARRAY[]::TEXT[]);

        -- Update the purchase record with new totals
        UPDATE purchases 
        SET 
            linked_receipts = linked_receipt_ids,
            amount_ttc = total_montage,
            amount_ht = total_montage / 1.2,
            amount = total_montage,
            advance_payment = paid_montage,
            balance = unpaid_montage,
            payment_status = CASE 
                WHEN unpaid_montage = 0 THEN 'Paid'
                WHEN paid_montage > 0 THEN 'Partially Paid'
                ELSE 'Unpaid'
            END,
            updated_at = NOW()
        WHERE id = purchase_record.id;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically link new receipts
DROP TRIGGER IF EXISTS trigger_link_new_receipts ON receipts;
CREATE TRIGGER trigger_link_new_receipts
    AFTER INSERT OR UPDATE ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION link_new_receipts_to_purchases();

-- Also create a trigger for when montage_status changes (paid/unpaid)
CREATE OR REPLACE FUNCTION update_purchase_on_montage_status_change()
RETURNS TRIGGER AS $$
DECLARE
    purchase_record RECORD;
    montage_data RECORD;
    total_montage DECIMAL := 0;
    paid_montage DECIMAL := 0;
    unpaid_montage DECIMAL := 0;
BEGIN
    -- Only process if montage_status or montage_costs changed
    IF (OLD.montage_status IS NOT DISTINCT FROM NEW.montage_status) AND 
       (OLD.montage_costs IS NOT DISTINCT FROM NEW.montage_costs) THEN
        RETURN NEW;
    END IF;

    -- Find purchases that include this receipt in their date range
    FOR purchase_record IN 
        SELECT id, link_date_from, link_date_to, user_id
        FROM purchases 
        WHERE user_id = NEW.user_id
        AND link_date_from IS NOT NULL 
        AND link_date_to IS NOT NULL
        AND DATE(NEW.created_at) >= link_date_from 
        AND DATE(NEW.created_at) <= link_date_to
        AND is_deleted = FALSE
        AND NEW.id = ANY(linked_receipts)
    LOOP
        -- Recalculate totals for this purchase
        SELECT 
            COALESCE(SUM(CASE WHEN r.montage_costs IS NOT NULL THEN r.montage_costs ELSE 0 END), 0) as total_montage_costs,
            COALESCE(SUM(CASE WHEN r.montage_status = 'Paid costs' AND r.montage_costs IS NOT NULL THEN r.montage_costs ELSE 0 END), 0) as paid_montage_costs
        INTO montage_data
        FROM receipts r
        WHERE r.user_id = purchase_record.user_id
        AND DATE(r.created_at) >= purchase_record.link_date_from
        AND DATE(r.created_at) <= purchase_record.link_date_to
        AND r.is_deleted = FALSE
        AND r.montage_costs IS NOT NULL
        AND r.montage_costs > 0;

        total_montage := COALESCE(montage_data.total_montage_costs, 0);
        paid_montage := COALESCE(montage_data.paid_montage_costs, 0);
        unpaid_montage := total_montage - paid_montage;

        -- Update the purchase record
        UPDATE purchases 
        SET 
            amount_ttc = total_montage,
            amount_ht = total_montage / 1.2,
            amount = total_montage,
            advance_payment = paid_montage,
            balance = unpaid_montage,
            payment_status = CASE 
                WHEN unpaid_montage = 0 THEN 'Paid'
                WHEN paid_montage > 0 THEN 'Partially Paid'
                ELSE 'Unpaid'
            END,
            updated_at = NOW()
        WHERE id = purchase_record.id;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status changes
DROP TRIGGER IF EXISTS trigger_update_purchase_on_montage_change ON receipts;
CREATE TRIGGER trigger_update_purchase_on_montage_change
    AFTER UPDATE ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_purchase_on_montage_status_change();
