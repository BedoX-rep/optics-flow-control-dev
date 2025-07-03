
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    })
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

    // Check if this is a specific client renewal request
    const requestBody = req.method === 'POST' ? await req.json() : null
    const clientId = requestBody?.clientId

    if (clientId) {
      // Process specific client renewal
      const { data: client, error: fetchError } = await supabaseClient
        .from('clients')
        .select('id, name, renewal_date, need_renewal, renewal_times')
        .eq('id', clientId)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .single()

      if (fetchError || !client) {
        throw new Error('Client not found or unauthorized')
      }

      if (!client.need_renewal) {
        throw new Error('Client does not need renewal')
      }

      // Calculate new renewal date (today + 1.5 years)
      const today = new Date()
      const newRenewalDate = new Date(today)
      newRenewalDate.setMonth(newRenewalDate.getMonth() + 18) // Add 1.5 years (18 months)

      // Update client: mark as not needing renewal, increment renewal times, set new renewal date
      const { error: updateError } = await supabaseClient
        .from('clients')
        .update({ 
          need_renewal: false,
          renewal_times: (client.renewal_times || 0) + 1,
          renewal_date: newRenewalDate.toISOString().split('T')[0]
        })
        .eq('id', clientId)
        .eq('user_id', user.id)

      if (updateError) {
        throw updateError
      }

      console.log(`Successfully renewed client ${client.name}. Next renewal date: ${newRenewalDate.toISOString().split('T')[0]}`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Client ${client.name} renewed successfully`,
          newRenewalDate: newRenewalDate.toISOString().split('T')[0]
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Otherwise, check for clients that need renewal marking
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

    // Process each client that needs renewal - only mark as needing renewal
    for (const client of clientsToCheck || []) {
      try {
        console.log(`Processing client ${client.name} (ID: ${client.id}) with renewal date ${client.renewal_date}`)
        
        // Update client: mark as needing renewal only
        const { error: updateError } = await supabaseClient
          .from('clients')
          .update({ 
            need_renewal: true
          })
          .eq('id', client.id)
          .eq('user_id', user.id)

        if (updateError) {
          console.error(`Error updating client ${client.id}:`, updateError)
          errorCount++
          continue
        }

        processedCount++
        console.log(`Successfully marked client ${client.name} for renewal`)

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
