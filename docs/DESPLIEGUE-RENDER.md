# Despliegue en Render (Sheet Analyzer)

## Configuración del servicio

- **Root Directory:** dejar **vacío** (usar la raíz del repositorio).
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

## Variables de entorno en Render

Configura en **Dashboard → tu servicio → Environment**:

| Variable       | Obligatoria | Descripción |
|----------------|-------------|-------------|
| `NODE_ENV`     | Sí          | `production` |
| `MONGODB_URI`  | Sí          | Cadena de conexión de MongoDB Atlas. Debe incluir `w=majority` en la query string, por ejemplo: `mongodb+srv://USER:PASSWORD@HOST/DB?retryWrites=true&w=majority` |
| `FRONTEND_URL` | No          | URL del frontend si se sirve desde otro dominio (p. ej. Vercel/Netlify), para CORS. Varios orígenes separados por coma. |

## Comprobaciones

- Con **Root Directory** vacío, Render ejecuta `npm install && npm run build` y luego `npm start` desde la raíz del repo.
- El backend escucha en el puerto que asigne Render (variable `PORT`).
- La conexión a MongoDB funciona si `MONGODB_URI` está definida y usa `w=majority`.
