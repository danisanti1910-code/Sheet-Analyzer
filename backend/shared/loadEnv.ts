/**
 * Carga .env desde la raíz del repo y desde backend/ para que MONGODB_URI
 * y el resto de variables estén disponibles aunque el proceso se ejecute desde cualquier carpeta.
 * Debe importarse como primera línea en backend/server/index.ts y backend/api/index.ts.
 */
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cwd = process.cwd();

// Rutas posibles: desde código fuente (backend/shared) o desde cwd (raíz del repo al hacer npm start)
const backendDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(backendDir, "..");
const cwdBackend = path.join(cwd, "backend");

config({ path: path.join(repoRoot, ".env") });
config({ path: path.join(backendDir, ".env") });
config({ path: path.join(cwd, ".env") });
config({ path: path.join(cwdBackend, ".env") });
