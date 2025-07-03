
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create authenticated Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      throw new Error('Authentication required')
    }

    // Get clients that need renewal check (where renewal_date <= today and not marked as needing renewal)
    const today = new Date()
    const todayString = today.toISOString().split('T')[0]
    
    const { data: clientsToCheck, error: fetchError } = await supabaseClient
      .from('clients')
      .select('id, name, renewal_date, need_renewal, renewal_times')
      .lte('renewal_date', todayString)
      .eq('need_renewal', false)
      .eq('is_deleted', false)
      .eq('user_id', user.id)

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${clientsToCheck?.length || 0} clients to check for renewal for user ${user.id}`)

    if (!clientsToCheck || clientsToCheck.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          processed: 0,
          message: 'No clients found that need renewal checking'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    let processedCount = 0
    let errorCount = 0

    // Process each client that needs renewal
    for (const client of clientsToCheck || []) {
      try {
        console.log(`Processing client ${client.name} (ID: ${client.id}) with renewal date ${client.renewal_date}`)
        
        // Calculate next renewal date (current renewal_date + 1.5 years)
        const currentRenewalDate = new Date(client.renewal_date)
        const nextRenewalDate = new Date(currentRenewalDate)
        nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 18) // Add 1.5 years (18 months)
        
        // Update client: mark as needing renewal, increment renewal times, set next renewal date
        const { error: updateError } = await supabaseClient
          .from('clients')
          .update({ 
            need_renewal: true,
            renewal_times: (client.renewal_times || 0) + 1,
            renewal_date: nextRenewalDate.toISOString().split('T')[0]
          })
          .eq('id', client.id)
          .eq('user_id', user.id)

        if (updateError) {
          console.error(`Error updating client ${client.id}:`, updateError)
          errorCount++
          continue
        }

        processedCount++
        console.log(`Successfully marked client ${client.name} for renewal. Next renewal date: ${nextRenewalDate.toISOString().split('T')[0]}`)

      } catch (error) {
        console.error(`Error processing client ${client.id}:`, error)
        errorCount++
      }
    }

    console.log(`Client renewal process completed: ${processedCount} successful, ${errorCount} errors`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount,
        errors: errorCount,
        message: `Successfully processed ${processedCount} client renewals${errorCount > 0 ? ` (${errorCount} errors)` : ''}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in check-client-renewals function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
