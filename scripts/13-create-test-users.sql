-- Create test users for DM testing
-- This script creates some test users that you can use to test direct messaging

-- Insert test users into auth.users (you'll need to do this through Supabase Auth UI or API)
-- For now, let's create user_presence records for existing users

-- First, let's see what users exist
-- You can run this query in your Supabase SQL editor to see existing users:
-- SELECT id, email, created_at FROM auth.users;

-- Insert test user presence records (replace the UUIDs with actual user IDs from auth.users)
-- You'll need to get these from your Supabase Auth dashboard

-- Example test users (replace these UUIDs with real ones from your auth.users table):
INSERT INTO public.user_presence (
    user_id,
    name,
    email,
    avatar_url,
    is_online,
    last_seen,
    joined_at
) VALUES 
    -- Replace these UUIDs with actual user IDs from your auth.users table
    ('00000000-0000-0000-0000-000000000001', 'Alice Johnson', 'alice@example.com', '/placeholder.svg', true, now(), now()),
    ('00000000-0000-0000-0000-000000000002', 'Bob Smith', 'bob@example.com', '/placeholder.svg', true, now(), now()),
    ('00000000-0000-0000-0000-000000000003', 'Carol Davis', 'carol@example.com', '/placeholder.svg', false, now() - interval '1 hour', now())
ON CONFLICT (user_id) DO NOTHING;

-- Insert verification records for test users
INSERT INTO public.user_verification (
    user_id,
    is_verified,
    verification_level,
    verified_at,
    verified_by
) VALUES 
    ('00000000-0000-0000-0000-000000000001', true, 'email_verified', now(), '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000002', true, 'email_verified', now(), '00000000-0000-0000-0000-000000000002'),
    ('00000000-0000-0000-0000-000000000003', true, 'phone_verified', now(), '00000000-0000-0000-0000-000000000003')
ON CONFLICT (user_id) DO NOTHING;

-- Note: You'll need to replace the UUIDs above with actual user IDs from your auth.users table
-- To get your current user ID, run this query in Supabase SQL editor:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
