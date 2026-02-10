/** Backend en Render (por defecto en producción si no se define VITE_API_URL). */
const RENDER_BACKEND_URL = "https://sheet-analyzer-qu7k.onrender.com";

/**
 * Base URL de la API. En producción con front y back separados (p. ej. back en Render),
 * define VITE_API_URL en .env (o en tu host) apuntando a la URL del backend.
 * Si no está definida en producción, se usa el backend en Render por defecto.
 * En desarrollo sin VITE_API_URL se usan rutas relativas (mismo origen o proxy).
 */
export function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_URL;
  if (typeof base === "string" && base.trim()) return base.replace(/\/$/, "");
  if (import.meta.env.PROD) return RENDER_BACKEND_URL;
  return "";
}

/** URL del backend con la que se comunica el frontend (para mostrar en UI o logs). */
export function getBackendUrlForDisplay(): string {
  const base = getApiBaseUrl();
  if (base) return base;
  if (typeof window !== "undefined") return window.location.origin;
  return "(mismo origen)";
}

/** Devuelve la URL absoluta para una ruta de API (path debe empezar con /). */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

if (import.meta.env.DEV && typeof console !== "undefined") {
  console.info("[Sheet Analyzer] Backend URL:", getBackendUrlForDisplay());
}
