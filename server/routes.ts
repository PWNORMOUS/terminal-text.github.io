import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertChatRoomSchema, insertChatMessageSchema, insertUserSchema } from "@shared/schema";

interface ChatUser {
  ws: WebSocket;
  username: string;
  currentRoom: number;
}

const connectedUsers = new Map<WebSocket, ChatUser>();
const usersByUsername = new Map<string, ChatUser>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Chat Rooms API
  app.get("/api/rooms", async (req, res) => {
    try {
      const rooms = await storage.getChatRooms();
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.post("/api/rooms", async (req, res) => {
    try {
      const roomData = insertChatRoomSchema.parse(req.body);
      const room = await storage.createChatRoom(roomData);
      res.json(room);
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ message: "Failed to create room" });
    }
  });

  // Messages API
  app.get("/api/rooms/:roomId/messages", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const messages = await storage.getMessages(roomId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Users API
  app.get("/api/users/online", async (req, res) => {
    try {
      const users = await storage.getOnlineUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching online users:", error);
      res.status(500).json({ message: "Failed to fetch online users" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for chat communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('Chat client connected');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join':
            await handleUserJoin(ws, message);
            break;
          case 'message':
            await handleChatMessage(ws, message);
            break;
          case 'command':
            await handleCommand(ws, message);
            break;
          case 'join_room':
            await handleJoinRoom(ws, message);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', () => {
      console.log('Chat client disconnected');
      handleUserLeave(ws);
    });
  });

  async function handleUserJoin(ws: WebSocket, message: any) {
    try {
      const { username } = message;
      
      if (!username || username.trim() === '') {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Username is required'
        }));
        return;
      }

      // Check if username is already taken
      if (usersByUsername.has(username)) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Username already taken'
        }));
        return;
      }

      // Create or get user
      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.createUser({ username });
      } else {
        await storage.updateUserOnlineStatus(username, true);
      }

      // Set default room to 'general'
      const generalRoom = await storage.getChatRoomByName('general');
      const currentRoom = generalRoom?.id || 1;

      const chatUser: ChatUser = {
        ws,
        username,
        currentRoom
      };

      connectedUsers.set(ws, chatUser);
      usersByUsername.set(username, chatUser);

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'joined',
        username,
        room: generalRoom?.name || 'general'
      }));

      // Send recent messages
      const messages = await storage.getMessages(currentRoom, 20);
      ws.send(JSON.stringify({
        type: 'message_history',
        messages
      }));

      // Broadcast user joined
      broadcastToRoom(currentRoom, {
        type: 'system_message',
        content: `${username} joined the chat`,
        timestamp: new Date().toISOString()
      }, ws);

      // Send online users
      const onlineUsers = await storage.getOnlineUsers();
      broadcastToAll({
        type: 'users_update',
        users: onlineUsers.map(u => u.username)
      });

    } catch (error) {
      console.error('Error joining user:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to join chat'
      }));
    }
  }

  async function handleChatMessage(ws: WebSocket, message: any) {
    try {
      const user = connectedUsers.get(ws);
      if (!user) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Not authenticated'
        }));
        return;
      }

      const { content } = message;
      if (!content || content.trim() === '') {
        return;
      }

      // Save message to storage
      const chatMessage = await storage.createMessage({
        roomId: user.currentRoom,
        username: user.username,
        content: content.trim(),
        messageType: 'message'
      });

      // Broadcast message to room
      broadcastToRoom(user.currentRoom, {
        type: 'message',
        id: chatMessage.id,
        username: user.username,
        content: chatMessage.content,
        timestamp: chatMessage.createdAt?.toISOString()
      });

    } catch (error) {
      console.error('Error handling message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to send message'
      }));
    }
  }

  async function handleCommand(ws: WebSocket, message: any) {
    try {
      const user = connectedUsers.get(ws);
      if (!user) return;

      const { command, args } = message;

      switch (command) {
        case 'help':
          ws.send(JSON.stringify({
            type: 'command_response',
            content: `Available commands:
/help - Show this help message
/users - List online users
/rooms - List available rooms
/join <room> - Join a different room
/clear - Clear your terminal
/whoami - Show your username`
          }));
          break;

        case 'users':
          const onlineUsers = await storage.getOnlineUsers();
          ws.send(JSON.stringify({
            type: 'command_response',
            content: `Online users (${onlineUsers.length}):
${onlineUsers.map(u => `• ${u.username}`).join('\n')}`
          }));
          break;

        case 'rooms':
          const rooms = await storage.getChatRooms();
          ws.send(JSON.stringify({
            type: 'command_response',
            content: `Available rooms:
${rooms.map(r => `• ${r.name} - ${r.description || 'No description'}`).join('\n')}`
          }));
          break;

        case 'join':
          if (!args || args.length === 0) {
            ws.send(JSON.stringify({
              type: 'command_response',
              content: 'Usage: /join <room_name>'
            }));
            return;
          }
          
          const roomName = args[0];
          const room = await storage.getChatRoomByName(roomName);
          if (!room) {
            ws.send(JSON.stringify({
              type: 'command_response',
              content: `Room '${roomName}' not found`
            }));
            return;
          }

          // Leave current room
          broadcastToRoom(user.currentRoom, {
            type: 'system_message',
            content: `${user.username} left the room`,
            timestamp: new Date().toISOString()
          }, ws);

          // Join new room
          user.currentRoom = room.id;
          
          ws.send(JSON.stringify({
            type: 'room_changed',
            room: room.name
          }));

          // Send recent messages from new room
          const messages = await storage.getMessages(room.id, 20);
          ws.send(JSON.stringify({
            type: 'message_history',
            messages
          }));

          // Broadcast join to new room
          broadcastToRoom(room.id, {
            type: 'system_message',
            content: `${user.username} joined the room`,
            timestamp: new Date().toISOString()
          }, ws);
          break;

        case 'clear':
          ws.send(JSON.stringify({
            type: 'clear_terminal'
          }));
          break;

        case 'whoami':
          ws.send(JSON.stringify({
            type: 'command_response',
            content: `You are: ${user.username}`
          }));
          break;

        default:
          ws.send(JSON.stringify({
            type: 'command_response',
            content: `Unknown command: /${command}. Type /help for available commands.`
          }));
      }

    } catch (error) {
      console.error('Error handling command:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to execute command'
      }));
    }
  }

  async function handleJoinRoom(ws: WebSocket, message: any) {
    try {
      const user = connectedUsers.get(ws);
      if (!user) return;

      const { roomId } = message;
      const room = await storage.getChatRoom(roomId);
      if (!room) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Room not found'
        }));
        return;
      }

      user.currentRoom = roomId;
      
      // Send recent messages
      const messages = await storage.getMessages(roomId, 20);
      ws.send(JSON.stringify({
        type: 'message_history',
        messages
      }));

    } catch (error) {
      console.error('Error joining room:', error);
    }
  }

  function handleUserLeave(ws: WebSocket) {
    const user = connectedUsers.get(ws);
    if (user) {
      // Update user offline status
      storage.updateUserOnlineStatus(user.username, false);
      
      // Broadcast user left
      broadcastToRoom(user.currentRoom, {
        type: 'system_message',
        content: `${user.username} left the chat`,
        timestamp: new Date().toISOString()
      }, ws);

      // Remove from maps
      connectedUsers.delete(ws);
      usersByUsername.delete(user.username);

      // Update online users list
      storage.getOnlineUsers().then(onlineUsers => {
        broadcastToAll({
          type: 'users_update',
          users: onlineUsers.map(u => u.username)
        });
      });
    }
  }

  function broadcastToRoom(roomId: number, message: any, excludeWs?: WebSocket) {
    for (const [ws, user] of connectedUsers.entries()) {
      if (user.currentRoom === roomId && ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    }
  }

  function broadcastToAll(message: any, excludeWs?: WebSocket) {
    for (const [ws] of connectedUsers.entries()) {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    }
  }

  return httpServer;
}
