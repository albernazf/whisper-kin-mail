import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Retrieve the session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed');
    }

    const userId = session.metadata?.userId;
    const creditType = session.metadata?.creditType;
    const credits = parseInt(session.metadata?.credits || '0');

    if (!userId || !creditType || !credits) {
      throw new Error('Missing session metadata');
    }

    // Update purchase record
    await supabaseClient
      .from('credit_purchases')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('stripe_session_id', sessionId);

    // Add credits to user profile
    const columnName = creditType === 'physical' ? 'credits_physical' : 'credits_digital';
    
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select(`${columnName}`)
      .eq('user_id', userId)
      .single();

    if (profileError) {
      throw new Error(`Error fetching profile: ${profileError.message}`);
    }

    const currentCredits = profile[columnName] || 0;
    const newCredits = currentCredits + credits;

    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ [columnName]: newCredits })
      .eq('user_id', userId);

    if (updateError) {
      throw new Error(`Error updating credits: ${updateError.message}`);
    }

    console.log(`Successfully added ${credits} ${creditType} credits to user ${userId}`);

    return new Response(JSON.stringify({ 
      success: true,
      creditsAdded: credits,
      creditType,
      newTotal: newCredits
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in complete-purchase:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});