import { users, keys, type User, type InsertUser, type Key, type InsertKey } from "@shared/schema";
import { SQLiteStorage } from './sqlite-storage';

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createKey(key: InsertKey): Promise<Key>;
  getAllKeys(): Promise<Key[]>;
  getKeysFromFile(): Promise<{keys: Key[], metadata: {total_keys: number, last_generated: string | null}}>;
  saveKeysToFile(keys: Key[]): Promise<void>;
  markKeyAsUsed(keyId: number): Promise<void>;
  clearAllKeys(): Promise<void>;
}

export const storage = new SQLiteStorage();
