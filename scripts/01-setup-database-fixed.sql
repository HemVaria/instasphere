-- Enable the necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  avatar_url TEXT,
  channel TEXT DEFAULT 'general',
  likes INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_private BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_presence table for tracking online users
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_online BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'online'
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('message', 'mention', 'channel_invite', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON messages(user_id);
CREATE INDEX IF NOT EXISTS messages_channel_idx ON messages(channel);
CREATE INDEX IF NOT EXISTS messages_likes_idx ON messages(likes DESC);

CREATE INDEX IF NOT EXISTS channels_name_idx ON channels(name);
CREATE INDEX IF NOT EXISTS channels_created_by_idx ON channels(created_by);

CREATE INDEX IF NOT EXISTS user_presence_online_idx ON user_presence(is_online, last_seen);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for messages (allow all operations for now)
DROP POLICY IF EXISTS "Messages are viewable by everyone" ON messages;
CREATE POLICY "Messages are viewable by everyone" ON messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert messages" ON messages;
CREATE POLICY "Users can insert messages" ON messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update messages" ON messages;
CREATE POLICY "Users can update messages" ON messages FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete messages" ON messages;
CREATE POLICY "Users can delete messages" ON messages FOR DELETE USING (true);

-- Create policies for channels (allow all operations for now)
DROP POLICY IF EXISTS "Channels are viewable by everyone" ON channels;
CREATE POLICY "Channels are viewable by everyone" ON channels FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create channels" ON channels;
CREATE POLICY "Users can create channels" ON channels FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update channels" ON channels;
CREATE POLICY "Users can update channels" ON channels FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete channels" ON channels;
CREATE POLICY "Users can delete channels" ON channels FOR DELETE USING (true);

-- Create policies for user_presence (allow all operations for now)
DROP POLICY IF EXISTS "User presence is viewable by everyone" ON user_presence;
CREATE POLICY "User presence is viewable by everyone" ON user_presence FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage presence" ON user_presence;
CREATE POLICY "Users can manage presence" ON user_presence FOR ALL USING (true);

-- Create policies for notifications (allow all operations for now)
DROP POLICY IF EXISTS "Users can view notifications" ON notifications;
CREATE POLICY "Users can view notifications" ON notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update notifications" ON notifications;
CREATE POLICY "Users can update notifications" ON notifications FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can create notifications" ON notifications;
CREATE POLICY "Users can create notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE channels;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Insert default channels
INSERT INTO channels (name, description, is_private) VALUES 
  ('general', 'General discussion for everyone', false),
  ('random', 'Random conversations and off-topic chat', false),
  ('tech', 'Technology discussions and programming', false),
  ('gaming', 'Gaming chat and discussions', false),
  ('music', 'Music discussions and sharing', false)
ON CONFLICT (name) DO NOTHING;
