-- Add image fields to posts
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_width INTEGER,
ADD COLUMN IF NOT EXISTS image_height INTEGER;

-- Optional: index if querying by image_url
CREATE INDEX IF NOT EXISTS posts_image_url_idx ON posts((image_url IS NOT NULL));
