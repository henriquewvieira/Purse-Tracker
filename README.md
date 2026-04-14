# Purse Tracker

A simple web app for tracking handmade purse production, costs, and profitability.

## Features

- **Materials** — add/edit/delete raw materials with price per unit
- **Purse Types** — define purse templates with required materials and quantities
- **Production Records** — log batches of purses made; costs are auto-computed
- **Dashboard** — monthly revenue, cost, and profit charts
- **Reports** — breakdown by purse type, CSV export
- **Settings** — configure hourly labor rate and currency

## Quick Start (Local)

### Prerequisites

- [Node.js 20+](https://nodejs.org)
- npm (included with Node.js)

### 1. Clone the repo

```bash
git clone <repo-url>
cd purse-tracker
```

### 2. Start the backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

The API will be running at **http://localhost:3001**.

### 3. Start the frontend (separate terminal)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### Default credentials

| Field    | Value     |
|----------|-----------|
| Password | `admin123` |

**Change your password in Settings after first login.**

---

## Docker (Single Command)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Run

```bash
# From the project root
docker compose up --build
```

Open **http://localhost** in your browser.

To stop: `docker compose down`

Data is stored in a Docker volume (`sqlite_data`) and survives container restarts and rebuilds.

### Environment Variables

Create a `.env` file in the project root before running Docker:

```env
SESSION_SECRET=your-long-random-secret-here
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable         | Default                      | Description                         |
|------------------|------------------------------|-------------------------------------|
| `DATABASE_URL`   | `file:./prisma/dev.db`       | SQLite file path                    |
| `SESSION_SECRET` | *(required in production)*   | Secret for signing session cookies  |
| `PORT`           | `3001`                       | Port the API server listens on      |
| `NODE_ENV`       | `development`                | Set to `production` in Docker       |

### Frontend (`frontend/.env`)

| Variable         | Default | Description             |
|------------------|---------|-------------------------|
| `VITE_API_BASE`  | `/api`  | API base path           |

---

## Running Tests

```bash
cd backend
npm test
```

Tests cover the `computeCosts` business logic function (5 test cases).

---

## PaaS Deployment (Railway / Render)

For platforms like Railway or Render that build a single service:

1. Set `NODE_ENV=production` — the backend will serve the built frontend from `../frontend/dist`.
2. Build the frontend first, then build the backend image (or use a monorepo build script).
3. Set `SESSION_SECRET` as an environment variable on the platform.
4. For Railway: use a `railway.toml` pointing to the backend `Dockerfile` with a volume attached for SQLite.

---

## Project Structure

```
purse-tracker/
  backend/          Express API, Prisma ORM, SQLite
  frontend/         React + Vite + Tailwind CSS
  docker-compose.yml
  README.md
```

---

## Data Model

| Table               | Key Fields                                                                 |
|---------------------|----------------------------------------------------------------------------|
| `materials`         | id, name, unit, price_per_unit, supplier, notes                            |
| `purse_types`       | id, name, description, image_url                                           |
| `purse_materials`   | purse_type_id, material_id, quantity                                       |
| `settings`          | hourly_rate, currency, password_hash                                       |
| `production_records`| purse_type_id, date, quantity, sale_price, labor_min, computed costs/profit|

## Cost Formula

```
material_cost = Σ (material.quantity × price_per_unit)
labor_cost    = (labor_minutes / 60) × hourly_rate
cost_per_unit = material_cost + labor_cost + other_costs
total_cost    = cost_per_unit × quantity
profit        = (sale_price × quantity) − total_cost
```
