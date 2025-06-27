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
    if (messageType === 'system') return 'terminal-system';
    if (messageType === 'command') return 'terminal-command';
    if (username === currentUser) return 'terminal-success';
    return 'terminal-text';
  };

  const getUsernameStyle = (username: string) => {
    if (username === 'System') return 'terminal-system';
    if (username === currentUser) return 'terminal-user';
    return 'terminal-prompt';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto terminal-content p-4 space-y-1 chat-message">
        {messages.length === 0 && (
          <div className="text-center py-8 terminal-system">
            <div className="mb-4">╭─────────────────────────────────────╮</div>
            <div className="mb-2">│     Welcome to #{currentRoom} chat room      │</div>
            <div className="mb-2">│                                     │</div>
            <div className="mb-2">│  Type a message or /help for help  │</div>
            <div className="mb-4">╰─────────────────────────────────────╯</div>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div key={message.id || index} className="leading-relaxed">
            {message.messageType === 'system' ? (
              <div className="terminal-system">
                <span className="text-gray-600">[{formatTimestamp(message.createdAt)}]</span>
                <span className="ml-2">*** {message.content} ***</span>
              </div>
            ) : message.messageType === 'command' ? (
              <div className="command-output">
                <span className="text-gray-600">[{formatTimestamp(message.createdAt)}]</span>
                <span className="ml-2 terminal-prompt">$</span>
                <span className="ml-2">{message.content}</span>
              </div>
            ) : (
              <div className={getMessageStyle(message.messageType, message.username)}>
                <span className="text-gray-600">[{formatTimestamp(message.createdAt)}]</span>
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
      <div className="panel-bg border-t-2" style={{borderColor: 'var(--terminal-border)'}}>
        <div className="p-3">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="flex items-center text-xs sm:text-sm font-mono">
              <span className="terminal-user">{currentUser}</span>
              <span className="terminal-text">@</span>
              <span className="terminal-prompt">chatserver</span>
              <span className="terminal-text">:</span>
              <span className="terminal-path">~/{currentRoom}</span>
              <span className="terminal-success ml-1">$</span>
              <span className="terminal-cursor ml-1">_</span>
            </div>
            
            <div className="flex w-full sm:flex-1 space-x-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type message or /help..."
                className="flex-1 terminal-input text-sm"
                autoFocus
              />
              
              <button
                type="submit"
                className="terminal-prompt hover:terminal-success transition-colors px-3 py-1 text-sm"
                disabled={!input.trim()}
              >
                →
              </button>
            </div>
          </form>
          
          <div className="mt-2 text-xs terminal-system font-mono">
            <div className="sm:hidden mb-1">
              <span>Rooms: </span>
              <span className="terminal-command">/join general</span>
              <span className="mx-1">•</span>
              <span className="terminal-command">/join tech</span>
              <span className="mx-1">•</span>
              <span className="terminal-command">/join gaming</span>
            </div>
            <span>Commands: /help /users /rooms /join &lt;room&gt; /clear /whoami</span>
          </div>
        </div>
      </div>
    </div>
  );
}