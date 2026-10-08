# UP Pharmacy Portal — Render Free Test

This version avoids native `better-sqlite3`, so it is easier to deploy on a free Node.js service.

Public website: `/`
Admin: `/admin`

## Render
Build command: `npm install`
Start command: `npm start`

Environment variables:
- ADMIN_EMAIL
- ADMIN_PASSWORD
- SESSION_SECRET

The test stores data in `data.json`. This is suitable for testing the admin -> public workflow, but it is NOT production database storage. A real deployment should use PostgreSQL or another persistent database.

Do not commit real passwords or secrets.
