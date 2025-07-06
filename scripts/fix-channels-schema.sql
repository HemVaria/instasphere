-- First, let's clean up any duplicate channels and fix the schema
DELETE FROM channels WHERE name = 'general';

-- Insert the default channels properly
INSERT INTO channels (name, description, is_private, created_by) VALUES 
  ('general', 'General discussion', false, (SELECT id FROM auth.users LIMIT 1)),
  ('random', 'Random conversations', false, (SELECT id FROM auth.users LIMIT 1)),
  ('tech', 'Technology discussions', false, (SELECT id FROM auth.users LIMIT 1)),
  ('gaming', 'Gaming chat', false, (SELECT id FROM auth.users LIMIT 1)),
  ('music', 'Music discussions', false, (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (name) DO NOTHING;

-- Make sure messages table has proper channel reference
-- Update existing messages to reference channel IDs instead of names
UPDATE messages 
SET channel = (SELECT id FROM channels WHERE channels.name = messages.channel)
WHERE channel IS NOT NULL 
AND channel NOT IN (SELECT id FROM channels);

-- For messages with channel = 'general' or NULL, set to general channel ID
UPDATE messages 
SET channel = (SELECT id FROM channels WHERE name = 'general')
WHERE channel IS NULL OR channel = 'general';
