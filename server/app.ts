import express, { type Request, Response, NextFunction, type Express } from "express";
import { createServer } from "http";
import { connectDb } from "./db";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

let appPromise: Promise<Express> | null = null;

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function createApp(): Promise<Express> {
  if (appPromise) return appPromise;

  appPromise = (async () => {
    const app = express();
    const httpServer = createServer(app);

    app.use(
      express.json({
        verify: (req, _res, buf) => {
          req.rawBody = buf;
        },
      })
    );
    app.use(express.urlencoded({ extended: false }));

    app.use((req, res, next) => {
      const start = Date.now();
      const path = req.path;
      let capturedJsonResponse: Record<string, unknown> | undefined;

      const originalResJson = res.json.bind(res);
      res.json = function (bodyJson: unknown, ...args: unknown[]) {
        capturedJsonResponse = bodyJson as Record<string, unknown>;
        return originalResJson(bodyJson, ...args);
      };

      res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
          let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
          if (capturedJsonResponse) {
            logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
          }
          log(logLine);
        }
      });

      next();
    });

    await connectDb();
    await registerRoutes(httpServer, app);

    app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
      const status = (err as { status?: number; statusCode?: number }).status ?? (err as { statusCode?: number }).statusCode ?? 500;
      const message = (err as Error).message ?? "Internal Server Error";
      res.status(status).json({ message });
    });

    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    }

    return app;
  })();

  return appPromise;
}
