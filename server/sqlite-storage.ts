import Database from 'sqlite3';
import { users, keys, type User, type InsertUser, type Key, type InsertKey } from "@shared/schema";
import { IStorage } from './storage';

export class SQLiteStorage implements IStorage {
  private db: Database.Database;
  private dbPath: string;

  constructor(dbPath: string = 'keys.sqlite') {
    this.dbPath = dbPath;
    this.db = new Database.Database(dbPath);
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    // Create users table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    `);

    // Create keys table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        key TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        length INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        used INTEGER DEFAULT 0,
        maxUses INTEGER DEFAULT 1
      )
    `);
  }

  async getUser(id: number): Promise<User | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE id = ?', [id], (err, row: any) => {
        if (err) reject(err);
        else resolve(row || undefined);
      });
    });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE username = ?', [username], (err, row: any) => {
        if (err) reject(err);
        else resolve(row || undefined);
      });
    });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [insertUser.username, insertUser.password],
        function(err) {
          if (err) {
            reject(err);
          } else {
            const newUser: User = {
              id: this.lastID,
              username: insertUser.username,
              password: insertUser.password
            };
            resolve(newUser);
          }
        }
      );
    });
  }

  async createKey(insertKey: InsertKey): Promise<Key> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO keys (name, key, type, length, timestamp, expiresAt, used, maxUses) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          insertKey.name,
          insertKey.key,
          insertKey.type,
          insertKey.length,
          now.toISOString(),
          expiresAt.toISOString(),
          insertKey.used || 0,
          insertKey.maxUses || 1
        ],
        function(err) {
          if (err) {
            reject(err);
          } else {
            const newKey: Key = {
              id: this.lastID,
              name: insertKey.name,
              key: insertKey.key,
              type: insertKey.type,
              length: insertKey.length,
              timestamp: now,
              expiresAt: expiresAt,
              used: insertKey.used || 0,
              maxUses: insertKey.maxUses || 1
            };
            resolve(newKey);
          }
        }
      );
    });
  }

  async getAllKeys(): Promise<Key[]> {
    // Clean up expired keys first
    await this.cleanupExpiredKeys();
    
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM keys ORDER BY timestamp DESC',
        [],
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            const keys = rows.map(row => ({
              ...row,
              timestamp: new Date(row.timestamp),
              expiresAt: new Date(row.expiresAt)
            }));
            resolve(keys);
          }
        }
      );
    });
  }

  async getKeysFromFile(): Promise<{keys: Key[], metadata: {total_keys: number, last_generated: string | null}}> {
    return new Promise((resolve, reject) => {
      const now = new Date();
      this.db.all(
        'SELECT * FROM keys WHERE expiresAt > ? AND used < maxUses ORDER BY timestamp DESC',
        [now.toISOString()],
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            const keys = rows.map(row => ({
              ...row,
              timestamp: new Date(row.timestamp),
              expiresAt: new Date(row.expiresAt)
            }));
            
            resolve({
              keys,
              metadata: {
                total_keys: keys.length,
                last_generated: keys.length > 0 ? keys[0].timestamp.toISOString() : null
              }
            });
          }
        }
      );
    });
  }

  async saveKeysToFile(keys: Key[]): Promise<void> {
    // This method is no longer needed with SQLite, but kept for interface compatibility
    return Promise.resolve();
  }

  async markKeyAsUsed(keyId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE keys SET used = used + 1 WHERE id = ?',
        [keyId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  private async cleanupExpiredKeys(): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = new Date();
      this.db.run(
        'DELETE FROM keys WHERE expiresAt < ?',
        [now.toISOString()],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  close(): void {
    this.db.close();
  }
}