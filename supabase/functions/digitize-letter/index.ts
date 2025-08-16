import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { 
      conversationId,
      letterContent,
      scannedImageUrl,
      adminNotes 
    } = await req.json();

    if (!conversationId || !letterContent) {
      throw new Error('Conversation ID and letter content are required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify conversation exists
    const { data: conversation, error: convError } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError) {
      throw new Error('Conversation not found');
    }

    // Create the digitized message
    const messageData = {
      conversation_id: conversationId,
      sender_type: 'user',
      content: letterContent,
      delivery_type: 'physical',
      status: 'received',
      physical_letter_image_url: scannedImageUrl || null,
      ai_summary: adminNotes || null,
      generation_cost: 0
    };

    const { data: newMessage, error: messageError } = await supabaseClient
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (messageError) {
      throw new Error(`Error saving digitized message: ${messageError.message}`);
    }

    // Update conversation timestamp and creature status
    await supabaseClient
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Update creature status to indicate they have a letter to respond to
    await supabaseClient
      .from('creatures')
      .update({ conversation_state: 'waiting_for_letter' })
      .eq('id', conversation.creature_id);

    console.log(`Digitized physical letter for conversation ${conversationId}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: newMessage,
      digitizedContent: letterContent
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in digitize-letter:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});