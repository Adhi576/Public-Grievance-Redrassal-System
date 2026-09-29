# Public Grievance Redressal System (PGRS) — Supabase PostgreSQL Migration

## Overview
The PGRS backend database layer has been migrated from local **MySQL** to **Supabase PostgreSQL 17.6**.

## Architecture & Technology Stack
- **Database:** Supabase PostgreSQL 17.6 (managed connection via transaction pooler over SSL).
- **ORM / Driver:** Sequelize v6 with `pg` and `pg-hstore`.
- **Backend:** Node.js, Express, Jest, Supertest.
- **Frontend:** React 19, Vite, React Router v7.

## Key Migration Highlights
1. **Dialect Adaptation:**
   - Schema and migration scripts updated to standard PostgreSQL syntax.
   - Enums created with native PostgreSQL `ENUM` types.
   - Serial primary keys and sequence generators aligned.
   - Dialect-aware date arithmetic using PostgreSQL functions (`EXTRACT(EPOCH FROM ...)` and `TO_CHAR(..., 'YYYY-MM-DD')`).
2. **Data Migration:**
   - 95 genuine development records migrated cleanly with 100% foreign-key and relational integrity.
   - 17 serial sequences reset to maximum IDs.
3. **Local Assets & Backups:**
   - Local MySQL database remains intact on port 3306 as a safety backup.
   - MySQL logical dump preserved at `backups/pgrs_db_backup.sql`.
   - Local attachment uploads remain stored under `backend/uploads/` (file metadata tracked in database).
4. **Testing & Verification:**
   - Backend Test Suite: **90 / 90 Jest tests passed** (100%).
   - Frontend Production Build: **Vite build passed with 0 errors**.
   - Full integration across Citizen, Officer, Department Head, and Administrator workflows verified.

## Required Environment Variables

### Backend (`backend/.env`)
```env
# Server
PORT=5000
NODE_ENV=production

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
DB_SSL=true

# JWT Authentication
JWT_SECRET=[YOUR_JWT_SECRET]
JWT_EXPIRES_IN=24h

# Storage
UPLOAD_PATH=./uploads

# CORS
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env` / build)
- Default API route base: `/api` (proxied via Vite dev server or web server reverse proxy).

---
*Note: Never commit real credentials, database passwords, or `.env` files to version control.*
