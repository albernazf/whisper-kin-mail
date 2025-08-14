-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  physical_address TEXT,
  assigned_mailing_address TEXT,
  parent_email TEXT,
  credits_physical INTEGER DEFAULT 0,
  credits_digital INTEGER DEFAULT 0,
  daily_digital_replies_used INTEGER DEFAULT 0,
  last_digital_reply_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (user_id = auth.uid());

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

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();