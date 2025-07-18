import { useState, useRef, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import "./chat-interface.css";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Send, ThumbsUp, ThumbsDown } from "lucide-react";
import { getTipOfTheDay } from "@/data/tips";
import { useUser } from "@/context/UserContext";

export function ChatInterface() {
  const { messages, sendMessage, isTyping, provideFeedback } = useChat();
  const { userProfile } = useUser();
  const [input, setInput] = useState("");
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Focus the input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFeedback = (messageId: string, helpful: boolean) => {
    provideFeedback(messageId, helpful);
    setFeedbackGiven(prev => ({ ...prev, [messageId]: true }));
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden">
      <div className="bg-fitness-purple p-3 text-white">
        <h2 className="font-semibold">FitBuddy Chat Assistant</h2>
        <p className="text-xs text-white/80">
          Ask me anything about fitness, workouts, or nutrition!
        </p>
      </div>
      
      {/* Tip of the day */}
      <div className="bg-fitness-pastel-purple p-3 border-b">
        <p className="text-xs font-medium text-fitness-purple-dark">Tip of the day</p>
        <p className="text-sm">
          {getTipOfTheDay(userProfile?.fitnessGoal || "general_fitness")}
        </p>
      </div>
      
      {/* Chat messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex max-w-[80%] ${
                  message.sender === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {message.sender === "assistant" && (
                  <Avatar className="h-8 w-8 mr-2 bg-fitness-purple text-white">
                    <span className="text-xs">AI</span>
                  </Avatar>
                )}
                <div className="space-y-2">
                  <div
                    className={`rounded-lg p-3 ${
                      message.sender === "user"
                        ? "bg-fitness-purple text-white"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <span className="text-xs opacity-70 block mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {message.sender === "assistant" && !feedbackGiven[message.id] && (
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFeedback(message.id, true)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFeedback(message.id, false)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex max-w-[80%] flex-row">
                <Avatar className="h-8 w-8 mr-2 bg-fitness-purple text-white">
                  <span className="text-xs">AI</span>
                </Avatar>
                <div className="rounded-lg p-3 bg-muted">
                  <div className="flex space-x-1">
                    <div className="typing-dot"></div>
                    <div className="typing-dot typing-dot-delay-1"></div>
                    <div className="typing-dot typing-dot-delay-2"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Input area */}
      <div className="p-3 border-t flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 bg-transparent border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-fitness-purple/60"
          disabled={isTyping}
        />
        <Button 
          onClick={handleSend}
          className="ml-2 bg-fitness-purple hover:bg-fitness-purple-dark"
          size="icon"
          disabled={isTyping}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
