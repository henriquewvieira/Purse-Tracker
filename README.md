# Purse Tracker

A web app for tracking handmade purse production, costs, and profitability.

## Features

- **Materials** — add/edit/delete raw materials with price per unit
- **Purse Types** — define purse templates with required materials and quantities
- **Production Records** — log batches of purses made; costs are auto-computed
- **Dashboard** — monthly revenue, cost, and profit charts
- **Reports** — breakdown by purse type, CSV export
- **Settings** — configure hourly labor rate and change password

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS — deployed on Vercel (CDN)
- **Backend:** Node.js + Express — deployed on Vercel (serverless function at `api/index.js`)
- **Database:** PostgreSQL on [Neon](https://neon.tech)
- **Auth:** JWT (stored in localStorage, verified on every API request)
- **ORM:** Prisma

## Local Development

### Prerequisites

- Node.js 20+
- A Neon (or any PostgreSQL) database

### 1. Clone the repo

```bash
git clone <repo-url>
cd purse-tracker
```

### 2. Configure environment variables

```bash
# backend/.env
DATABASE_URL="your-neon-connection-string"
SESSION_SECRET="any-long-random-string"
PORT=3001
```

```bash
# frontend/.env
VITE_API_BASE=/api
```

### 3. Set up the database

```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma db seed   # optional: loads example data
```

### 4. Start the backend

```bash
# still inside /backend
npm run dev
```

API runs at **http://localhost:3001**.

### 5. Start the frontend (separate terminal)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

### Default credentials

| Field    | Value      |
|----------|------------|
| Password | `admin123` |

**Change your password in Settings immediately after first login.**

---

## Vercel Deployment

The project is already configured for Vercel via `vercel.json`.

### Environment variables to set in Vercel dashboard

| Variable       | Description                              |
|----------------|------------------------------------------|
| `DATABASE_URL` | Neon PostgreSQL connection string        |
| `SESSION_SECRET` | Secret key for signing JWT tokens      |
| `FRONTEND_URL` | Your Vercel frontend URL (for CORS)      |
| `NODE_ENV`     | Set to `production`                      |

### Deploy

```bash
vercel deploy
```

Vercel builds the frontend (`frontend/dist`) and deploys the Express app as a serverless function (`api/index.js`). All `/api/*` requests route to the function; everything else serves the static frontend.

---

## Running Tests

```bash
cd backend
npm test
```

Covers the `computeCosts` business logic (5 test cases).

---

## Project Structure

```
purse-tracker/
  api/              Vercel serverless entry point (api/index.js)
  backend/
    prisma/         Schema, migrations, seed data
    src/
      lib/          Business logic (computeCosts, prisma singleton)
      middleware/   Auth (JWT), error handler
      routes/       API endpoints
      app.js        Express app
      index.js      Local dev server entry point
  frontend/
    src/
      api/          HTTP client + per-resource modules
      components/   Reusable UI (Button, Modal, charts, etc.)
      context/      Auth context
      pages/        Route-level components
      lib/          computeCosts (client-side preview)
  vercel.json       Vercel build + routing config
```

---

## Cost Formula

```
material_cost  = Σ (quantity × price_per_unit)
labor_cost     = (labor_minutes / 60) × hourly_rate
cost_per_unit  = material_cost + labor_cost + other_costs
total_cost     = cost_per_unit × quantity
profit         = (sale_price × quantity) − total_cost
```
