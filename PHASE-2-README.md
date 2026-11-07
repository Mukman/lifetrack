# LifeTrack — Phase 2

This project uses a React + TypeScript frontend and an Express + TypeScript API backed by MySQL through Prisma.

## API overview

All protected data endpoints require the HTTP-only `lifetrack_session` cookie. The server derives the account ID from the verified session; the browser does not choose the owner ID.

- `POST /api/v1/auth/register` — creates the first account only.
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET|POST /api/v1/tasks`; `PATCH|DELETE /api/v1/tasks/:id`
- `GET|POST /api/v1/transactions`; `PATCH|DELETE /api/v1/transactions/:id`
- `GET|POST /api/v1/habits`; `PATCH|DELETE /api/v1/habits/:id`
- `GET|POST /api/v1/reminders`; `PATCH|DELETE /api/v1/reminders/:id`
- `GET|POST /api/v1/calendar`; `PATCH|DELETE /api/v1/calendar/:id`
- `GET|PATCH /api/v1/preferences`
- `POST /api/v1/backup/restore` — validated additive restore of a LifeTrack JSON backup

## Module behavior

- Habit completion is daily and automatically resets when a new Addis Ababa calendar day begins.
- Reminder notifications are checked while the app is open and notification permission is granted; background delivery is not guaranteed.
- Backups include tasks, transactions, habits, reminders, calendar events, and budget preferences. Restore keeps existing records and adds imported records. Legacy exports are accepted.
- The PWA caches the app shell and static assets; account data still needs an API/database connection.

## Database safety

Use additive Prisma migrations for future schema changes. Do not delete migration history or run `prisma migrate reset` on a database containing user records. Back up the database before schema changes or deployment.

## Local development

See the root `README.md` for setup instructions. Keep real `.env` files out of source control and out of shared ZIP files.
