
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

    // Get purchases that need to be repeated (where next_recurring_date <= today)
    const today = new Date().toISOString().split('T')[0]
    
    const { data: purchasesToRepeat, error: fetchError } = await supabaseClient
      .from('purchases')
      .select('*')
      .lte('next_recurring_date', today)
      .not('recurring_type', 'is', null)
      .eq('is_deleted', false)

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${purchasesToRepeat?.length || 0} purchases to repeat`)

    for (const purchase of purchasesToRepeat || []) {
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

        // Create new purchase record
        const newPurchase = {
          user_id: purchase.user_id,
          supplier_id: purchase.supplier_id,
          description: purchase.description,
          amount_ht: purchase.amount_ht,
          amount_ttc: purchase.amount_ttc,
          amount: purchase.amount,
          category: purchase.category,
          purchase_date: purchase.next_recurring_date,
          payment_method: purchase.payment_method,
          notes: purchase.notes ? `${purchase.notes} (Auto-generated from recurring purchase)` : 'Auto-generated from recurring purchase',
          advance_payment: 0, // Reset advance payment for new purchase
          balance: purchase.amount_ttc, // Full amount as balance
          payment_status: 'Unpaid', // Reset payment status
          payment_urgency: purchase.payment_urgency,
          recurring_type: purchase.recurring_type,
          next_recurring_date: nextDate.toISOString().split('T')[0],
          purchase_type: purchase.purchase_type || 'Operational Expenses',
          is_deleted: false
        }

        const { error: insertError } = await supabaseClient
          .from('purchases')
          .insert(newPurchase)

        if (insertError) {
          console.error(`Error creating recurring purchase for ID ${purchase.id}:`, insertError)
          continue
        }

        // Update the original purchase's next_recurring_date
        const { error: updateError } = await supabaseClient
          .from('purchases')
          .update({ next_recurring_date: nextDate.toISOString().split('T')[0] })
          .eq('id', purchase.id)

        if (updateError) {
          console.error(`Error updating next recurring date for ID ${purchase.id}:`, updateError)
        } else {
          console.log(`Successfully created recurring purchase for ID ${purchase.id}`)
        }

      } catch (error) {
        console.error(`Error processing recurring purchase ID ${purchase.id}:`, error)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: purchasesToRepeat?.length || 0,
        message: `Processed ${purchasesToRepeat?.length || 0} recurring purchases`
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
