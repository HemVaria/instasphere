# Hugging Face Chatbot Integration

## Overview

This integration adds an AI chatbot powered by Hugging Face to the Instasphere application. The chatbot uses the `gpt2` model for generating responses.

## Setup Instructions

### 1. Hugging Face API Key

1. Create a Hugging Face account at [huggingface.co](https://huggingface.co)
2. Go to your profile → Settings → Access Tokens
3. Generate a new Read token
4. Add the token to your `.env.local` file:

```
HUGGINGFACE_API_KEY="your_token_here"
```

### 2. Supabase Setup (Optional for Chat History)

To store chat history, create a `chat_history` table in your Supabase database:

```sql
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
```

You can run this SQL in the Supabase SQL Editor or use the migration file provided at `supabase/migrations/20230823_create_chat_history.sql`.

## Usage

1. Log in to the Instasphere application
2. Click on the "AI Chatbot" button in the navigation bar
3. Start chatting with the AI!

## Customization

### Changing the AI Model

To use a different Hugging Face model, modify the URL in `app/api/chat/route.ts`:

```typescript
const response = await fetch(
  "https://api-inference.huggingface.co/models/gpt2",
  // ...
);
```

Some recommended alternative models:
- `microsoft/DialoGPT-medium` (better for conversations)
- `google/flan-t5-small` (smaller version of flan-t5)
- `facebook/blenderbot-400M-distill` (specialized for dialogue)

Note: Some models may return responses in different formats, which could require adjustments to the response handling code.

## Troubleshooting

### API Key Issues

If you see an error about the Hugging Face API key not being configured:
1. Check that you've added the key to your `.env.local` file
2. Restart the development server
3. Verify that the key has the correct permissions on Hugging Face

### Model Loading Time

The first request to the Hugging Face API might take longer as the model needs to be loaded. Subsequent requests should be faster.

### Database Errors

If you see foreign key relationship errors in the console:
1. These are related to the chat history storage in Supabase
2. The application has been updated to handle these gracefully
3. Chat functionality will continue to work even if history storage fails
4. To fix the underlying issue, ensure the user is authenticated before storing chat history

## Files Added/Modified

- `app/api/chat/route.ts` - API route for the chatbot (updated to use gpt2 model and handle database errors)
- `components/huggingface/chatbot.tsx` - Chatbot UI component with improved error handling
- `app/chatbot/page.tsx` - Chatbot page
- `components/slidezone/chat-interface.tsx` - Added navigation to chatbot
- `app/page.tsx` - Added chatbot view
- `supabase/migrations/20230823_create_chat_history.sql` - SQL for chat history table
- `HUGGINGFACE_CHATBOT_README.md` - Updated documentation with troubleshooting information