// backend/server.js
import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs/promises";
import fssync from "fs";
import path from "path";
import { fileURLToPath } from "url";              
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Robust PDF.js import (ESM/legacy build)
import * as pdfjsAll from "pdfjs-dist/legacy/build/pdf.js";
const pdfjsLib = pdfjsAll?.default ?? pdfjsAll;
const { getDocument } = pdfjsLib;

import Tesseract from "tesseract.js";

const app = express();
// Ultra-permissive CORS to cover file:// and any origin
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});


// --- CORS & preflight ---
app.use(cors({ origin: true, credentials: false }));
app.options("*", cors());

// --- Hardening: never let the process die silently ---
process.on("unhandledRejection", (e) => console.error("unhandledRejection:", e));
process.on("uncaughtException", (e) => console.error("uncaughtException:", e));

// --- Ensure uploads dir exists ---
if (!fssync.existsSync("uploads")) fssync.mkdirSync("uploads", { recursive: true });


const FRONT = path.resolve(__dirname, "../frontend");
app.use(express.static(FRONT));                         
app.get("/", (_req, res) => {                           
  res.sendFile(path.join(FRONT, "index.html"));
});

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

// Health
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "content-analyzer", version: "0.1.0" });
});

// PDF text extractor (expects Uint8Array)
async function extractPdfText(uint8) {
  if (typeof getDocument !== "function") throw new Error("PDF.js getDocument not available");
  const loadingTask = getDocument({
    data: uint8,
    useWorker: false,
    disableFontFace: true,
    isEvalSupported: false,
  });
  const pdfDoc = await loadingTask.promise;
  const out = [];
  for (let p = 1; p <= pdfDoc.numPages; p++) {
    const page = await pdfDoc.getPage(p);
    const tc = await page.getTextContent();
    out.push(tc.items.map(it => it.str || "").join(" "));
  }
  return out.join("\n");
}

// Wrap Multer to capture its errors (like file too large)
function multerSingle(field) {
  const m = upload.single(field);
  return (req, res, next) => m(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "File too large (max 15MB)" });
      }
      return next(err);
    }
    next();
  });
}

// Upload + Analyze
app.post("/api/analyze", multerSingle("file"), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const ext = path.extname(file.originalname).toLowerCase();
    let text = "", source = "";

    if (ext === ".pdf") {
      const buf = await fs.readFile(file.path);
      const uint8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength); // Buffer -> Uint8Array view
      text = await extractPdfText(uint8);
      source = "pdf";
    } else if ([".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp"].includes(ext)) {
      const { data: { text: ocrText } } = await Tesseract.recognize(file.path, "eng");
      text = ocrText || "";
      source = "ocr";
    } else {
      return res.status(415).json({ error: "Unsupported file type. Upload a PDF or image." });
    }

    const suggestions = [];
    if (!/[#@]/.test(text)) suggestions.push("Consider adding relevant hashtags and mentions.");
    if (text.length < 80) suggestions.push("Post is short. Try adding context or a hook in the opening line.");
    if (!/(call to action|link|visit|learn more|subscribe|follow)/i.test(text))
      suggestions.push("Add a clear call-to-action (e.g., link, 'learn more', 'follow').");
    if (!/\n/.test(text)) suggestions.push("Break long text into short lines for readability.");

    res.json({
      filename: file.originalname,
      size: file.size,
      type: source,
      chars: text.length,
      preview: text.slice(0, 1200),
      fullText:text,
      suggestions,
    });
  } catch (err) {
    next(err);
  } finally {
    if (req.file?.path) fs.unlink(req.file.path).catch(() => {});
  }
});

// Global error handler (always returns JSON so fetch won't show "Failed to fetch")
app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err);
  res.status(500).json({ error: "Failed to analyze file", details: String(err?.message || err) });
});

// ---- Start server (auto-fallback port) ----
const HOST = process.env.HOST || "127.0.0.1";
const START_PORT = Number(process.env.PORT) || 8083;

function listenOn(port) {
  return new Promise((resolve, reject) => {
    const srv = app.listen(port, HOST, () => resolve({ srv, port }));
    srv.on("error", reject);
  });
}

async function start(port = START_PORT, tries = 10) {
  for (let i = 0; i < tries; i++) {
    try {
      const { port: p } = await listenOn(port + i);
      console.log(`Server running on http://${HOST}:${p}`);
      return;
    } catch (e) {
      if (e.code !== "EADDRINUSE") throw e;
      console.warn(`Port ${port + i} in use, trying ${port + i + 1}...`);
    }
  }
  throw new Error("No free port found.");
}

start().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
