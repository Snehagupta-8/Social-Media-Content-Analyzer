# Backend (Express)

- **Upload & Analyze**: `POST /api/analyze` with `multipart/form-data` field `file` (PDF or image).
- **PDF text** via `pdf-parse`.
- **OCR** via `tesseract.js` (no native deps required on popular hosts).
- **Heuristic suggestions** are a demo; tune as needed.

## Run locally
```bash
cd backend
npm i
npm run dev
```
Server: <http://localhost:8080>
