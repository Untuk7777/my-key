import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertKeySchema } from "@shared/schema";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { randomUUID } from 'crypto';

// Rate limiter for key generation - 3 keys per 15 minutes
const keyGenerationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    error: "Hold on Cooldown..",
    message: "You can only generate 3 keys every 15 minutes. Please try again later.",
    retryAfter: 15 * 60 * 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
});



export async function registerRoutes(app: Express): Promise<Server> {
  
  // Roblox executor style validation endpoint (must be first to avoid frontend route conflicts)
  app.get("/validate", async (req, res) => {
    try {
      const key = req.query.key as string;
      
      if (!key) {
        return res.status(400).send("invalid key");
      }

      // Clean up expired keys first
      await storage.cleanupExpired();
      
      const keys = await storage.getAllKeys();
      const foundKey = keys.find(k => k.key === key);
      
      if (!foundKey) {
        return res.status(404).send("invalid key");
      }

      // Check if key is expired (24 hours)
      const now = new Date();
      const keyCreated = new Date(foundKey.timestamp);
      const hoursDiff = (now.getTime() - keyCreated.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        return res.status(410).send("key expired");
      }

      // Check if key was already used
      if (foundKey.used) {
        return res.status(409).send("key already used");
      }

      // Key is valid
      res.status(200).send("valid key");
      
    } catch (error) {
      console.error('Error validating key:', error);
      res.status(500).send("server error");
    }
  });

  // Roblox executor style script delivery endpoint (must be early to avoid frontend route conflicts)
  app.get("/getscript", async (req, res) => {
    try {
      const key = req.query.key as string;
      
      if (!key) {
        return res.status(400).send("-- No key provided");
      }

      // Clean up expired keys first
      await storage.cleanupExpired();
      
      const keys = await storage.getAllKeys();
      const foundKey = keys.find(k => k.key === key);
      
      if (!foundKey) {
        return res.status(404).send("-- Invalid key");
      }

      // Check if key is expired (24 hours)
      const now = new Date();
      const keyCreated = new Date(foundKey.timestamp);
      const hoursDiff = (now.getTime() - keyCreated.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        return res.status(410).send("-- Key expired");
      }

      // Check if key was already used
      if (foundKey.used) {
        return res.status(409).send("-- Key already used");
      }

      // Mark key as used
      await storage.markKeyAsUsed(foundKey.id);

      // Return the script (you can customize this script)
      const script = `-- Your script has been loaded successfully!
print("✓ Key validated and script loaded!")
print("✓ Welcome to the executor!")

-- Example script functionality
local Players = game:GetService("Players")
local player = Players.LocalPlayer

if player then
    print("✓ Player: " .. player.Name)
    print("✓ Script execution completed successfully!")
    
    -- Add your actual script functionality here
    -- This is where your executor script would go
    
else
    print("✗ Could not find local player")
end

-- Script loaded at: ${new Date().toISOString()}
-- Key used: ${key.substring(0, 8)}...`;

      res.setHeader('Content-Type', 'text/plain');
      res.status(200).send(script);
      
    } catch (error) {
      console.error('Error delivering script:', error);
      res.status(500).send("-- Server error occurred");
    }
  });

  // Generate a new key with rate limiting
  app.post("/api/keys", keyGenerationLimiter, async (req, res) => {
    try {
      console.log("Request body:", req.body);
      
      // Clean up expired keys first
      await storage.cleanupExpired();
      
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

      const keyToCreate = {
        name: name || "Unnamed Key",
        key: generatedKey,
        type: "bash",
        length: generatedKey.length,
        expiresAt,
        used: 0,
        maxUses: 1
      };

      const savedKey = await storage.createKey(keyToCreate);
      res.json(savedKey);
    } catch (error) {
      console.error('Error generating key:', error);
      res.status(400).json({ message: "Failed to generate key" });
    }
  });

  // Get all keys
  app.get("/api/keys", async (req, res) => {
    try {
      // Clean up expired keys first
      await storage.cleanupExpired();
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

  // Key check endpoint (doesn't consume the key)
  app.get("/api/keys/check/:key", async (req, res) => {
    try {
      const { key } = req.params;
      
      // Clean up expired keys first
      await storage.cleanupExpired();
      
      // Get all keys to find the matching one
      const fileData = await storage.getKeysFromFile();
      const foundKey = fileData.keys.find(k => k.key === key);
      
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
          expired: true,
          data: {
            name: foundKey.name,
            created: foundKey.timestamp,
            expires: foundKey.expiresAt
          }
        });
      }

      // Check if key has been used up
      if (foundKey.used >= foundKey.maxUses) {
        return res.json({
          valid: false,
          message: "Key has already been used",
          used: true,
          data: {
            name: foundKey.name,
            created: foundKey.timestamp,
            expires: foundKey.expiresAt
          }
        });
      }

      // Key is valid and available
      res.json({
        valid: true,
        message: "Key is valid and available for use",
        data: {
          name: foundKey.name,
          created: foundKey.timestamp,
          expires: foundKey.expiresAt,
          usesRemaining: foundKey.maxUses - foundKey.used
        }
      });

    } catch (error) {
      console.error("Error checking key:", error);
      res.status(500).json({
        valid: false,
        message: "Server error",
        error: true
      });
    }
  });

  // Search keys endpoint (server-side protected)
  app.post("/api/keys/search", async (req, res) => {
    try {
      const { query, secret } = req.body;
      
      // Server-side protection - require secret
      if (secret !== "gT7mA5zP2bW0kQeN81XrL9aFuCjYzTq47KvHdEp3MmNs") {
        return res.status(403).json({
          error: "Access denied",
          message: "Invalid secret"
        });
      }
      
      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          error: "Query required",
          message: "Search query is required"
        });
      }
      
      const results = await storage.searchKeys(query.trim());
      res.json({
        success: true,
        results,
        count: results.length
      });
    } catch (error) {
      console.error('Error searching keys:', error);
      res.status(500).json({
        error: "Search failed",
        message: "Failed to search keys"
      });
    }
  });

  // Cleanup expired keys endpoint
  app.post("/api/keys/cleanup", async (req, res) => {
    try {
      await storage.cleanupExpired();
      res.json({
        success: true,
        message: "Expired keys cleaned up"
      });
    } catch (error) {
      console.error('Error cleaning up keys:', error);
      res.status(500).json({
        error: "Cleanup failed",
        message: "Failed to cleanup expired keys"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
