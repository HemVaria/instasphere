-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_private BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS channels_name_idx ON channels(name);
CREATE INDEX IF NOT EXISTS channels_created_by_idx ON channels(created_by);

-- Enable Row Level Security
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Create policies for channels
CREATE POLICY "Channels are viewable by everyone" ON channels
  FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can create channels" ON channels
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only channel creators can update their channels" ON channels
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Only channel creators can delete their channels" ON channels
  FOR DELETE USING (auth.uid() = created_by);

-- Enable real-time for channels
ALTER PUBLICATION supabase_realtime ADD TABLE channels;

-- Update messages table to include channel reference
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES channels(id) ON DELETE CASCADE;

-- Create index for messages by channel
CREATE INDEX IF NOT EXISTS messages_channel_id_idx ON messages(channel_id);
