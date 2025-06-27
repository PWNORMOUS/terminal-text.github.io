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
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize default rooms on startup
    this.initializeDefaultRooms();
  }

  private async initializeDefaultRooms() {
    try {
      const existingRooms = await db.select().from(chatRooms);
      if (existingRooms.length === 0) {
        await this.createDefaultRooms();
      }
    } catch (error) {
      console.error('Error initializing default rooms:', error);
    }
  }

  private async createDefaultRooms() {
    const defaultRooms = [
      {
        name: "general",
        description: "General chat room",
        isPrivate: false,
      },
      {
        name: "random",
        description: "Random conversations and off-topic chat",
        isPrivate: false,
      },
      {
        name: "tech",
        description: "Technology and programming discussions",
        isPrivate: false,
      },
      {
        name: "gaming",
        description: "Gaming discussions and finding teammates",
        isPrivate: false,
      },
      {
        name: "help",
        description: "Ask for help and assistance",
        isPrivate: false,
      }
    ];

    for (const room of defaultRooms) {
      await db.insert(chatRooms).values(room);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        isOnline: true,
        lastSeen: new Date(),
      })
      .returning();
    return user;
  }

  async updateUserOnlineStatus(username: string, isOnline: boolean): Promise<void> {
    await db
      .update(users)
      .set({ 
        isOnline, 
        lastSeen: new Date() 
      })
      .where(eq(users.username, username));
  }

  async getOnlineUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isOnline, true));
  }

  // Chat room methods
  async getChatRoom(id: number): Promise<ChatRoom | undefined> {
    const [room] = await db.select().from(chatRooms).where(eq(chatRooms.id, id));
    return room || undefined;
  }

  async getChatRoomByName(name: string): Promise<ChatRoom | undefined> {
    const [room] = await db.select().from(chatRooms).where(eq(chatRooms.name, name));
    return room || undefined;
  }

  async getChatRooms(): Promise<ChatRoom[]> {
    return await db.select().from(chatRooms);
  }

  async createChatRoom(insertRoom: InsertChatRoom): Promise<ChatRoom> {
    const [room] = await db
      .insert(chatRooms)
      .values(insertRoom)
      .returning();
    return room;
  }

  // Chat message methods
  async getMessages(roomId: number, limit: number = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.roomId, roomId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  async createMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }
}

export const storage = new DatabaseStorage();
