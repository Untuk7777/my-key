import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertKeySchema } from "@shared/schema";
import { z } from "zod";
import { randomUUID } from 'crypto';

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Generate a new key
  app.post("/api/keys", async (req, res) => {
    try {
      const { name, type, length } = insertKeySchema.parse(req.body);
      
      let generatedKey: string;
      
      switch (type) {
        case 'uuid':
          generatedKey = randomUUID();
          break;
        case 'hex':
          generatedKey = Array.from({ length }, () => 
            Math.floor(Math.random() * 16).toString(16)
          ).join('');
          break;
        case 'alphanumeric':
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          generatedKey = Array.from({ length }, () => 
            chars.charAt(Math.floor(Math.random() * chars.length))
          ).join('');
          break;
        case 'custom':
          generatedKey = Array.from({ length }, () => 
            Math.floor(Math.random() * 16).toString(16)
          ).join('');
          break;
        default:
          generatedKey = randomUUID();
      }

      const keyData = {
        name,
        key: generatedKey,
        type,
        length: generatedKey.length
      };

      const savedKey = await storage.createKey(keyData);
      res.json(savedKey);
    } catch (error) {
      console.error('Error generating key:', error);
      res.status(400).json({ message: "Failed to generate key" });
    }
  });

  // Get all keys
  app.get("/api/keys", async (req, res) => {
    try {
      const keys = await storage.getAllKeys();
      res.json(keys);
    } catch (error) {
      console.error('Error fetching keys:', error);
      res.status(500).json({ message: "Failed to fetch keys" });
    }
  });

  // Get keys from JSON file
  app.get("/api/keys/file", async (req, res) => {
    try {
      const data = await storage.getKeysFromFile();
      res.json(data);
    } catch (error) {
      console.error('Error reading keys file:', error);
      res.status(500).json({ message: "Failed to read keys file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
