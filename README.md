# Session Intelligence Backend – Quick Setup

## 1. Prerequisites

- Node.js 18+ and npm
- PostgreSQL running locally (or a connection string you can use)

## 2. Install dependencies

```bash
cd session-intelligence-backend
npm install
```

## 3. Configure environment

Create a `.env` file in `session-intelligence-backend` based on `.env.example`:

```bash
cp .env.example .env   # on Windows PowerShell: copy .env.example .env
```

Then edit `.env` and set:

- `DATABASE_URL` – your PostgreSQL connection string
- (optionally) `ACCESS_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`

> CORS: the backend now automatically reflects the requesting origin for CORS and no longer needs a `FRONTEND_ORIGIN` variable.

## 4. Database migrations (Prisma)

```bash
npm run prisma:migrate
npm run prisma:generate
# optional, if you have seed data
npm run prisma:seed
```

## 5. Run the backend

Development mode:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

The API will be available on `http://localhost:4000/api` by default (see `PORT` in `.env`).

