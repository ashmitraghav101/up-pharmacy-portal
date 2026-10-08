# UP Individual Pharmacy Portal

A single-pharmacy public information website with a private admin dashboard.

## Architecture

- `/` — public, read-only pharmacy website
- `/admin` — private administration dashboard
- `/api/public` — public pharmacy data API
- `/api/admin/data` — authenticated update endpoint
- SQLite database for the prototype

### Important: GitHub Pages

**Do not deploy this project with GitHub Pages** if you need the admin/database functionality. GitHub Pages only serves static files and cannot run `server.js`.

Use GitHub as the code repository, then deploy the Node.js application to a host that supports Node.js and persistent/server-side storage.

## Test locally

```bash
npm install
ADMIN_EMAIL=admin@careplus.in ADMIN_PASSWORD=ChangeMe123! SESSION_SECRET=replace-this npm start
```

Open:

- Public: `http://localhost:3000/`
- Admin: `http://localhost:3000/admin`

Demo login:

- Email: `admin@careplus.in`
- Password: `ChangeMe123!`

## Recommended repository structure

```text
up-pharmacy-github/
├── public/
│   ├── index.html
│   └── admin.html
├── server.js
├── package.json
├── .gitignore
└── README.md
```

## Production warning

Before real deployment:
- Use a strong admin password and session secret.
- Use HTTPS.
- Do not commit `.env`, database files, or credentials.
- Add proper authentication/user management.
- Add rate limiting, CSRF protection, audit logs and backups.
- Verify the final fields and disclosure requirements with the applicable UP FSDA/DPCO directions.
