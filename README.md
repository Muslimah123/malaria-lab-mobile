Malaria Lab Mobile & Server
===========================

Monorepo containing:
- mobile-app (Expo React Native)
- server (Flask + SQLite, JWT auth, image analysis endpoints)

Prerequisites
-------------
- Node.js 18+ and npm
- Python 3.10+ (virtualenv recommended)
- Git
- Expo Go app (for iOS/Android testing)

Quick Start (Mobile)
--------------------
1) Install deps
```
cd mobile-app
npm install
```
2) Start in tunnel mode (best for phones on different networks)
```
npx expo start --tunnel
```
3) Open Expo Go on your phone and scan the QR.

Quick Start (Server)
-------------------
```
cd server
python -m venv .venv
. .venv/Scripts/activate  # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```
Server defaults: http://localhost:5000 with APIs under /api (e.g. /api/health).

Mobile App Config
-----------------
API base URL is defined in `mobile-app/src/config/api.js`.
The app includes simple auto-discovery with common fallbacks. For a fixed dev IP, set:
```
export const API_BASE_URL = 'http://YOUR_IP:5000/api'
```

Run Tests (Server)
------------------
```
cd server
pytest -q
```

Project Scripts
---------------
- `mobile-app`: `npm start`, `npm run android`, `npm run ios`, `npm run web`
- `server`: `python app.py` (dev) or `gunicorn 'app:create_app()'` for prod-style run

Create GitHub Repo & Push
-------------------------
1) Initialize git (if not already):
```
git init
git add .
git commit -m "Initial commit: malaria-lab mobile + server"
```
2) Create a new GitHub repository (via UI), e.g. `malaria-lab-mobile`.

3) Connect and push:
```
git remote add origin https://github.com/<your-username>/malaria-lab-mobile.git
git branch -M main
git push -u origin main
```

Environment Variables
---------------------
Server (`server/config.env` or environment):
- `SECRET_KEY`, `JWT_SECRET_KEY` (tokens)
- `DATABASE_URL` (defaults to sqlite file)
- `UPLOAD_FOLDER` (defaults to server/uploads)

Troubleshooting
---------------
- Expo device won’t connect: run `npx expo start --tunnel --clear` and ensure Expo Go is updated.
- Mobile can’t reach server: verify `/api/health` responds from the phone’s browser using the exact base URL.
- Purple/blank screens: check terminal logs; enable DevTools Logs; or use the in-app error overlay we added to patient details.

License
-------
MIT (include your license of choice)


