# Tally

A small expense-sharing app inspired by Splitwise. Record who paid for whom and see the net balance between every pair of people.

Live demo: https://tradersho.onrender.com

The demo runs on Render's free plan. It sleeps after 15 minutes without traffic, so the first request after that can take up to a minute. Render's free plan has no persistent disk either, which means the database goes back to the sample data whenever the service restarts.

## Stack

- Backend: Fastify, SQLite (better-sqlite3), Drizzle ORM
- Frontend: React, Vite, TanStack Query, Tailwind CSS
- Shared: a small workspace package with the zod schema and API types used by both sides
- Tooling: TypeScript, Vitest, ESLint, Prettier, GitHub Actions

## Getting started

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

This starts the API on http://localhost:3000 and the web app on http://localhost:5173. The Vite dev server proxies `/api` to the backend.

On first start the server applies migrations and seeds four users (Alice, Bob, Charlie, David) with a few sample expenses. The database file lives at `server/data/tally.db`; delete it to start over.

### Production build

```bash
npm run build
npm start
```

The server serves the built frontend from `web/dist`, so the whole app runs on a single port.

### Docker

```bash
docker build -t tally .
docker run -p 3000:3000 -v tally-data:/data tally
```

### Scripts

| Command             | What it does                              |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | API and web app in watch mode             |
| `npm run build`     | Builds the web app and bundles the server |
| `npm start`         | Runs the production build                 |
| `npm test`          | API tests and frontend unit tests         |
| `npm run lint`      | ESLint                                    |
| `npm run typecheck` | TypeScript across all workspaces          |

### Configuration

| Variable        | Default                | Description          |
| --------------- | ---------------------- | -------------------- |
| `PORT`          | `3000`                 | HTTP port            |
| `HOST`          | `0.0.0.0`              | Bind address         |
| `DATABASE_PATH` | `server/data/tally.db` | SQLite file location |
| `LOG_LEVEL`     | `info`                 | Pino log level       |

## API

| Method | Path            | Description                                 |
| ------ | --------------- | ------------------------------------------- |
| GET    | `/api/users`    | Seeded users                                |
| GET    | `/api/expenses` | All expenses, newest first                  |
| POST   | `/api/expenses` | Create an expense                           |
| GET    | `/api/balances` | Net balance for every pair of users who owe |
| GET    | `/api/health`   | Health check                                |

Creating an expense:

```http
POST /api/expenses
Content-Type: application/json

{
  "paidById": 1,
  "paidForId": 2,
  "amountCents": 5000,
  "description": "Dinner",
  "date": "2026-09-28"
}
```

Validation errors return `400` with a message and per-field errors:

```json
{
  "error": "The expense is not valid",
  "fieldErrors": { "amountCents": ["Amount must be greater than zero"] }
}
```

## Design notes

An expense is one directional debt: "Alice paid $50 for Bob" means Bob owes Alice $50.

Balances are netted per pair in a single SQL query that groups expenses by the ordered pair of user ids. Pairs that net to zero are left out. Debts are not simplified across the group, so "A owes B" and "B owes C" stay two rows instead of becoming "A owes C", since the task asks for balances between users.

Money is stored as integer cents. The client parses the typed amount as a string, so floating point never touches it.

The same zod schema validates the form before it is submitted and the request body on the server. The database has its own `CHECK` constraints for a positive amount and for payer and recipient being different people.

The expense date is chosen in the form, defaults to today, and is stored as a plain `YYYY-MM-DD` string so it can't shift across time zones. The creation timestamp is kept separately.

Fastify serves both the API and the built frontend, so the whole app deploys as one container and there is no CORS or API URL to configure.

Out of scope for this task: authentication, editing or deleting expenses, settling up, multiple currencies and pagination.

## Project structure

```
shared/   zod schema and API types
server/   Fastify API, Drizzle schema, migrations and seed
web/      React single-page app
```

## Deployment

The demo is a Render web service built from the Dockerfile in this repository, with `/api/health` as the health check path. Render sets `PORT` itself, so no environment variables are needed.

To keep data across restarts on any host, mount a persistent disk at `/data`, which is where the container stores the SQLite file.
