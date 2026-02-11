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
| `STRIPE_SECRET_KEY` | No (para pagos) | Clave secreta de Stripe (`sk_test_...` o `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | No (para pagos) | Secreto del webhook de Stripe (`whsec_...`) |
| `STRIPE_PRO_PRICE_ID` | No (para pagos) | API ID del precio Pro creado en Stripe Dashboard |
| `STRIPE_BUSINESS_PRICE_ID` | No (para pagos) | API ID del precio Business creado en Stripe Dashboard |
| `VITE_STRIPE_PUBLISHABLE_KEY` | No (para pagos) | Clave publicable de Stripe (`pk_test_...` o `pk_live_...`) |

## Comprobaciones

- Con **Root Directory** vacío, Render ejecuta `npm install && npm run build` y luego `npm start` desde la raíz del repo.
- El backend escucha en el puerto que asigne Render (variable `PORT`).
- La conexión a MongoDB funciona si `MONGODB_URI` está definida y usa `w=majority`.
