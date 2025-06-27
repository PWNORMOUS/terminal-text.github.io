import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import UsernameForm from "@/components/username-form";
import TerminalChat from "@/components/terminal-chat";
import OnlineUsers from "@/components/online-users";
import RoomsList from "@/components/rooms-list";
import { useToast } from "@/hooks/use-toast";
import type { ChatRoom, ChatMessage } from "@shared/schema";

interface ChatUser {
  username: string;
  currentRoom: string;
  isJoined: boolean;
}

export default function Chat() {
  const [user, setUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string>('general');
  const { toast } = useToast();

  const { data: rooms = [] } = useQuery({
    queryKey: ["/api/rooms"],
  });

  const { socket, isConnected } = useWebSocket({
    onMessage: (message) => {
      switch (message.type) {
        case 'joined':
          setUser({
            username: message.username,
            currentRoom: message.room,
            isJoined: true
          });
          setCurrentRoom(message.room);
          toast({
            title: "Connected",
            description: `Welcome to ${message.room}!`,
          });
          break;

        case 'message_history':
          setMessages(message.messages || []);
          break;

        case 'message':
          setMessages(prev => [...prev, {
            id: message.id,
            roomId: 0, // We'll handle this on the server
            username: message.username,
            content: message.content,
            messageType: 'message',
            createdAt: new Date(message.timestamp)
          }]);
          break;

        case 'system_message':
          setMessages(prev => [...prev, {
            id: Date.now(),
            roomId: 0,
            username: 'System',
            content: message.content,
            messageType: 'system',
            createdAt: new Date(message.timestamp)
          }]);
          break;

        case 'command_response':
          setMessages(prev => [...prev, {
            id: Date.now(),
            roomId: 0,
            username: 'System',
            content: message.content,
            messageType: 'command',
            createdAt: new Date()
          }]);
          break;

        case 'room_changed':
          setCurrentRoom(message.room);
          setMessages([]); // Clear messages when changing rooms
          toast({
            title: "Room Changed",
            description: `Switched to ${message.room}`,
          });
          break;

        case 'clear_terminal':
          setMessages([]);
          break;

        case 'users_update':
          setOnlineUsers(message.users || []);
          break;

        case 'error':
          toast({
            title: "Error",
            description: message.message,
            variant: "destructive",
          });
          break;
      }
    }
  });

  const handleJoin = (username: string) => {
    if (!socket) {
      toast({
        title: "Connection Error",
        description: "WebSocket not connected",
        variant: "destructive",
      });
      return;
    }

    socket.send(JSON.stringify({
      type: 'join',
      username
    }));
  };

  const handleSendMessage = (content: string) => {
    if (!socket || !user) return;

    if (content.startsWith('/')) {
      // Handle command
      const parts = content.slice(1).split(' ');
      const command = parts[0];
      const args = parts.slice(1);

      socket.send(JSON.stringify({
        type: 'command',
        command,
        args
      }));
    } else {
      // Regular message
      socket.send(JSON.stringify({
        type: 'message',
        content
      }));
    }
  };

  const handleJoinRoom = (roomName: string) => {
    if (!socket) return;
    
    socket.send(JSON.stringify({
      type: 'command',
      command: 'join',
      args: [roomName]
    }));
  };

  if (!user?.isJoined) {
    return (
      <div className="h-screen bg-terminal-bg text-terminal-text flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Terminal Chat</h1>
            <p className="text-gray-400">Join the conversation in a terminal-style interface</p>
          </div>
          
          <UsernameForm 
            onJoin={handleJoin}
            isConnected={isConnected}
          />
          
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${!isConnected ? 'animate-pulse' : ''}`}></div>
              <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-terminal-bg text-terminal-text overflow-hidden">
      {/* Header */}
      <header className="panel-bg border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <i className="fas fa-comments accent-blue text-xl"></i>
          <h1 className="text-lg font-semibold text-white">Terminal Chat</h1>
          <span className="text-sm text-gray-400">#{currentRoom}</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${!isConnected ? 'animate-pulse' : ''}`}></div>
            <span className="text-sm text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div className="text-sm text-gray-400">
            <span className="terminal-prompt">@{user.username}</span>
          </div>
        </div>
      </header>

      <div className="flex h-full">
        {/* Sidebar */}
        <aside className="w-80 panel-bg border-r border-gray-700 flex flex-col h-full">
          <OnlineUsers users={onlineUsers} currentUser={user.username} />
          <RoomsList 
            rooms={rooms}
            currentRoom={currentRoom}
            onJoinRoom={handleJoinRoom}
          />
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col h-full">
          <TerminalChat 
            messages={messages}
            currentUser={user.username}
            onSendMessage={handleSendMessage}
            currentRoom={currentRoom}
          />
        </main>
      </div>
    </div>
  );
}