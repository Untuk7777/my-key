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
      
      // Generate bash-style key: FREE-9f2d7c1a3e-bd4f7a29
      const generateHexSegment = (length: number) => {
        const chars = '0123456789abcdef';
        return Array.from({ length }, () => 
          chars.charAt(Math.floor(Math.random() * chars.length))
        ).join('');
      };
      
      const segment1 = generateHexSegment(10); // 10 hex chars
      const segment2 = generateHexSegment(8);  // 8 hex chars
      generatedKey = `FREE-${segment1}-${segment2}`;

      // Set expiration to 1 day from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1);

      const keyData = {
        name: name || "Unnamed Key",
        key: generatedKey,
        type: "bash",
        length: generatedKey.length,
        expiresAt,
        used: 0,
        maxUses: 1
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

      // Check if key has been used up
      if (foundKey.used >= foundKey.maxUses) {
        return res.json({
          success: false,
          message: "Key has already been used",
          valid: false,
          used: true
        });
      }

      // Mark key as used
      await storage.markKeyAsUsed(foundKey.id);

      res.json({
        success: true,
        message: "Key is valid and has been consumed",
        valid: true,
        keyData: {
          name: foundKey.name,
          type: foundKey.type,
          created: foundKey.timestamp,
          expires: foundKey.expiresAt,
          usesRemaining: foundKey.maxUses - (foundKey.used + 1)
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

  // Generate key endpoint for external scripts
  app.post("/api/generate", async (req, res) => {
    try {
      const keyName = req.body.name || "Generated Key";
      
      // Set expiration to 1 day from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1);

      // Generate bash-style key: FREE-9f2d7c1a3e-bd4f7a29
      const generateHexSegment = (length: number) => {
        const chars = '0123456789abcdef';
        return Array.from({ length }, () => 
          chars.charAt(Math.floor(Math.random() * chars.length))
        ).join('');
      };
      
      const segment1 = generateHexSegment(10);
      const segment2 = generateHexSegment(8);
      const generatedKey = `FREE-${segment1}-${segment2}`;

      const keyData = {
        name: keyName,
        key: generatedKey,
        type: 'bash',
        length: generatedKey.length,
        expiresAt,
        used: 0,
        maxUses: 1
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
      console.error('Error generating key:', error);
      res.status(500).json({
        success: false,
        message: "Failed to generate key"
      });
    }
  });

  // Public API endpoint for key validation (for external scripts)
  app.get("/api/validate/:key", async (req, res) => {
    try {
      const { key } = req.params;
      
      if (!key) {
        return res.json({
          valid: false,
          message: "No key provided"
        });
      }

      const allKeys = await storage.getAllKeys();
      const foundKey = allKeys.find(k => k.key === key);
      
      if (!foundKey) {
        return res.json({
          valid: false,
          message: "Key not found"
        });
      }

      // Check if key is expired
      const now = new Date();
      if (new Date(foundKey.expiresAt) < now) {
        return res.json({
          valid: false,
          message: "Key has expired",
          expired: true
        });
      }

      // Check if key has been used up
      if (foundKey.used >= foundKey.maxUses) {
        return res.json({
          valid: false,
          message: "Key has already been used",
          used: true
        });
      }

      // Mark key as used
      await storage.markKeyAsUsed(foundKey.id);

      res.json({
        valid: true,
        message: "Key is valid and has been consumed",
        data: {
          name: foundKey.name,
          created: foundKey.timestamp,
          expires: foundKey.expiresAt,
          usesRemaining: foundKey.maxUses - (foundKey.used + 1)
        }
      });
    } catch (error) {
      console.error('Error validating key:', error);
      res.status(500).json({
        valid: false,
        message: "Server error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
