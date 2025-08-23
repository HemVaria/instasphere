"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";

interface Message {
  sender: "You" | "Bot";
  text: string;
}

export function HuggingFaceChatbot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg: Message = { sender: "You", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text }),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        throw new Error("Invalid response format from server");
      }
      
      if (res.ok) {
        const botMsg: Message = { sender: "Bot", text: data.reply };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const errorMsg: Message = { 
          sender: "Bot", 
          text: `Error: ${data.error || "Failed to get response"}` 
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMsg: Message = { 
        sender: "Bot", 
        text: "Sorry, there was an error communicating with the chatbot. Please check your API key configuration." 
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">🤖 HuggingFace Chatbot</h2>
        <p className="text-sm text-muted-foreground">Ask me anything!</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-center">
              No messages yet. Start a conversation!
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div 
              key={i} 
              className={`flex ${msg.sender === "You" ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`flex gap-3 max-w-[80%] ${msg.sender === "You" ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="h-8 w-8">
                  {msg.sender === "You" ? (
                    <AvatarImage src="/placeholder-user.jpg" alt="Your avatar" />
                  ) : (
                    <AvatarImage src="/placeholder-logo.png" alt="Bot avatar" />
                  )}
                  <AvatarFallback>
                    {msg.sender === "You" ? "You" : "Bot"}
                  </AvatarFallback>
                </Avatar>
                <div 
                  className={`rounded-lg p-3 ${msg.sender === "You" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"}`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-logo.png" alt="Bot avatar" />
                <AvatarFallback>Bot</AvatarFallback>
              </Avatar>
              <div className="rounded-lg p-3 bg-muted">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce delay-75" />
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce delay-150" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}