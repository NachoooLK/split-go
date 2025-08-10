## split-go

Aplicación de gestión de gastos personales y grupales.

### Requisitos
- Node.js 18+
- npm 9+

### Variables de entorno
Crear un archivo `.env.local` a partir de `.env.example` con tus credenciales:

```
cp .env.example .env.local
```

Variables mínimas para Firebase (puedes usar un proyecto demo para pruebas):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Opcionales para funcionalidades de IA:
- `VITE_GEMINI_API_KEY`
- `VITE_OPENAI_API_KEY`

Si no se configuran claves de IA, la app utilizará degradaciones controladas (heurísticas/identidad).

### Desarrollo
```
npm install
npm run dev
```

### Build de producción
```
npm run build
```
El resultado se genera en `dist/` y puede servirse con cualquier servidor estático.

### Previsualización local del build
```
npm run preview
```

### Despliegue
- Sube el contenido de `dist/` a tu proveedor (Vercel/Netlify/Cloudflare Pages/Nginx).
- Asegúrate de definir las mismas variables de entorno con prefijo `VITE_` en el entorno de build.

