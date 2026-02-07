import express, { type Request, Response, NextFunction, type Express } from "express";
import { createServer } from "http";
import { connectDb } from "./db";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";

/** Origin permitido para CORS (frontend en otro dominio). En Render: URL de tu front (Vercel/Netlify). */
const CORS_ORIGIN = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

let appPromise: Promise<Express> | null = null;
let dbConnected = false;
let dbError: string | null = null;

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

    // CORS: permitir requests desde el frontend cuando está en otro dominio (p. ej. front en Vercel, back en Render)
    if (CORS_ORIGIN) {
      app.use((req, res, next) => {
        const origin = req.headers.origin;
        const allow = origin === CORS_ORIGIN ? origin : CORS_ORIGIN;
        res.setHeader("Access-Control-Allow-Origin", allow);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-User-Email");
        if (req.method === "OPTIONS") return res.sendStatus(204);
        next();
      });
    }

    // En Vercel el body ya viene parseado en req.body; express.json() leería el stream vacío y pisaría req.body
    if (!process.env.VERCEL) {
      app.use(
        express.json({
          verify: (req, _res, buf) => {
            req.rawBody = buf;
          },
        })
      );
      app.use(express.urlencoded({ extended: false }));
    } else {
      app.use((req, _res, next) => {
        if (req.body == null && req.method !== "GET" && req.method !== "HEAD") {
          (req as express.Request).body = {};
        }
        next();
      });
    }

    app.use((req, res, next) => {
      const start = Date.now();
      const path = req.path;
      let capturedJsonResponse: Record<string, unknown> | undefined;

      const originalResJson = res.json.bind(res);
      res.json = function (bodyJson: unknown) {
        capturedJsonResponse = bodyJson as Record<string, unknown>;
        return originalResJson(bodyJson);
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

    try {
      await connectDb();
      dbConnected = true;
      dbError = null;
    } catch (err) {
      dbConnected = false;
      dbError = err instanceof Error ? err.message : String(err);
      log(`[app] MongoDB connection failed: ${dbError}`);
    }

    app.use((req, res, next) => {
      if (!dbConnected && req.path.startsWith("/api")) {
        return res.status(503).json({
          error: "Database unavailable",
          details: dbError ?? "Could not connect to MongoDB. Check MONGODB_URI in Vercel.",
        });
      }
      next();
    });

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
