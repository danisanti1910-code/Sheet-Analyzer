/**
 * Carga .env desde la raíz del repo y desde backend/ para que MONGODB_URI
 * y el resto de variables estén disponibles aunque el proceso se ejecute desde cualquier carpeta.
 * Debe importarse como primera línea en backend/server/index.ts y backend/api/index.ts.
 *
 * Usa process.cwd() (funciona en ESM, CJS y bundled). No usa import.meta.url
 * porque el build de esbuild genera CJS donde import.meta está vacío.
 */
import { config } from "dotenv";
import path from "path";

const cwd = process.cwd();

// Intentar cargar .env de múltiples ubicaciones (dotenv NO sobreescribe vars ya existentes)
config({ path: path.join(cwd, ".env") });
config({ path: path.join(cwd, "backend", ".env") });
