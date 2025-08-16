-- Add mailing address assignments and daily limits tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_digital_replies_reset_date DATE DEFAULT CURRENT_DATE;

-- Create credit purchase transactions table
CREATE TABLE IF NOT EXISTS credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  credit_type TEXT NOT NULL CHECK (credit_type IN ('physical', 'digital')),
  credits_purchased INTEGER NOT NULL,
  amount_paid NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS for credit purchases
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for credit purchases
CREATE POLICY "Users can view own credit purchases" 
ON credit_purchases 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can insert credit purchases" 
ON credit_purchases 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update credit purchases" 
ON credit_purchases 
FOR UPDATE 
USING (true);

-- Add tracking for message generation and physical mail status
ALTER TABLE messages ADD COLUMN IF NOT EXISTS generation_cost INTEGER DEFAULT 0;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS physical_mail_status TEXT CHECK (physical_mail_status IN ('pending', 'printed', 'mailed', 'delivered'));
ALTER TABLE messages ADD COLUMN IF NOT EXISTS mailed_at TIMESTAMPTZ;

-- Create function to reset daily digital replies
CREATE OR REPLACE FUNCTION reset_daily_digital_replies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles 
  SET 
    daily_digital_replies_used = 0,
    daily_digital_replies_reset_date = CURRENT_DATE
  WHERE daily_digital_replies_reset_date < CURRENT_DATE;
END;
$$;

-- Create function to check if user can use free digital reply
CREATE OR REPLACE FUNCTION can_use_free_digital_reply(user_uuid UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_record profiles%ROWTYPE;
BEGIN
  -- First reset daily counters if needed
  PERFORM reset_daily_digital_replies();
  
  -- Get current profile
  SELECT * INTO profile_record 
  FROM profiles 
  WHERE user_id = user_uuid;
  
  -- Return true if user has free replies left
  RETURN COALESCE(profile_record.daily_digital_replies_used, 0) < 2;
END;
$$;