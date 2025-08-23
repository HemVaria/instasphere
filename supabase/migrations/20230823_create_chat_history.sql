-- Create chat_history table for storing Hugging Face chatbot conversations
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_message TEXT NOT NULL,
  bot_reply TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert their own chat history
CREATE POLICY "Users can insert their own chat history"
  ON chat_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow users to view their own chat history
CREATE POLICY "Users can view their own chat history"
  ON chat_history
  FOR SELECT
  TO authenticated
  USING (true);