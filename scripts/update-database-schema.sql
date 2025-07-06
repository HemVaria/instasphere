-- Add new columns to messages table for enhanced features
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS replies INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'general';

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Insert default channels
INSERT INTO channels (name, description) VALUES 
  ('general', 'General discussion'),
  ('random', 'Random conversations'),
  ('tech', 'Technology discussions'),
  ('gaming', 'Gaming chat'),
  ('music', 'Music discussions')
ON CONFLICT (name) DO NOTHING;

-- Create user_presence table for tracking online users
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_online BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'online'
);

-- Enable RLS for new tables
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Channels are viewable by everyone" ON channels
  FOR SELECT USING (true);

CREATE POLICY "User presence is viewable by everyone" ON user_presence
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own presence" ON user_presence
  FOR ALL USING (auth.uid() = user_id);

-- Enable real-time for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE channels;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS messages_channel_idx ON messages(channel);
CREATE INDEX IF NOT EXISTS messages_likes_idx ON messages(likes DESC);
CREATE INDEX IF NOT EXISTS user_presence_online_idx ON user_presence(is_online, last_seen);
