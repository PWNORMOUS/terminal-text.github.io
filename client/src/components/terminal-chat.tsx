import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import type { ChatMessage } from "@shared/schema";

interface TerminalChatProps {
  messages: ChatMessage[];
  currentUser: string;
  onSendMessage: (message: string) => void;
  currentRoom: string;
}

export default function TerminalChat({ messages, currentUser, onSendMessage, currentRoom }: TerminalChatProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const formatTimestamp = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getMessageStyle = (messageType: string, username: string) => {
    if (messageType === 'system') return 'text-yellow-400';
    if (messageType === 'command') return 'text-blue-400';
    if (username === currentUser) return 'text-green-400';
    return 'text-white';
  };

  const getUsernameStyle = (username: string) => {
    if (username === 'System') return 'text-yellow-400';
    if (username === currentUser) return 'text-green-400';
    return 'text-blue-400';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-sm">
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <i className="fas fa-terminal text-2xl mb-2 opacity-50"></i>
            <p className="text-sm">Welcome to #{currentRoom}</p>
            <p className="text-xs mt-1">Type a message or use /help for commands</p>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div key={message.id || index} className="leading-relaxed">
            {message.messageType === 'system' ? (
              <div className="text-yellow-400">
                <span className="text-gray-500">[{formatTimestamp(message.createdAt)}]</span>
                <span className="ml-2">*** {message.content} ***</span>
              </div>
            ) : message.messageType === 'command' ? (
              <div className="text-blue-400 whitespace-pre-wrap">
                <span className="text-gray-500">[{formatTimestamp(message.createdAt)}]</span>
                <span className="ml-2 terminal-prompt">$</span>
                <span className="ml-2">{message.content}</span>
              </div>
            ) : (
              <div className={getMessageStyle(message.messageType, message.username)}>
                <span className="text-gray-500">[{formatTimestamp(message.createdAt)}]</span>
                <span className={`ml-2 font-medium ${getUsernameStyle(message.username)}`}>
                  {message.username}:
                </span>
                <span className="ml-2">{message.content}</span>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="panel-bg border-t border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <div className="flex items-center text-sm font-mono">
            <span className="text-green-400">{currentUser}@terminal</span>
            <span className="text-white">:</span>
            <span className="text-blue-400">~/{currentRoom}</span>
            <span className="text-white ml-1">$</span>
          </div>
          
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message or /help for commands..."
            className="flex-1 terminal-bg border border-gray-600 rounded px-3 py-2 text-sm font-mono terminal-text placeholder-gray-500 focus:outline-none focus:border-blue-400"
            autoFocus
          />
          
          <button
            type="submit"
            className="text-gray-400 hover:text-blue-400 transition-colors"
            disabled={!input.trim()}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>
        
        <div className="mt-2 text-xs text-gray-500 font-mono">
          <span>Commands: /help /users /rooms /join &lt;room&gt; /clear /whoami</span>
        </div>
      </div>
    </div>
  );
}