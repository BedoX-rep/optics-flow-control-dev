
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get purchases that need to be renewed (where next_recurring_date <= today)
    const today = new Date().toISOString().split('T')[0]
    
    const { data: purchasesToRenew, error: fetchError } = await supabaseClient
      .from('purchases')
      .select('*')
      .lte('next_recurring_date', today)
      .not('recurring_type', 'is', null)
      .eq('is_deleted', false)

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${purchasesToRenew?.length || 0} purchases to renew`)

    for (const purchase of purchasesToRenew || []) {
      try {
        // Calculate next recurring date
        const currentDate = new Date(purchase.next_recurring_date)
        let nextDate = new Date(currentDate)

        switch (purchase.recurring_type) {
          case '1_month':
            nextDate.setMonth(nextDate.getMonth() + 1)
            break
          case '3_months':
            nextDate.setMonth(nextDate.getMonth() + 3)
            break
          case '6_months':
            nextDate.setMonth(nextDate.getMonth() + 6)
            break
          case '1_year':
            nextDate.setFullYear(nextDate.getFullYear() + 1)
            break
          default:
            continue
        }

        // Calculate payment urgency (1 month from the recurring date)
        const paymentUrgencyDate = new Date(purchase.next_recurring_date)
        paymentUrgencyDate.setMonth(paymentUrgencyDate.getMonth() + 1)

        // Record the balance change in history before updating
        const currentBalance = purchase.balance || 0
        if (currentBalance !== (purchase.amount_ttc || purchase.amount)) {
          const { error: historyError } = await supabaseClient
            .from('purchase_balance_history')
            .insert({
              purchase_id: purchase.id,
              user_id: purchase.user_id,
              previous_balance: currentBalance,
              new_balance: purchase.amount_ttc || purchase.amount,
              change_amount: (purchase.amount_ttc || purchase.amount) - currentBalance,
              change_reason: 'Recurring purchase renewal - balance reset',
              change_date: purchase.next_recurring_date
            })

          if (historyError) {
            console.error(`Error recording balance history for ID ${purchase.id}:`, historyError)
          }
        }

        // Soft reset the existing purchase record
        const updatedPurchaseData = {
          purchase_date: purchase.next_recurring_date, // Set to the due recurring date
          advance_payment: 0, // Reset advance payment to 0
          balance: purchase.amount_ttc || purchase.amount, // Reset balance to full amount
          payment_status: 'Unpaid', // Reset payment status
          payment_urgency: paymentUrgencyDate.toISOString().split('T')[0], // Set payment urgency to 1 month from recurring date
          next_recurring_date: nextDate.toISOString().split('T')[0] // Update to next recurring date
        }

        const { error: updateError } = await supabaseClient
          .from('purchases')
          .update(updatedPurchaseData)
          .eq('id', purchase.id)

        if (updateError) {
          console.error(`Error updating recurring purchase for ID ${purchase.id}:`, updateError)
          continue
        }

        console.log(`Successfully renewed recurring purchase for ID ${purchase.id}`)

      } catch (error) {
        console.error(`Error processing recurring purchase ID ${purchase.id}:`, error)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: purchasesToRenew?.length || 0,
        message: `Processed ${purchasesToRenew?.length || 0} recurring purchases`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in create-recurring-purchases function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
