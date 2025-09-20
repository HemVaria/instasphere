-- Update direct_messages table to include verification checks
ALTER TABLE public.direct_messages 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_direct_messages_is_deleted ON public.direct_messages(is_deleted);
CREATE INDEX IF NOT EXISTS idx_direct_messages_deleted_at ON public.direct_messages(deleted_at);

-- Update RLS policies to include verification checks
DROP POLICY IF EXISTS "Users can view their own direct messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can send direct messages" ON public.direct_messages;

-- New policy: Users can only view messages between verified users
CREATE POLICY "Verified users can view their direct messages" ON public.direct_messages
    FOR SELECT USING (
        (auth.uid() = sender_id OR auth.uid() = receiver_id)
        AND is_deleted = FALSE
        AND EXISTS (
            SELECT 1 FROM public.user_verification 
            WHERE user_id = sender_id AND is_verified = TRUE
        )
        AND EXISTS (
            SELECT 1 FROM public.user_verification 
            WHERE user_id = receiver_id AND is_verified = TRUE
        )
    );

-- New policy: Only verified users can send direct messages
CREATE POLICY "Verified users can send direct messages" ON public.direct_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM public.user_verification 
            WHERE user_id = sender_id AND is_verified = TRUE
        )
        AND EXISTS (
            SELECT 1 FROM public.user_verification 
            WHERE user_id = receiver_id AND is_verified = TRUE
        )
    );

-- Policy: Users can soft delete their own messages
CREATE POLICY "Users can delete their own direct messages" ON public.direct_messages
    FOR UPDATE USING (
        auth.uid() = sender_id
        AND is_deleted = FALSE
    )
    WITH CHECK (
        auth.uid() = sender_id
        AND (is_deleted = TRUE OR is_deleted = FALSE)
    );

-- Create function to handle message deletion
CREATE OR REPLACE FUNCTION soft_delete_direct_message()
RETURNS TRIGGER AS $$
BEGIN
    -- If marking as deleted, set deletion timestamp
    IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
        NEW.deleted_at = timezone('utc'::text, now());
        NEW.deleted_by = auth.uid();
        NEW.content = '[Message deleted]';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for soft delete
CREATE TRIGGER soft_delete_direct_message_trigger
    BEFORE UPDATE ON public.direct_messages
    FOR EACH ROW
    EXECUTE FUNCTION soft_delete_direct_message();

-- Create view for active (non-deleted) direct messages
CREATE OR REPLACE VIEW active_direct_messages AS
SELECT *
FROM public.direct_messages
WHERE is_deleted = FALSE;

-- Grant permissions on the view
GRANT SELECT ON active_direct_messages TO authenticated;
GRANT SELECT ON active_direct_messages TO service_role;
