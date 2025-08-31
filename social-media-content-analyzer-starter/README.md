# Social Media Content Analyzer — Starter

A minimal end‑to‑end template implementing the assignment requirements: PDF/image upload, text extraction (PDF parsing + OCR), loading states, and basic UX.

## Quickstart

### 1) Backend
```bash
cd backend
npm i
npm run dev
```

### 2) Frontend
Open `frontend/index.html` in a browser.  
If your backend is not on `http://localhost:8080`, add this before `script.js`:
```html
<script>window.BACKEND_URL="http://your-host-or-port";</script>
```

## Deploy

- **Backend**: Render, Railway, Fly.io, or any Node host. Expose port `8080`.
- **Frontend**: Netlify, Vercel, GitHub Pages (static).

## API
- `POST /api/analyze` — multipart upload with `file` (PDF or image).

## Tech
- Express, Multer, pdf-parse, tesseract.js
- Vanilla HTML/CSS/JS (can be swapped for React later)

## Approach (≤200 words)
I approached the Social Media Content Analyzer as a pragmatic, production‑lean MVP that demonstrates the two core capabilities required by the brief: robust text extraction and basic UX polish.

On the backend, an Express service accepts file uploads via Multer. PDFs are parsed with `pdf-parse`; images go through OCR using `tesseract.js` to avoid native build headaches on common hosts. I added simple, user‑friendly responses: filename, type (PDF/OCR), character count, a safe preview, and a few heuristic “engagement suggestions” (e.g., add hashtags, include a call‑to‑action, improve readability) to show end‑to‑end value. Errors return concise JSON messages and the service cleans temporary files.

On the frontend, a lightweight vanilla HTML/JS interface delivers a drag‑and‑drop zone and clear loading and results sections, keeping the asset weight minimal. Styling focuses on clarity and contrast, and the app shows obvious states (idle, analyzing, done) per the requirements.

The README documents local development and deployment. The code is modular and intentionally compact so reviewers can quickly scan it within the stated eight‑hour limit. With more time, I’d add: queueing for large OCR jobs, language packs, structured entity extraction, sentiment, duplicate‑content detection, and a richer rules engine for suggestions.

