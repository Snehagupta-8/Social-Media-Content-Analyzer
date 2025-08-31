I approached the Social Media Content Analyzer as a pragmatic, production‑lean MVP that demonstrates the two core capabilities required by the brief: robust text extraction and basic UX polish.

On the backend, an Express service accepts file uploads via Multer. PDFs are parsed with `pdf-parse`; images go through OCR using `tesseract.js` to avoid native build headaches on common hosts. I added simple, user‑friendly responses: filename, type (PDF/OCR), character count, a safe preview, and a few heuristic “engagement suggestions” (e.g., add hashtags, include a call‑to‑action, improve readability) to show end‑to‑end value. Errors return concise JSON messages and the service cleans temporary files.

On the frontend, a lightweight vanilla HTML/JS interface delivers a drag‑and‑drop zone and clear loading and results sections, keeping the asset weight minimal. Styling focuses on clarity and contrast, and the app shows obvious states (idle, analyzing, done) per the requirements.

The README documents local development and deployment. The code is modular and intentionally compact so reviewers can quickly scan it within the stated eight‑hour limit. With more time, I’d add: queueing for large OCR jobs, language packs, structured entity extraction, sentiment, duplicate‑content detection, and a richer rules engine for suggestions.
