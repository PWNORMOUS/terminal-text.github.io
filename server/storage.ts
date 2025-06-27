import { 
  users, 
  chatRooms, 
  chatMessages,
  type User, 
  type InsertUser, 
  type ChatRoom, 
  type InsertChatRoom,
  type ChatMessage,
  type InsertChatMessage
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserOnlineStatus(username: string, isOnline: boolean): Promise<void>;
  getOnlineUsers(): Promise<User[]>;
  
  // Chat room methods
  getChatRoom(id: number): Promise<ChatRoom | undefined>;
  getChatRoomByName(name: string): Promise<ChatRoom | undefined>;
  getChatRooms(): Promise<ChatRoom[]>;
  createChatRoom(room: InsertChatRoom): Promise<ChatRoom>;
  
  // Chat message methods
  getMessages(roomId: number, limit?: number): Promise<ChatMessage[]>;
  createMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private chatRooms: Map<number, ChatRoom>;
  private chatMessages: Map<number, ChatMessage>;
  private currentUserId: number;
  private currentRoomId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.chatRooms = new Map();
    this.chatMessages = new Map();
    this.currentUserId = 1;
    this.currentRoomId = 1;
    this.currentMessageId = 1;

    // Create default room
    this.createDefaultRoom();
  }

  private createDefaultRoom() {
    const defaultRoom: ChatRoom = {
      id: this.currentRoomId++,
      name: "general",
      description: "General chat room",
      isPrivate: false,
      createdAt: new Date(),
    };
    this.chatRooms.set(defaultRoom.id, defaultRoom);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      id,
      username: insertUser.username,
      displayName: insertUser.displayName || null,
      isOnline: true,
      lastSeen: new Date(),
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserOnlineStatus(username: string, isOnline: boolean): Promise<void> {
    const user = await this.getUserByUsername(username);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date();
      this.users.set(user.id, user);
    }
  }

  async getOnlineUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.isOnline);
  }

  // Chat room methods
  async getChatRoom(id: number): Promise<ChatRoom | undefined> {
    return this.chatRooms.get(id);
  }

  async getChatRoomByName(name: string): Promise<ChatRoom | undefined> {
    return Array.from(this.chatRooms.values()).find(room => room.name === name);
  }

  async getChatRooms(): Promise<ChatRoom[]> {
    return Array.from(this.chatRooms.values());
  }

  async createChatRoom(insertRoom: InsertChatRoom): Promise<ChatRoom> {
    const id = this.currentRoomId++;
    const room: ChatRoom = {
      id,
      name: insertRoom.name,
      description: insertRoom.description || null,
      isPrivate: insertRoom.isPrivate || false,
      createdAt: new Date(),
    };
    this.chatRooms.set(id, room);
    return room;
  }

  // Chat message methods
  async getMessages(roomId: number, limit: number = 50): Promise<ChatMessage[]> {
    const messages = Array.from(this.chatMessages.values())
      .filter(message => message.roomId === roomId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0))
      .slice(-limit);
    return messages;
  }

  async createMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentMessageId++;
    const message: ChatMessage = {
      id,
      roomId: insertMessage.roomId,
      username: insertMessage.username,
      content: insertMessage.content,
      messageType: insertMessage.messageType || 'message',
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }
}

export const storage = new MemStorage();
