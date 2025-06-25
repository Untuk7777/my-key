import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";


import { randomUUID } from 'crypto';

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Generate a new key
  app.post("/api/keys", async (req, res) => {
    try {
      console.log("Request body:", req.body);
      const { name, type, length } = req.body;
      
      let generatedKey: string;
      
      // Generate random lowercase letters for the suffix (5 characters max to keep total under 10)
      const generateRandomSuffix = (maxLength: number) => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        const suffixLength = Math.min(maxLength, 5); // Keep it short
        return Array.from({ length: suffixLength }, () => 
          chars.charAt(Math.floor(Math.random() * chars.length))
        ).join('');
      };
      
      switch (type) {
        case 'uuid':
          generatedKey = 'FREE_' + generateRandomSuffix(5);
          break;
        case 'hex':
          generatedKey = 'FREE_' + generateRandomSuffix(5);
          break;
        case 'alphanumeric':
          generatedKey = 'FREE_' + generateRandomSuffix(5);
          break;
        case 'custom':
          // For custom, respect the length but cap at 10 total
          const customSuffixLength = Math.min(length - 5, 5); // Subtract 5 for "FREE_"
          generatedKey = 'FREE_' + generateRandomSuffix(customSuffixLength);
          break;
        default:
          generatedKey = 'FREE_' + generateRandomSuffix(5);
      }

      // Set expiration to 1 day from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1);

      const keyData = {
        name: name || "Unnamed Key",
        key: generatedKey,
        type: type || "uuid",
        length: generatedKey.length,
        expiresAt
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

  // Roblox key validation endpoint
  app.post("/api/validate", async (req, res) => {
    try {
      const { key } = req.body;
      
      if (!key) {
        return res.json({
          success: false,
          message: "Key is required",
          valid: false
        });
      }

      const allKeys = await storage.getAllKeys();
      const foundKey = allKeys.find(k => k.key === key);
      
      if (!foundKey) {
        return res.json({
          success: false,
          message: "Invalid key",
          valid: false
        });
      }

      // Check if key is expired
      const now = new Date();
      if (new Date(foundKey.expiresAt) < now) {
        return res.json({
          success: false,
          message: "Key has expired",
          valid: false,
          expired: true
        });
      }

      res.json({
        success: true,
        message: "Key is valid",
        valid: true,
        keyData: {
          name: foundKey.name,
          type: foundKey.type,
          created: foundKey.timestamp,
          expires: foundKey.expiresAt
        }
      });
    } catch (error) {
      console.error('Error validating key:', error);
      res.status(500).json({
        success: false,
        message: "Server error",
        valid: false
      });
    }
  });

  // Generate key endpoint for Roblox
  app.post("/api/generate", async (req, res) => {
    try {
      const keyName = req.body.name || "Roblox Key";
      
      // Set expiration to 1 day from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1);

      // Generate lowercase gibberish after FREE_
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      const suffix = Array.from({ length: 5 }, () => 
        chars.charAt(Math.floor(Math.random() * chars.length))
      ).join('');
      
      const generatedKey = 'FREE_' + suffix;

      const keyData = {
        name: keyName,
        key: generatedKey,
        type: 'roblox',
        length: generatedKey.length,
        expiresAt
      };

      const savedKey = await storage.createKey(keyData);
      
      res.json({
        success: true,
        message: "Key generated successfully",
        key: savedKey.key,
        expires: savedKey.expiresAt,
        name: savedKey.name
      });
    } catch (error) {
      console.error('Error generating key for Roblox:', error);
      res.status(500).json({
        success: false,
        message: "Failed to generate key"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
