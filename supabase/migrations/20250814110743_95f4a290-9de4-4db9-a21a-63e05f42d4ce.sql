-- Add missing columns to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS physical_address TEXT,
ADD COLUMN IF NOT EXISTS assigned_mailing_address TEXT,
ADD COLUMN IF NOT EXISTS parent_email TEXT,
ADD COLUMN IF NOT EXISTS credits_physical INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_digital INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_digital_replies_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_digital_reply_date DATE;

-- Create creatures table
CREATE TABLE public.creatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  backstory TEXT,
  conversation_state TEXT DEFAULT 'idle' CHECK (conversation_state IN ('idle', 'waiting_for_letter', 'pending_response')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creature_id UUID REFERENCES public.creatures(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  started_by TEXT NOT NULL CHECK (started_by IN ('user', 'creature')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'creature')),
  content TEXT,
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('physical', 'digital')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid', 'sent')),
  context_notes TEXT,
  ai_summary TEXT,
  physical_letter_image_url TEXT,
  credits_required INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2),
  credit_type TEXT NOT NULL CHECK (credit_type IN ('physical', 'digital')),
  credits_purchased INTEGER,
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.creatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for creatures
CREATE POLICY "Users can view own creatures" ON public.creatures
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own creatures" ON public.creatures
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own creatures" ON public.creatures
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own creatures" ON public.creatures
FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for conversations
CREATE POLICY "Users can view own conversations" ON public.conversations
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own conversations" ON public.conversations
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create RLS policies for messages
CREATE POLICY "Users can view own messages" ON public.messages
FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM public.conversations WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create own messages" ON public.messages
FOR INSERT WITH CHECK (
  conversation_id IN (
    SELECT id FROM public.conversations WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own messages" ON public.messages
FOR UPDATE USING (
  conversation_id IN (
    SELECT id FROM public.conversations WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own transactions" ON public.transactions
FOR INSERT WITH CHECK (user_id = auth.uid());