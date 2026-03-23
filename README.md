# Steel Tower Risk (Osmose)

Steel Tower Risk is a demo web application that maps U.S. transmission steel towers with an XGBoost-derived exposure score and related storm and DOE outage context. A FastAPI backend loads a scored CSV into memory at startup (no database), and a React + MapLibre GL frontend renders all towers as a single GeoJSON layer for smooth panning and filtering at scale.

## Local development

1. **Place the dataset**  
   Copy `master_final_scored.csv` into `backend/data/` so the path is:

   `backend/data/master_final_scored.csv`

2. **Run the API** (from the `backend` folder):

   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```

3. **Run the frontend** (from the `frontend` folder):

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Open the Vite dev server URL (usually `http://localhost:5173`). Set `VITE_API_URL` in `frontend/.env` if the API is not at `http://localhost:8000`.

## Deployment

### Backend (Render)

1. Push this repo to GitHub.
2. In Render, create a **Web Service** from the repository; use the `backend` directory as the root (or set **Root Directory** to `backend`).
3. **Build command:** `pip install -r requirements.txt`
4. **Start command:** `uvicorn main:app --host 0.0.0.0 --port 10000`
5. Add environment variable **`DATA_PATH`** = `data/master_final_scored.csv` (or the path where you upload the CSV in the service).
6. Upload or sync `master_final_scored.csv` into `backend/data/` on the service (e.g. commit it for a private repo, or use deploy hooks / persistent disk as you prefer).

Alternatively, use the included `render.yaml` blueprint if you use Render Blueprints.

### Frontend (Vercel)

1. Create a new Vercel project from the same GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Add environment variable **`VITE_API_URL`** = your Render API base URL (e.g. `https://your-service.onrender.com`), with no trailing slash.
4. Deploy; Vercel will run `npm install` and `npm run build`.

Deploy **backend first**, then point **`VITE_API_URL`** at the live API URL.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health payload |
| GET | `/health` | Health check |
| GET | `/towers/stats` | Totals by concern color, average score, top owners |
| GET | `/towers/geojson` | Filtered GeoJSON (`color`, `volt_class`, `owner`, `min_score`, `max_score`) |
| GET | `/towers/filters/options` | Voltage classes, color list, NERC regions |
| GET | `/towers/{tower_id}` | Single tower by `id` (use URL encoding for `/` in ids) |

## Data source credits

- **HIFLD** — transmission facility locations and attributes  
- **NOAA Storm Events** — historical storm events  
- **DOE OE-417** — electric emergency incidents and customer impacts  
- **NARR** — North American Regional Reanalysis (meteorological context)
