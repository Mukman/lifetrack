# LifeTrack

LifeTrack is a personal productivity and finance application built with React, TypeScript, Express, Prisma, and MySQL.

## Current modules

- **Overview:** today's tasks, progress, habits, spending, and daily schedule.
- **My Day:** a dedicated daily planner showing today's tasks, calendar events, and reminders.
- **Tasks:** create, update, complete, delete, search, and filter tasks by status and priority; tasks include a due date and time.
- **Calendar:** month, week, and day views with event creation, editing, and deletion.
- **Habits & Routines:** create habits and mark daily completion; completion resets for the next Addis Ababa calendar day.
- **Reminders:** create, edit, complete, and delete account-backed reminders. When notification permission is granted, LifeTrack checks due reminders while the app is open. Browser notifications are not guaranteed when the app/browser is closed or the device is offline.
- **Finance:** record, edit, and delete income and expenses, choose transaction dates, and filter by type and month.
- **Budgets & Goals:** configure a monthly budget and savings goal.
- **Reports:** review task completion, overdue tasks, monthly income/net cash flow, and spending by category; export an account backup.
- **Settings:** account and data-storage information, complete JSON backup export, and additive backup restore. Restore keeps existing records and adds imported records.
- **Installable PWA shell:** manifest icons and service-worker caching for the app shell and assets. Account data still requires the API/database connection.

Application records are stored in MySQL through the authenticated API. Each data endpoint scopes records to the signed-in account.

## Requirements

- Node.js LTS
- npm
- Docker Desktop (recommended for MySQL) or a compatible MySQL 8 database

## Start the database

At the project root, create `.env` from `.env.example` and set a strong database password. Then run:

```bash
docker compose up -d mysql
```

The provided Docker configuration binds MySQL to localhost. If your MySQL installation already uses port 3306, the project can use a different host port; keep the host port in the backend `DATABASE_URL` consistent with `docker-compose.yml`.

## Configure and start the API

Create `server/.env` from `server/.env.example`. Configure:

- `DATABASE_URL` for the MySQL database
- `JWT_SECRET` with a unique random secret of at least 32 characters
- `CLIENT_ORIGIN=http://localhost:5173`
- `PORT=5000`

Then:

```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

API health check: `http://localhost:5000/api/v1/health`

The backup restore endpoint is `POST /api/v1/backup/restore`. It validates the uploaded backup payload and imports records in a database transaction; existing records are not deleted.

## Start the frontend

In a second terminal, from the project root:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Build checks

Frontend TypeScript and production build:

```bash
npm run build
```

Backend TypeScript build:

```bash
npm run api:build
```

## Important security and backup notes

- Keep `.env` files, passwords, and JWT secrets private. Never upload them publicly or commit them to source control.
- The first account registration endpoint closes after the first account is created.
- Use HTTPS and secure cookie settings for production deployment. Add CSRF protection before cross-site deployment.
- Export regular JSON backups and store them securely. Restore is additive: it keeps existing records and imports the backup records as new entries. Restoring the same backup more than once can create duplicate records. Previous unversioned LifeTrack JSON exports are also accepted.
- Browser notifications depend on browser/device support and permission. This app does not claim guaranteed background alarms when the browser is closed.
