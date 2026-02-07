import "dotenv/config";
import { createApp } from "../server/app";

type Req = import("express").Request & { body?: unknown; on?: (event: string, fn: (...args: unknown[]) => void) => void };
type Res = import("express").Response;

function safeSendError(res: Res, status: number, body: Record<string, string>): void {
  try {
    if (typeof res.status === "function" && typeof res.json === "function") {
      res.status(status).json(body);
      return;
    }
  } catch (_) {}
  try {
    (res as NodeJS.ServerResponse).statusCode = status;
    (res as NodeJS.ServerResponse).setHeader("Content-Type", "application/json");
    (res as NodeJS.ServerResponse).end(JSON.stringify(body));
  } catch (_) {}
}

async function ensureBodyParsed(req: Req): Promise<void> {
  try {
    if (req.method === "GET" || req.method === "HEAD") return;
    // En Vercel a veces req.body es una Promise
    let body = req.body;
    if (body != null && typeof (body as Promise<unknown>).then === "function") {
      body = await (body as Promise<unknown>);
    }
    if (body != null && typeof body === "object" && !Array.isArray(body)) {
      req.body = body;
      return;
    }
    const nodeReq = req as NodeJS.IncomingMessage & { body?: unknown };
    if (typeof nodeReq.on !== "function") {
      req.body = req.body ?? {};
      return;
    }
    const raw = await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      nodeReq.on("data", (chunk: Buffer) => chunks.push(chunk));
      nodeReq.on("end", () => resolve(Buffer.concat(chunks).toString()));
      nodeReq.on("error", reject);
    });
    req.body = raw ? JSON.parse(raw) : {};
  } catch {
    req.body = {};
  }
}

export default async function handler(req: Req, res: Res) {
  try {
    await ensureBodyParsed(req);
    const app = await createApp();
    return app(req, res);
  } catch (err) {
    console.error("[api] Handler error:", err);
    const message = err instanceof Error ? err.message : String(err);
    safeSendError(res, 500, {
      error: "Server error",
      details: message,
    });
  }
}
