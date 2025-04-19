
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with admin privileges
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update expired subscriptions
    const { error: expiredError } = await supabase
      .from("subscriptions")
      .update({ subscription_status: "Expired" })
      .eq("subscription_status", "Active")
      .lt("end_date", new Date().toISOString());

    if (expiredError) throw expiredError;

    // Update newly active subscriptions
    const { error: activeError } = await supabase
      .from("subscriptions")
      .update({ subscription_status: "Active" })
      .eq("subscription_status", "inActive")
      .lte("start_date", new Date().toISOString())
      .gt("end_date", new Date().toISOString());

    if (activeError) throw activeError;

    // Renew monthly subscriptions about to expire
    const { data: monthlySubscriptions, error: monthlyError } = await supabase
      .from("subscriptions")
      .select("id, end_date")
      .eq("is_recurring", true)
      .eq("subscription_type", "Monthly")
      .eq("subscription_status", "Active")
      .lte("end_date", new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString()); // within 24 hours

    if (monthlyError) throw monthlyError;

    for (const sub of monthlySubscriptions || []) {
      const newEndDate = new Date(new Date(sub.end_date).getTime() + 30 * 24 * 60 * 60 * 1000); // Add 30 days
      
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({ end_date: newEndDate.toISOString() })
        .eq("id", sub.id);
        
      if (updateError) throw updateError;
    }

    // Renew quarterly subscriptions about to expire
    const { data: quarterlySubscriptions, error: quarterlyError } = await supabase
      .from("subscriptions")
      .select("id, end_date")
      .eq("is_recurring", true)
      .eq("subscription_type", "Quarterly")
      .eq("subscription_status", "Active")
      .lte("end_date", new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString()); // within 24 hours

    if (quarterlyError) throw quarterlyError;

    for (const sub of quarterlySubscriptions || []) {
      const newEndDate = new Date(new Date(sub.end_date).getTime() + 90 * 24 * 60 * 60 * 1000); // Add 90 days
      
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({ end_date: newEndDate.toISOString() })
        .eq("id", sub.id);
        
      if (updateError) throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Subscription statuses updated successfully",
        timestamp: new Date().toISOString()
      }), 
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        } 
      }
    );
  } catch (error) {
    console.error("Error updating subscriptions:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }), 
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        } 
      }
    );
  }
});
