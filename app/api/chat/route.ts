import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Check if Hugging Face API key is available
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Hugging Face API key not configured" },
        { status: 500 }
      );
    }

    // Call Hugging Face API - using a simpler model that's more likely to work
    const response = await fetch(
      "https://api-inference.huggingface.co/models/gpt2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          inputs: message,
          parameters: {
            max_new_tokens: 80,
            temperature: 0.8,
            top_p: 0.95,
            return_full_text: false,
          },
          options: {
            wait_for_model: true, // avoids 503 when the model is cold
          },
        }),
      }
    );

    if (!response.ok) {
      // Try to parse the error body to surface helpful details to the client
      let detail = "";
      try {
        const errJson = await response.json();
        detail = (errJson && (errJson.error || errJson.message)) ? (errJson.error || errJson.message) : JSON.stringify(errJson);
      } catch (_) {
        try {
          detail = await response.text();
        } catch (_) {
          detail = "Unknown error";
        }
      }
      console.error("Hugging Face API error:", response.status, detail);
      const clientMessage = `Hugging Face API error (${response.status})${detail ? ": " + detail : ""}`;
      return NextResponse.json(
        { error: clientMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    let reply = "Sorry, I couldn't generate a response";
    
    // Handle different response formats from Hugging Face
    // GPT-2 typically returns an object with generated_text property
    if (Array.isArray(data) && data[0]?.generated_text) {
      reply = data[0].generated_text;
    } else if (data.generated_text) {
      reply = data.generated_text;
    } else if (typeof data === 'string') {
      // Some models might return plain text
      reply = data;
    } else {
      // For any other format, stringify the response
      console.log('Unexpected response format:', data);
      reply = JSON.stringify(data);
    }

    // Store conversation in Supabase if possible, but don't block the response
    // We'll make this non-blocking so API errors don't affect the user experience
    const saveToSupabase = async () => {
      try {
        // Check if user is authenticated before inserting
        const { data: { session } } = await supabase.auth.getSession();
        
        // Only try to insert if we have a session
        if (session) {
          await supabase.from("chat_history").insert([
            { user_message: message, bot_reply: reply }
          ]);
        }
      } catch (error) {
        // If table doesn't exist or there's a foreign key error, just log it
        console.error("Failed to save chat to Supabase:", error);
        // This won't affect the user experience
      }
    };
    
    // Fire and forget - don't await this
    saveToSupabase();

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process request" },
      { status: 500 }
    );
  }
}