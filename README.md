CareBridge
Website URL : https://carebridge-1-up3t.onrender.com

Environment variables
---------------------
- Do NOT commit real API keys or secrets. Add them to `.env` files which are ignored by git.
- Frontend (Vite): copy `frontend/.env.example` -> `frontend/.env` and set `VITE_API_URL` (if needed).
- Backend: copy `backend/.env.example` -> `backend/.env` and set `GEMINI_API_KEY` and `MONGODB_URI`.

When ready to push, ensure `.env` files are listed in `.gitignore` (they are by default).
