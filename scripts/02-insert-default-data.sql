-- Insert default channels
INSERT INTO channels (name, description, is_private) VALUES 
  ('general', 'General discussion for everyone', false),
  ('random', 'Random conversations and off-topic chat', false),
  ('tech', 'Technology discussions and programming', false),
  ('gaming', 'Gaming chat and discussions', false),
  ('music', 'Music discussions and sharing', false)
ON CONFLICT (name) DO NOTHING;

-- Create a function to automatically create notifications for new messages
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for other users (simplified - you can enhance this)
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT 
    u.id,
    'message',
    'New message in #' || COALESCE(c.name, 'general'),
    NEW.user_name || ': ' || LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END,
    jsonb_build_object('message_id', NEW.id, 'channel_id', NEW.channel)
  FROM auth.users u
  LEFT JOIN channels c ON c.id::text = NEW.channel
  WHERE u.id != NEW.user_id
  AND u.id IN (
    -- Only notify users who have been active recently
    SELECT user_id FROM user_presence 
    WHERE last_seen > NOW() - INTERVAL '1 day'
  )
  LIMIT 10; -- Limit to prevent spam
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message notifications
DROP TRIGGER IF EXISTS message_notification_trigger ON messages;
CREATE TRIGGER message_notification_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();
