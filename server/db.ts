import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Parse DATABASE_URL to provide better error messages
function validateDatabaseUrl(url: string): void {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname) {
      throw new Error("DATABASE_URL is missing hostname");
    }
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error(`DATABASE_URL is not a valid URL: ${url.substring(0, 50)}...`);
    }
    throw e;
  }
}

validateDatabaseUrl(process.env.DATABASE_URL);

export const client = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool configuration for better resilience
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Track database connection status
export let isDatabaseConnected = false;
export let lastDatabaseError: string | null = null;

// Test connection and update status
export async function testConnection(): Promise<boolean> {
  try {
    const result = await client.query('SELECT 1');
    isDatabaseConnected = true;
    lastDatabaseError = null;
    return true;
  } catch (error: any) {
    isDatabaseConnected = false;
    lastDatabaseError = formatDatabaseError(error);
    console.error(`[db] Connection test failed: ${lastDatabaseError}`);
    return false;
  }
}

// Format database errors for better debugging
export function formatDatabaseError(error: any): string {
  if (!error) return "Unknown database error";

  const code = error.code || "";
  const message = error.message || "";

  // DNS resolution errors
  if (code === "EAI_AGAIN" || message.includes("EAI_AGAIN")) {
    return `DNS resolution failed - Cannot resolve database hostname. Please verify DATABASE_URL is correct and the database is provisioned.`;
  }
  if (code === "ENOTFOUND" || message.includes("ENOTFOUND")) {
    return `Database host not found - The hostname in DATABASE_URL does not exist. Please check your database configuration.`;
  }

  // Connection errors
  if (code === "ECONNREFUSED" || message.includes("ECONNREFUSED")) {
    return `Connection refused - Database server is not accepting connections. Please ensure the database is running.`;
  }
  if (code === "ETIMEDOUT" || message.includes("ETIMEDOUT")) {
    return `Connection timeout - Could not connect to database within timeout period. Please check network connectivity.`;
  }

  // Authentication errors
  if (code === "28P01" || message.includes("authentication failed")) {
    return `Authentication failed - Invalid database credentials. Please check DATABASE_URL credentials.`;
  }
  if (code === "28000" || message.includes("no pg_hba.conf entry")) {
    return `Access denied - Database does not allow connection from this host.`;
  }

  // Database errors
  if (code === "3D000" || message.includes("does not exist")) {
    return `Database does not exist - The specified database has not been created.`;
  }

  return message || "Unknown database error";
}

// Helper function to execute queries with retry logic
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const errorCode = error.code || "";

      // Only retry on transient errors
      const isTransient = [
        "EAI_AGAIN",
        "ETIMEDOUT",
        "ECONNRESET",
        "EPIPE",
        "57P01", // admin_shutdown
        "57P02", // crash_shutdown
        "57P03", // cannot_connect_now
      ].includes(errorCode);

      if (!isTransient || attempt === maxRetries - 1) {
        throw error;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      console.log(`[db] Retrying operation after ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export const db = drizzle(client);

// Initial connection test (non-blocking)
testConnection().then(connected => {
  if (connected) {
    console.log("[db] Database connection established successfully");
  } else {
    console.error("[db] Warning: Initial database connection failed");
  }
});
