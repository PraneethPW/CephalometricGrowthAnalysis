# CephGrow AI

AI-based growth pattern prediction for serial lateral cephalograms.

CephGrow AI is a MERN + TypeScript clinical decision-support prototype for orthodontic growth pattern review. It organizes cephalograms, shows angle overlays, and classifies growth into:

- Vertical Grower: angle >= 38 degrees
- Average Grower: angle from 28 to 37 degrees
- Horizontal Grower: angle <= 27 degrees

> This is decision-support software. It does not replace orthodontist diagnosis or radiology review.

## Folder Structure

```txt
cephgrow-ai/
  backend/
    dist/
    node_modules/
    prisma/
      schema.prisma
    src/
      index.ts
      prisma.ts
    .env
    .env.example
    .env.production.example
    package-lock.json
    package.json
    tsconfig.json

  frontend/
    dist/
    node_modules/
    public/
    src/
      App.tsx
      index.css
      main.tsx
    .env
    .env.example
    .env.production.example
    .gitignore
    index.html
    package-lock.json
    package.json
    tsconfig.json
    vite.config.ts
```

No Android folder is included.

## Tech Stack

- Frontend: React, TypeScript, Vite, TailwindCSS
- 3D: Three.js, React Three Fiber, Drei
- Backend: Node.js, Express, TypeScript
- Database: Neon Postgres with Prisma ORM
- AI: OpenRouter API through the OpenAI-compatible SDK

## Run Locally

Install backend dependencies:

```bash
cd backend
npm install
npm run prisma:generate
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

Run backend:

```bash
cd ../backend
npm run dev
```

Run frontend in another terminal:

```bash
cd ../frontend
npm run dev
```

Frontend:

```txt
http://localhost:5173
```

Backend:

```txt
http://localhost:8787
```

## Frontend Pages

```txt
/          Public landing page
/login     Login page
/signup    Signup page
/dashboard Protected workspace overview
/upload    Protected X-ray upload and angle analysis
/cases     Protected patient case list
/reports   Protected growth report summaries
```

The frontend includes demo authentication using local browser storage. Upload, case, and report pages redirect to `/login` until a clinician signs in or signs up.

## Environment

Backend environment lives in `backend/.env`.

```env
PORT=8787
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173,http://localhost:5174
APP_URL=http://localhost:5173
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
OPENROUTER_API_KEY=sk-or-v1-your-key
OPENROUTER_MODEL=openai/gpt-4o-mini
```

Frontend environment lives in `frontend/.env`.

```env
VITE_API_URL=http://localhost:8787
```

If `DATABASE_URL` or `OPENROUTER_API_KEY` is empty, the API runs in demo mode.

## Prisma

Generate Prisma Client:

```bash
cd backend
npm run prisma:generate
```

Push schema to Neon:

```bash
npm run prisma:push
```

Open Prisma Studio:

```bash
npm run prisma:studio
```

## Build

Backend:

```bash
cd backend
npm run build
```

Frontend:

```bash
cd frontend
npm run build
```

## API

Health:

```http
GET /api/health
```

List analyses:

```http
GET /api/analyses
```

Create analysis:

```http
POST /api/analyses
Content-Type: multipart/form-data

patientName=Demo Patient
angle=34.6
cephalogram=<file>
```
