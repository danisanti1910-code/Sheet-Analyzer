import express, { type Request, Response, NextFunction, type Express } from "express";
import { createServer } from "http";
import { connectDb } from "./db";
import { registerRoutes } from "./routes";
import { registerStripeRoutes } from "./stripe";
import { serveStatic } from "./static";

/** Frontend conocido en Vercel (fallback si FRONTEND_URL no está definida). */
const KNOWN_FRONTEND = "https://sheet-analyzer-gamma.vercel.app";

/** Orígenes permitidos para CORS: FRONTEND_URL o CORS_ORIGIN (varios separados por coma) + frontend conocido + localhost en dev. */
function getAllowedOrigins(): string[] {
  const fromEnv = [process.env.FRONTEND_URL, process.env.CORS_ORIGIN]
    .filter(Boolean)
    .flatMap((v) => v!.split(","))
    .map((o) => o.trim())
    .filter(Boolean);
  // Siempre incluir el frontend conocido en producción
  const origins = [...new Set([...fromEnv, KNOWN_FRONTEND])];
  // En desarrollo también localhost y 127.0.0.1
  if (process.env.NODE_ENV !== "production") {
    origins.push("http://localhost", "http://127.0.0.1");
  }
  return origins;
}

function getCorsAllowOrigin(req: express.Request): string {
  const origin = req.headers.origin;
  if (!origin) return "";
  // Siempre aceptar localhost/127 en cualquier puerto (desarrollo local contra backend remoto)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return origin;
  // Aceptar subdominios de vercel.app del mismo proyecto
  if (/^https:\/\/sheet-analyzer[^.]*\.vercel\.app$/i.test(origin)) return origin;
  // Origen exacto en la lista
  const allowed = getAllowedOrigins();
  if (allowed.includes(origin)) return origin;
  return "";
}

function setCorsHeaders(req: express.Request, res: express.Response): void {
  const allow = getCorsAllowOrigin(req);
  if (allow) {
    res.setHeader("Access-Control-Allow-Origin", allow);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-User-Email, X-Admin-Password");
  }
}

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

    // 1) OPTIONS (preflight) siempre 204 con CORS, antes de cualquier otro middleware
    app.use((req, res, next) => {
      if (req.method !== "OPTIONS") return next();
      setCorsHeaders(req, res);
      return res.sendStatus(204);
    });

    // 2) CORS en el resto de respuestas
    app.use((req, res, next) => {
      setCorsHeaders(req, res);
      next();
    });

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
      if (req.method === "OPTIONS" || !req.path.startsWith("/api")) return next();
      if (dbConnected) return next();
      setCorsHeaders(req, res);
      return res.status(503).json({
        error: "Database unavailable",
        details: dbError ?? "MONGODB_URI or DATABASE_URL must be set. In Render: Environment → MONGODB_URI.",
      });
    });

    await registerRoutes(httpServer, app);
    registerStripeRoutes(app);

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
