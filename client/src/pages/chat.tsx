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
          const sortedMessages = (message.messages || []).sort((a: ChatMessage, b: ChatMessage) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeA - timeB;
          });
          setMessages(sortedMessages);
          break;

        case 'message':
          setMessages(prev => {
            const newMessage = {
              id: message.id,
              roomId: 0, // We'll handle this on the server
              username: message.username,
              content: message.content,
              messageType: 'message',
              createdAt: new Date(message.timestamp)
            };
            const updated = [...prev, newMessage];
            // Sort to ensure proper order
            return updated.sort((a, b) => {
              const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return timeA - timeB;
            });
          });
          break;

        case 'system_message':
          setMessages(prev => {
            const newMessage = {
              id: Date.now(),
              roomId: 0,
              username: 'System',
              content: message.content,
              messageType: 'system',
              createdAt: new Date(message.timestamp)
            };
            const updated = [...prev, newMessage];
            return updated.sort((a, b) => {
              const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return timeA - timeB;
            });
          });
          break;

        case 'command_response':
          setMessages(prev => {
            const newMessage = {
              id: Date.now(),
              roomId: 0,
              username: 'System',
              content: message.content,
              messageType: 'command',
              createdAt: new Date()
            };
            const updated = [...prev, newMessage];
            return updated.sort((a, b) => {
              const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return timeA - timeB;
            });
          });
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
      <div className="h-screen terminal-bg terminal-text flex items-center justify-center p-2 sm:p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-4 sm:mb-8">
            <h1 className="text-xl sm:text-3xl font-bold terminal-success mb-2 chat-message">Terminal Chat</h1>
            <p className="text-sm sm:text-base terminal-system">Join the conversation in a terminal-style interface</p>
          </div>
          
          <UsernameForm 
            onJoin={handleJoin}
            isConnected={isConnected}
          />
          
          <div className="mt-4 sm:mt-6 text-center">
            <div className="flex items-center justify-center space-x-2 text-sm terminal-text chat-message">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'status-online' : 'status-offline'} ${!isConnected ? 'status-connecting' : ''}`}></div>
              <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen terminal-bg terminal-text overflow-hidden p-1 sm:p-4">
      <div className="terminal-window h-full flex flex-col">
        {/* Terminal Header */}
        <div className="terminal-header">
          <button className="terminal-button close"></button>
          <button className="terminal-button minimize"></button>
          <button className="terminal-button maximize"></button>
          <span className="terminal-title hidden sm:inline">Terminal Chat - {user.username}@chatserver:~/{currentRoom}</span>
          <span className="terminal-title sm:hidden text-xs">{user.username}@{currentRoom}</span>
          <div className="ml-auto flex items-center space-x-1 sm:space-x-3 text-xs">
            <div className="flex items-center space-x-1">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'status-online' : 'status-offline'} ${!isConnected ? 'status-connecting' : ''}`}></div>
              <span className={`hidden sm:inline ${isConnected ? 'status-online' : 'status-offline'}`}>
                {isConnected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Sidebar - collapsible on mobile */}
          <aside className="w-full lg:w-80 panel-bg border-b lg:border-r lg:border-b-0 border-gray-800 flex flex-col overflow-hidden max-h-32 lg:max-h-none">
            <div className="lg:hidden">
              <OnlineUsers users={onlineUsers} currentUser={user.username} />
            </div>
            <div className="hidden lg:block">
              <OnlineUsers users={onlineUsers} currentUser={user.username} />
              <RoomsList 
                rooms={rooms}
                currentRoom={currentRoom}
                onJoinRoom={handleJoinRoom}
              />
            </div>
          </aside>

          {/* Main Chat Area */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <TerminalChat 
              messages={messages}
              currentUser={user.username}
              onSendMessage={handleSendMessage}
              currentRoom={currentRoom}
            />
          </main>
        </div>
      </div>
    </div>
  );
}