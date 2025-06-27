import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.set('trust proxy', 1); // Trust first proxy only (safer for rate limiting)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = Number(process.env.PORT) || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Display API endpoints
    console.log("\n=== API ENDPOINTS ===");
    if (process.env.NODE_ENV === "production" && process.env.REPLIT_DOMAINS) {
      console.log(`Validation: https://${process.env.REPLIT_DOMAINS}/api/validate/{key}`);
      console.log(`Generation: https://${process.env.REPLIT_DOMAINS}/api/generate`);
      console.log(`Key Checker: https://${process.env.REPLIT_DOMAINS}/api/keys/check/{key}`);
    } else {
      console.log("Key Generator: http://localhost:5000/api/keys");
      console.log("Key Checker: http://localhost:5000/api/keys/check/{key}");
      console.log("Roblox Validator: http://localhost:5000/validate?key={key}");
      console.log("Roblox Script: http://localhost:5000/getscript?key={key}");
      if (process.env.NODE_ENV === "development") {
        console.log("\nAfter deployment, check console for live URLs");
      }
    }
    console.log("====================\n");
  });
})();
