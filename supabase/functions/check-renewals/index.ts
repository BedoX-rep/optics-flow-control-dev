
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0] // Format as YYYY-MM-DD

    // Get clients whose renewal date is today or past and haven't been renewed
    const { data: clientsToRenew, error: clientsError } = await supabaseClient
      .from('clients')
      .select(`
        id,
        name,
        renewal_date,
        renewed,
        user_id,
        users!inner (
          id,
          email
        )
      `)
      .eq('renewed', false)
      .lte('renewal_date', todayStr)
      .not('renewal_date', 'is', null)
      .eq('is_deleted', false)

    if (clientsError) {
      console.error('Error fetching clients:', clientsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch clients' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    let notificationCount = 0
    let errorCount = 0

    // Process each client that needs renewal
    for (const client of clientsToRenew || []) {
      try {
        // Here you would implement your notification logic
        // For now, we'll just log and count
        console.log(`Client ${client.name} (ID: ${client.id}) needs renewal. Due date: ${client.renewal_date}`)
        
        // You can implement email notifications, in-app notifications, etc.
        // For example, you could use a service like SendGrid, Resend, or native email
        
        // Example: Create a notification record (you'd need to create a notifications table)
        const { error: notificationError } = await supabaseClient
          .from('notifications')
          .insert({
            user_id: client.user_id,
            type: 'client_renewal',
            title: 'Client Renewal Due',
            message: `Client ${client.name} is due for renewal (${client.renewal_date})`,
            client_id: client.id,
            created_at: new Date().toISOString()
          })

        if (notificationError) {
          console.error(`Error creating notification for client ${client.id}:`, notificationError)
          errorCount++
        } else {
          notificationCount++
        }

      } catch (error) {
        console.error(`Error processing client ${client.id}:`, error)
        errorCount++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${clientsToRenew?.length || 0} clients`,
        notificationsSent: notificationCount,
        errors: errorCount
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in check-renewals function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
