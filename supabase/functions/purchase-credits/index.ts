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
    const { creditType, amount } = await req.json();
    
    if (!creditType || !['physical', 'digital'].includes(creditType)) {
      throw new Error('Invalid credit type. Must be "physical" or "digital"');
    }

    // Get user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Calculate credits and pricing
    let credits, priceInCents, productName;
    if (creditType === 'physical') {
      credits = 5; // 5 physical credits for $5
      priceInCents = 500; // $5.00
      productName = '5 Physical Letter Credits';
    } else {
      credits = 100; // 100 digital credits for $5  
      priceInCents = 500; // $5.00
      productName = '100 Digital Reply Credits';
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Check for existing customer
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { 
              name: productName,
              description: `${credits} ${creditType} credits for Fantasy Letters`
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/credits`,
      metadata: {
        userId: user.id,
        creditType,
        credits: credits.toString(),
      },
    });

    // Record the purchase attempt
    await supabaseClient.from('credit_purchases').insert({
      user_id: user.id,
      stripe_session_id: session.id,
      credit_type: creditType,
      credits_purchased: credits,
      amount_paid: priceInCents / 100,
      status: 'pending'
    });

    console.log(`Created checkout session for ${user.email}: ${creditType} credits`);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in purchase-credits:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});