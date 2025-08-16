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
      userMessage, 
      contextNotes, 
      replyType,
      creatureId 
    } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get creature info
    const { data: creature, error: creatureError } = await supabaseClient
      .from('creatures')
      .select('*')
      .eq('id', creatureId)
      .single();

    if (creatureError) {
      throw new Error('Creature not found');
    }

    // Get conversation history
    const { data: messages, error: messagesError } = await supabaseClient
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw new Error('Error fetching conversation history');
    }

    // Check if user can use free digital reply or has credits
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      throw new Error('Error fetching user profile');
    }

    let canReply = false;
    let useFreeReply = false;
    let cost = 0;

    if (replyType === 'digital') {
      // Check for free daily replies
      const { data: canUseFree } = await supabaseClient
        .rpc('can_use_free_digital_reply', { user_uuid: user.id });
      
      if (canUseFree) {
        canReply = true;
        useFreeReply = true;
      } else if (profile.credits_digital > 0) {
        canReply = true;
        cost = 1;
      }
    } else if (replyType === 'physical') {
      if (profile.credits_physical > 0) {
        canReply = true;
        cost = 1;
      }
    }

    if (!canReply) {
      throw new Error(`Insufficient credits for ${replyType} reply`);
    }

    // Build conversation context
    let conversationHistory = '';
    messages.forEach(msg => {
      const sender = msg.sender_type === 'user' ? 'You wrote' : `${creature.name} wrote`;
      conversationHistory += `${sender}: ${msg.content}\n\n`;
    });

    if (userMessage) {
      conversationHistory += `You wrote: ${userMessage}\n\n`;
    }

    // Create AI prompt
    const contextString = contextNotes ? `\n\nAdditional context: ${contextNotes}` : '';
    
    const prompt = `You are ${creature.name}, a magical creature with this background: ${creature.backstory}

You are writing a letter back to a child who has been corresponding with you. Here is your conversation history:

${conversationHistory}

${contextString}

Write a warm, engaging letter response from ${creature.name}'s perspective. Make it:
- Age-appropriate and encouraging
- Consistent with ${creature.name}'s personality and backstory
- Reference things from the conversation history
- Ask questions to keep the conversation going
- Be magical and imaginative
- Around 150-250 words

${replyType === 'physical' ? 'This will be printed and mailed as a physical letter, so make it special!' : ''}

Write only the letter content, not "Dear [name]" or signature - just the body text.`;

    // Generate response with OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: 'Please write the letter response.' }
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error('Failed to generate letter response');
    }

    const aiData = await openAIResponse.json();
    const letterContent = aiData.choices[0].message.content;

    // Save user message if provided
    if (userMessage) {
      await supabaseClient.from('messages').insert({
        conversation_id: conversationId,
        sender_type: 'user',
        content: userMessage,
        delivery_type: 'digital',
        status: 'sent',
        generation_cost: 0
      });
    }

    // Save AI response
    const messageData = {
      conversation_id: conversationId,
      sender_type: 'creature',
      content: letterContent,
      delivery_type: replyType,
      status: replyType === 'physical' ? 'pending_physical' : 'sent',
      generation_cost: cost,
      context_notes: contextNotes || null
    };

    const { data: newMessage, error: messageError } = await supabaseClient
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (messageError) {
      throw new Error('Error saving message');
    }

    // Deduct credits or increment daily counter
    if (!useFreeReply) {
      const columnName = replyType === 'physical' ? 'credits_physical' : 'credits_digital';
      const currentCredits = profile[columnName];
      
      await supabaseClient
        .from('profiles')
        .update({ [columnName]: currentCredits - cost })
        .eq('user_id', user.id);
    } else {
      // Increment daily counter
      await supabaseClient
        .from('profiles')
        .update({ 
          daily_digital_replies_used: (profile.daily_digital_replies_used || 0) + 1 
        })
        .eq('user_id', user.id);
    }

    // Update conversation timestamp
    await supabaseClient
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    console.log(`Generated ${replyType} letter for creature ${creature.name}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: newMessage,
      letterContent,
      costCredits: cost,
      usedFreeReply: useFreeReply
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in generate-letter:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});