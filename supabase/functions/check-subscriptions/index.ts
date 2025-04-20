
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      // Create client with Auth context of the user that called the function.
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get all subscriptions that need to be checked
    const { data: subscriptions, error: fetchError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .or('subscription_status.eq.Active,subscription_status.eq.Expired')

    if (fetchError) {
      throw fetchError
    }

    const now = new Date()
    const updatedSubscriptions = []

    // Process each subscription
    for (const subscription of subscriptions) {
      let newStatus = subscription.subscription_status
      
      // For Active subscriptions, check if they've expired
      if (subscription.subscription_status === 'Active' && 
          subscription.end_date && 
          new Date(subscription.end_date) < now) {
        
        // If recurring, we would normally renew here
        if (subscription.is_recurring) {
          // Process renewal based on subscription type
          const newEndDate = new Date()
          if (subscription.subscription_type === 'Monthly') {
            newEndDate.setMonth(newEndDate.getMonth() + 1)
          } else if (subscription.subscription_type === 'Quarterly') {
            newEndDate.setMonth(newEndDate.getMonth() + 3)
          } else if (subscription.subscription_type === 'Lifetime') {
            // For lifetime, extend far into the future
            newEndDate.setFullYear(newEndDate.getFullYear() + 100)
          } else {
            // For trial, extend only a short period
            newEndDate.setDate(newEndDate.getDate() + 7)
          }
          
          // Update subscription with new end date
          const { error: updateError } = await supabaseClient
            .from('subscriptions')
            .update({ 
              start_date: new Date().toISOString(),
              end_date: newEndDate.toISOString() 
            })
            .eq('id', subscription.id)
          
          if (updateError) {
            console.error(`Error updating subscription ${subscription.id}:`, updateError)
          } else {
            updatedSubscriptions.push({
              id: subscription.id,
              action: 'renewed',
              new_end_date: newEndDate.toISOString(),
              subscription_type: subscription.subscription_type
            })
          }
        } else {
          // Non-recurring subscriptions expire
          const { error: expireError } = await supabaseClient
            .from('subscriptions')
            .update({ subscription_status: 'Expired' })
            .eq('id', subscription.id)
          
          if (expireError) {
            console.error(`Error expiring subscription ${subscription.id}:`, expireError)
          } else {
            updatedSubscriptions.push({
              id: subscription.id,
              action: 'expired',
              previous_status: 'Active'
            })
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${subscriptions.length} subscriptions`,
        updated: updatedSubscriptions
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 200 
      },
    )
  } catch (error) {
    console.error('Error processing subscriptions:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400 
      },
    )
  }
})

