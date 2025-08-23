"use client";

import { HuggingFaceChatbot } from "@/components/huggingface/chatbot";

export default function ChatbotPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto h-[600px]">
        <HuggingFaceChatbot />
      </div>
    </div>
  );
}