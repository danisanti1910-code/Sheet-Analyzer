import "dotenv/config";
import { createApp } from "../server/app";

type Req = import("express").Request & { body?: unknown; on?: (event: string, fn: (...args: unknown[]) => void) => void };

async function ensureBodyParsed(req: Req): Promise<void> {
  if (!process.env.VERCEL || req.method === "GET" || req.method === "HEAD") return;
  if (req.body != null && typeof req.body === "object") return;
  const nodeReq = req as NodeJS.IncomingMessage & { body?: unknown };
  if (typeof nodeReq.on !== "function") return;
  const body = await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    nodeReq.on("data", (chunk: Buffer) => chunks.push(chunk));
    nodeReq.on("end", () => resolve(Buffer.concat(chunks).toString()));
    nodeReq.on("error", reject);
  });
  try {
    (req as Req).body = body ? JSON.parse(body) : {};
  } catch {
    (req as Req).body = {};
  }
}

export default async function handler(req: Req, res: import("express").Response) {
  try {
    await ensureBodyParsed(req);
    const app = await createApp();
    return app(req, res);
  } catch (err) {
    console.error("[api] Handler error:", err);
    res.status(500).json({
      error: "Server error",
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
