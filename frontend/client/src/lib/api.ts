/**
 * Base URL de la API. En producción con front y back separados (p. ej. back en Render),
 * define VITE_API_URL en .env (o en tu host) apuntando a la URL del backend.
 * Si no está definida, se usan rutas relativas (mismo origen).
 */
export function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_URL;
  if (typeof base !== "string" || !base.trim()) return "";
  return base.replace(/\/$/, "");
}

/** Devuelve la URL absoluta para una ruta de API (path debe empezar con /). */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
