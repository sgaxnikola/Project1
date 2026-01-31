# Personal Finance Web 

This project includes:
- **Frontend**: React + Vite
- **Backend**: Node.js + Express + **SQLite** (stored in `server/data/app.db`)

## 1) Run backend (SQLite)

```bash
cd server
npm i
# copy env
copy .env.example .env   # Windows (PowerShell/CMD)
# or: cp .env.example .env
npm run dev
```

Backend runs at `http://localhost:4000`.

## 2) Run frontend (React)

In another terminal:

```bash
cd ..
npm i
npm run dev
```

Frontend runs at `http://localhost:5173` (default Vite).

## Configure API URL

Create a `.env` file at project root:

```env
VITE_API_URL=http://localhost:4000
```

## Notes
- **Passwords** are stored as a secure hash in SQLite.
- The **OpenAI API key** (if used) is kept **client-only** (localStorage) by design.
