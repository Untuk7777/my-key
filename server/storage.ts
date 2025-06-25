import { users, keys, type User, type InsertUser, type Key, type InsertKey } from "@shared/schema";
import fs from 'fs/promises';
import path from 'path';

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createKey(key: InsertKey): Promise<Key>;
  getAllKeys(): Promise<Key[]>;
  getKeysFromFile(): Promise<{keys: Key[], metadata: {total_keys: number, last_generated: string | null}}>;
  saveKeysToFile(keys: Key[]): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private keys: Map<number, Key>;
  private currentUserId: number;
  private currentKeyId: number;
  private keysFilePath: string;

  constructor() {
    this.users = new Map();
    this.keys = new Map();
    this.currentUserId = 1;
    this.currentKeyId = 1;
    this.keysFilePath = path.join(process.cwd(), 'keys.json');
    this.initializeKeysFile();
  }

  private async initializeKeysFile(): Promise<void> {
    try {
      await fs.access(this.keysFilePath);
    } catch {
      // File doesn't exist, create it
      const initialData = {
        keys: [],
        metadata: {
          total_keys: 0,
          last_generated: null
        }
      };
      await fs.writeFile(this.keysFilePath, JSON.stringify(initialData, null, 2));
    }
  }

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
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createKey(insertKey: InsertKey): Promise<Key> {
    const id = this.currentKeyId++;
    const key: Key = { ...insertKey, id, timestamp: new Date() };
    this.keys.set(id, key);
    
    // Also save to JSON file
    const allKeys = Array.from(this.keys.values());
    await this.saveKeysToFile(allKeys);
    
    return key;
  }

  async getAllKeys(): Promise<Key[]> {
    return Array.from(this.keys.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getKeysFromFile(): Promise<{keys: Key[], metadata: {total_keys: number, last_generated: string | null}}> {
    try {
      const fileContent = await fs.readFile(this.keysFilePath, 'utf-8');
      const data = JSON.parse(fileContent);
      return data;
    } catch (error) {
      return {
        keys: [],
        metadata: {
          total_keys: 0,
          last_generated: null
        }
      };
    }
  }

  async saveKeysToFile(keys: Key[]): Promise<void> {
    const data = {
      keys,
      metadata: {
        total_keys: keys.length,
        last_generated: keys.length > 0 ? keys[keys.length - 1].timestamp.toISOString() : null
      }
    };
    await fs.writeFile(this.keysFilePath, JSON.stringify(data, null, 2));
  }
}

export const storage = new MemStorage();
