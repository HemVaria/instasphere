-- Create direct_messages table
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    sender_name TEXT NOT NULL,
    receiver_name TEXT NOT NULL,
    sender_avatar TEXT,
    receiver_avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_receiver ON public.direct_messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver_sender ON public.direct_messages(receiver_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON public.direct_messages(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see messages where they are either sender or receiver
CREATE POLICY "Users can view their own direct messages" ON public.direct_messages
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

-- Users can only insert messages where they are the sender
CREATE POLICY "Users can send direct messages" ON public.direct_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
    );

-- Users can only delete their own sent messages
CREATE POLICY "Users can delete their own sent messages" ON public.direct_messages
    FOR DELETE USING (
        auth.uid() = sender_id
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_direct_messages_updated_at
    BEFORE UPDATE ON public.direct_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;
