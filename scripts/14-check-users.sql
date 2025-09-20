-- Check existing users and their verification status
-- Run this in your Supabase SQL editor to see what users exist

-- Check all users in auth.users
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC;

-- Check user presence records
SELECT 
    up.user_id,
    up.name,
    up.email,
    up.is_online,
    up.last_seen,
    uv.is_verified,
    uv.verification_level
FROM public.user_presence up
LEFT JOIN public.user_verification uv ON up.user_id = uv.user_id
ORDER BY up.joined_at DESC;

-- Check verification records
SELECT 
    user_id,
    is_verified,
    verification_level,
    verified_at
FROM public.user_verification
ORDER BY verified_at DESC;
