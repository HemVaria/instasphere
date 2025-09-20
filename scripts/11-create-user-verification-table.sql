-- Create user_verification table for user authentication and verification
CREATE TABLE IF NOT EXISTS public.user_verification (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_level TEXT DEFAULT 'unverified' CHECK (verification_level IN ('unverified', 'email_verified', 'phone_verified', 'identity_verified')),
    verification_method TEXT,
    verification_code TEXT,
    verification_code_expires_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    identity_verified BOOLEAN DEFAULT FALSE,
    phone_number TEXT,
    identity_document_type TEXT,
    identity_document_number TEXT,
    verification_attempts INTEGER DEFAULT 0,
    max_verification_attempts INTEGER DEFAULT 3,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_verification_user_id ON public.user_verification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verification_is_verified ON public.user_verification(is_verified);
CREATE INDEX IF NOT EXISTS idx_user_verification_level ON public.user_verification(verification_level);
CREATE INDEX IF NOT EXISTS idx_user_verification_verified_at ON public.user_verification(verified_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_verification ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own verification status
CREATE POLICY "Users can view their own verification status" ON public.user_verification
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- Users can update their own verification status (for self-verification)
CREATE POLICY "Users can update their own verification" ON public.user_verification
    FOR UPDATE USING (
        auth.uid() = user_id
    );

-- Admins can view all verification records
CREATE POLICY "Admins can view all verification records" ON public.user_verification
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Admins can insert verification records
CREATE POLICY "Admins can insert verification records" ON public.user_verification
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Admins can update any verification record
CREATE POLICY "Admins can update verification records" ON public.user_verification
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Create function to automatically create verification record for new users
CREATE OR REPLACE FUNCTION create_user_verification_record()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_verification (user_id, is_verified, verification_level)
    VALUES (NEW.id, FALSE, 'unverified')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create verification record when user signs up
CREATE TRIGGER create_user_verification_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_verification_record();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_verification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_verification_updated_at
    BEFORE UPDATE ON public.user_verification
    FOR EACH ROW
    EXECUTE FUNCTION update_user_verification_updated_at();

-- Insert default verification records for existing users
INSERT INTO public.user_verification (user_id, is_verified, verification_level, verified_at)
SELECT 
    id,
    TRUE,
    'email_verified',
    timezone('utc'::text, now())
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_verification)
ON CONFLICT (user_id) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON public.user_verification TO authenticated;
GRANT ALL ON public.user_verification TO service_role;
