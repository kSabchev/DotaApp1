# Deployment

The backend is stateless at runtime (the SQLite match corpus is only used by
the offline `ingest`/`train`/`backtest` CLI scripts, never by the live API), so
deployment is just: a static frontend host + one small always-on Node service.

**Order matters** because the two sides need each other's URL: deploy the
backend first, then the frontend (pointed at the backend), then go back and
tell the backend the frontend's real URL.

## 1. Push to GitHub

The repo already has a remote (`origin` → `kSabchev/DotaApp1`). Commit the
deployment files (`render.yaml`, `frontend/vercel.json`, the `.env.example`
files, and the CORS/path fixes) and push — both platforms below deploy
straight from a GitHub connection.

## 2. Backend → Render

1. [render.com](https://render.com) → sign in with GitHub → **New → Blueprint**
   → select this repo. Render will read `render.yaml` at the repo root
   (`rootDir: backend`, build = `npm install && npm run build`, start =
   `npm start`, health check = `/api/health`).
   - If you'd rather configure it by hand instead of the Blueprint: **New →
     Web Service**, Root Directory `backend`, Build Command
     `npm install && npm run build`, Start Command `npm start`.
2. Leave `CORS_ORIGIN` unset for now — set it in step 4.
3. Deploy, then copy the resulting URL (e.g. `https://dota-draft-analyzer-api.onrender.com`).
4. **Free-tier note:** Render's free web services spin down after ~15 minutes
   idle and cold-start (a few seconds) on the next request — expect that on
   first load after inactivity.

## 3. Frontend → Vercel

1. [vercel.com](https://vercel.com) → sign in with GitHub → **New Project** →
   import this repo.
2. Set **Root Directory** to `frontend`.
3. Since the frontend imports shared code from `../../../shared` (outside
   `frontend/`), enable **"Include files outside of the Root Directory in the
   Build Step"** in the project's Root Directory settings — otherwise the
   build won't see `shared/`.
4. Framework preset should auto-detect as Vite (`frontend/vercel.json` also
   pins this explicitly).
5. Add an environment variable: `VITE_API_BASE` = `<your Render URL>/api`
   (e.g. `https://dota-draft-analyzer-api.onrender.com/api`).
6. Deploy, then copy the resulting URL (e.g. `https://dota-app-1.vercel.app`).

## 4. Close the loop — tell the backend about the frontend

Back in Render, set the `CORS_ORIGIN` environment variable to the exact
Vercel URL from step 3.6 (no trailing slash; comma-separate multiple origins
if needed), then redeploy/restart the service.

## 5. Verify

Open the Vercel URL and confirm:
- Heroes load (no CORS errors in the browser console).
- The post-draft win-probability banner loads (`/api/model` — a static file,
  doesn't depend on OpenDota reachability).
- Live matchup data streams in (the `● live` badges) — this needs the
  Render service to reach `api.opendota.com`, which it should (unlike a
  network-sandboxed local dev environment, Render's normal outbound internet
  access isn't restricted).

## Local development is unaffected

`CORS_ORIGIN` and `VITE_API_BASE` both default to the existing localhost
setup when unset, so `npm run dev` in each folder still works exactly as
before with no env vars required.
