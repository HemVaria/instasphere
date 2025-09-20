-- Enable the necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  avatar_url TEXT,
  likes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post_comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  avatar_url TEXT,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post_likes table to track user likes
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id),
  UNIQUE(comment_id, user_id),
  CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts(user_id);
CREATE INDEX IF NOT EXISTS posts_likes_idx ON posts(likes DESC);

CREATE INDEX IF NOT EXISTS post_comments_post_id_idx ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS post_comments_parent_id_idx ON post_comments(parent_id);
CREATE INDEX IF NOT EXISTS post_comments_created_at_idx ON post_comments(created_at ASC);

CREATE INDEX IF NOT EXISTS post_likes_post_id_idx ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS post_likes_comment_id_idx ON post_likes(comment_id);
CREATE INDEX IF NOT EXISTS post_likes_user_id_idx ON post_likes(user_id);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for posts (allow all operations for now)
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create posts" ON posts;
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update posts" ON posts;
CREATE POLICY "Users can update posts" ON posts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete posts" ON posts;
CREATE POLICY "Users can delete posts" ON posts FOR DELETE USING (true);

-- Create policies for post_comments (allow all operations for now)
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON post_comments;
CREATE POLICY "Comments are viewable by everyone" ON post_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON post_comments;
CREATE POLICY "Users can create comments" ON post_comments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update comments" ON post_comments;
CREATE POLICY "Users can update comments" ON post_comments FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete comments" ON post_comments;
CREATE POLICY "Users can delete comments" ON post_comments FOR DELETE USING (true);

-- Create policies for post_likes (allow all operations for now)
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON post_likes;
CREATE POLICY "Likes are viewable by everyone" ON post_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage likes" ON post_likes;
CREATE POLICY "Users can manage likes" ON post_likes FOR ALL USING (true);

-- Enable real-time for posts tables
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE post_likes;

-- Create function to update comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET comments_count = GREATEST(0, comments_count - 1) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for comment count
DROP TRIGGER IF EXISTS post_comments_count_trigger ON post_comments;
CREATE TRIGGER post_comments_count_trigger
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- Insert some sample posts for testing
INSERT INTO posts (title, content, user_id, user_name, avatar_url, likes, shares) VALUES 
  ('Welcome to the Feed!', 'This is the first post in our new Reddit-style feed. Share your thoughts, ideas, and connect with the community!', 
   '00000000-0000-0000-0000-000000000001', 'System', null, 5, 2),
  ('Tips for Better Communication', 'Here are some great tips for effective online communication:\n\n1. Be respectful and kind\n2. Listen actively to others\n3. Ask questions when you need clarification\n4. Share your experiences\n\nWhat other tips would you add?', 
   '00000000-0000-0000-0000-000000000002', 'Community Manager', null, 12, 4),
  ('Exciting New Features Coming Soon', 'We''re working on some amazing new features for the platform. Stay tuned for updates on:\n\n• Enhanced notifications\n• Better search functionality\n• Custom themes\n• Mobile app improvements', 
   '00000000-0000-0000-0000-000000000003', 'Development Team', null, 8, 1)
ON CONFLICT DO NOTHING;

-- Insert some sample comments
INSERT INTO post_comments (post_id, content, user_id, user_name, likes) 
SELECT 
  p.id,
  'This is awesome! Thanks for setting up the feed feature.',
  '00000000-0000-0000-0000-000000000004',
  'Beta Tester',
  3
FROM posts p 
WHERE p.title = 'Welcome to the Feed!'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO post_comments (post_id, content, user_id, user_name, likes) 
SELECT 
  p.id,
  'Great tips! I would also add: be patient with others and assume good intentions.',
  '00000000-0000-0000-0000-000000000005',
  'Helpful User',
  7
FROM posts p 
WHERE p.title = 'Tips for Better Communication'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Update comments count for posts with comments
UPDATE posts SET comments_count = (
  SELECT COUNT(*) FROM post_comments WHERE post_comments.post_id = posts.id
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Posts migration completed successfully!';
  RAISE NOTICE '📝 Created tables: posts, post_comments, post_likes';
  RAISE NOTICE '🔧 Set up triggers and policies';
  RAISE NOTICE '📊 Inserted sample data';
  RAISE NOTICE '🎉 Feed is now ready to use!';
END $$;
