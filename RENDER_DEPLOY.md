# Deploy LuxeCart — Backend on Render

The backend is now a **standalone Express server** (no Firebase Cloud Functions).
Architecture:

| Component | Platform | URL |
|---|---|---|
| Frontend (React) | Firebase Hosting | https://ecommerce-luxecart.web.app |
| Backend (Express) | Render | https://luxecart-api.onrender.com |
| Database (PostgreSQL) | Supabase / Neon (free tier) | — |

## 1. Create the PostgreSQL database

1. Create a free project on https://supabase.com (or https://neon.tech).
2. Copy the **connection string** (use the session/direct connection, port `5432`):
   ```
   postgresql://user:password@host:5432/postgres
   ```

## 2. Apply the schema

This creates all tables and seeds categories + products.

```powershell
$env:DATABASE_URL = "postgresql://user:password@host:5432/postgres"
node run_schema.js
```

## 3. Deploy the backend to Render

1. Push this repo to GitHub: https://github.com/Ashot-js/ecommerce-luxecart
2. Open https://render.com → **New → Web Service** → connect the repo.
3. Settings:

| Field | Value |
|---|---|
| Name | `luxecart-api` (must match `frontend/.env.production`) |
| Root Directory | `functions` |
| Runtime | Node |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Instance Type | Free |

4. Environment Variables:

| Key | Value |
|---|---|
| `DATABASE_URL` | your Postgres connection string |
| `JWT_SECRET` | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `NODE_ENV` | `production` |

5. Deploy. Render gives you `https://luxecart-api.onrender.com`.

## 4. Frontend (already wired up)

`frontend/.env.production` already sets `VITE_API_URL=https://luxecart-api.onrender.com`.
If you rename the Render service, update that file, then:

```powershell
cd frontend; npm run build; cd ..
firebase deploy --only hosting
```

## Verify

- `https://luxecart-api.onrender.com/api/health` → `{"status":"ok",...}`
- `https://ecommerce-luxecart.web.app` → product catalog loads from Postgres
