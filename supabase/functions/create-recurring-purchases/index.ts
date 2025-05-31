
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200
    })
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create supabase client with user's token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? 'https://vbcdgubnvbilavetsjlr.supabase.co',
      Deno.env.get('SUPABASE_ANON_KEY') ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiY2RndWJudmJpbGF2ZXRzamxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTE4MDYsImV4cCI6MjA2MDY2NzgwNn0.aNeLdgw7LTsVl73gzKIjxT5w0AyT99x1bh-BSV3HeCQ',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Get purchases that need to be renewed (where next_recurring_date <= today)
    // RLS will automatically filter for the authenticated user
    const today = new Date()
    const todayString = today.toISOString().split('T')[0]
    
    const { data: purchasesToRenew, error: fetchError } = await supabaseClient
      .from('purchases')
      .select('*')
      .lte('next_recurring_date', todayString)
      .not('recurring_type', 'is', null)
      .not('next_recurring_date', 'is', null)
      .eq('is_deleted', false)

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${purchasesToRenew?.length || 0} purchases to renew for user ${user.id}`)

    if (!purchasesToRenew || purchasesToRenew.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          processed: 0,
          message: 'No recurring purchases found that need renewal'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    let processedCount = 0
    let errorCount = 0

    for (const purchase of purchasesToRenew || []) {
      try {
        console.log(`Processing purchase ID ${purchase.id} with recurring type ${purchase.recurring_type}`)
        
        // Calculate next recurring date from the current next_recurring_date
        const currentRecurringDate = new Date(purchase.next_recurring_date)
        let nextRecurringDate = new Date(currentRecurringDate)

        switch (purchase.recurring_type) {
          case '1_month':
            nextRecurringDate.setMonth(nextRecurringDate.getMonth() + 1)
            break
          case '3_months':
            nextRecurringDate.setMonth(nextRecurringDate.getMonth() + 3)
            break
          case '6_months':
            nextRecurringDate.setMonth(nextRecurringDate.getMonth() + 6)
            break
          case '1_year':
            nextRecurringDate.setFullYear(nextRecurringDate.getFullYear() + 1)
            break
          default:
            console.log(`Invalid recurring type: ${purchase.recurring_type}`)
            continue
        }

        // Calculate payment urgency (1 month from the new purchase date)
        const newPurchaseDate = new Date(purchase.next_recurring_date)
        const paymentUrgencyDate = new Date(newPurchaseDate)
        paymentUrgencyDate.setMonth(paymentUrgencyDate.getMonth() + 1)

        // Record the balance change in history before updating
        const currentBalance = purchase.balance || 0
        const fullAmount = purchase.amount_ttc || purchase.amount
        
        if (currentBalance !== fullAmount) {
          const { error: historyError } = await supabaseClient
            .from('purchase_balance_history')
            .insert({
              purchase_id: purchase.id,
              user_id: user.id,
              previous_balance: currentBalance,
              new_balance: fullAmount,
              change_amount: fullAmount - currentBalance,
              change_reason: 'Recurring purchase renewal - balance reset',
              change_date: newPurchaseDate.toISOString()
            })

          if (historyError) {
            console.error(`Error recording balance history for ID ${purchase.id}:`, historyError)
          }
        }

        // Update the purchase record with new recurring cycle
        const updatedPurchaseData = {
          purchase_date: newPurchaseDate.toISOString().split('T')[0], // Set to the current recurring date
          advance_payment: 0, // Reset advance payment to 0
          balance: fullAmount, // Reset balance to full amount
          payment_status: 'Unpaid', // Reset payment status
          payment_urgency: paymentUrgencyDate.toISOString().split('T')[0], // Set payment urgency
          next_recurring_date: nextRecurringDate.toISOString().split('T')[0] // Update to next recurring date
        }

        const { error: updateError } = await supabaseClient
          .from('purchases')
          .update(updatedPurchaseData)
          .eq('id', purchase.id)

        if (updateError) {
          console.error(`Error updating recurring purchase for ID ${purchase.id}:`, updateError)
          errorCount++
          continue
        }

        processedCount++
        console.log(`Successfully renewed recurring purchase for ID ${purchase.id}`)

      } catch (error) {
        console.error(`Error processing recurring purchase ID ${purchase.id}:`, error)
        errorCount++
      }
    }

    console.log(`Renewal process completed: ${processedCount} successful, ${errorCount} errors`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount,
        errors: errorCount,
        message: `Successfully processed ${processedCount} recurring purchases${errorCount > 0 ? ` (${errorCount} errors)` : ''}`
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
