# B2B Textile Marketplace — Setup

## 0. Prerequisites
- Node.js 18+
- A PostgreSQL database **with the `pgvector` extension available**. Easiest options:
  - [Neon](https://neon.tech) or [Supabase](https://supabase.com) — pgvector is enabled with one click / one SQL command, free tier works.
  - Local Postgres — install the `pgvector` extension for your Postgres version first ([instructions](https://github.com/pgvector/pgvector#installation)), then run `CREATE EXTENSION vector;` once inside your target database.

## 1. Get the code
Unzip the project, then open two terminals — one for `server`, one for `client`.

## 2. Server setup
```bash
cd server
cp .env.example .env
```
Edit `.env`:
- `DATABASE_URL` → your Postgres connection string
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` → any random strings (e.g. `openssl rand -hex 32`)
- Leave the rest as default for local dev

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```
Server runs on **http://localhost:4000**. Check `http://localhost:4000/api/health` → `{ success: true }`.

> If `prisma migrate dev` errors about the `vector` type/extension, your database doesn't have pgvector enabled yet — see step 0.

## 3. Client setup
In the second terminal:
```bash
cd client
cp .env.example .env
npm install
npm run dev
```
Client runs on **http://localhost:5173**.

## 4. Try it
1. Open http://localhost:5173
2. **Register as a supplier** → complete the onboarding wizard → add 2–3 products (inventory page)
3. **Log out, register as a buyer** → complete onboarding → browse `/discover` → add products to cart → checkout → place order
4. Log back in as the supplier → **Orders** page → advance the order's status (list or Kanban view)
5. Log back in as the buyer → **Dashboard/Orders** → confirm the status updated

## Notes
- Product images upload to local disk (`server/uploads`), served at `/uploads/*` — fine for local dev/demo, not for production.
- AI Assistant (Gemini) and visual search (pgvector embeddings) are not wired up yet — later build steps.
- Admin panel not built yet — lowest priority per the blueprint.
