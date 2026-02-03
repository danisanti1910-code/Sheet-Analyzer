import "dotenv/config";
import { createApp } from "../server/app";

export default async function handler(req: import("express").Request, res: import("express").Response) {
  const app = await createApp();
  return app(req, res);
}
