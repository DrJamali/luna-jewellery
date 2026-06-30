/* =========================================================
   LUNA — product routes
   GET    /api/products            (public)
   POST   /api/admin/products      (auth, multipart)
   PUT    /api/admin/products/:id  (auth, multipart)
   DELETE /api/admin/products/:id  (auth)
   ========================================================= */
import { Router } from "express";
import multer from "multer";
import crypto from "node:crypto";
import { extname, basename, join } from "node:path";
import { existsSync, unlinkSync } from "node:fs";
import { UPLOAD_DIR } from "./db.js";
import {
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
} from "./db.js";
import { requireAuth } from "./auth.js";

const router = Router();

/* ---- image upload ---- */
const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = (extname(file.originalname) || "").toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(5).toString("hex")}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 8 }, // 8 MB each, up to 8 files
  fileFilter: (_req, file, cb) => {
    const ext = (extname(file.originalname) || "").toLowerCase();
    cb(null, ALLOWED.has(ext));
  },
});

/* ---- helpers ---- */
function slugify(s) {
  return String(s).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 60) || "piece";
}

function uniqueSlug(base) {
  let id = base, n = 1;
  while (getProduct(id)) id = `${base}-${++n}`;
  return id;
}

function parseList(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const j = JSON.parse(val);
    if (Array.isArray(j)) return j.map((x) => String(x).trim()).filter(Boolean);
  } catch { /* not JSON — fall through */ }
  return String(val).split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
}

function fieldsFromBody(body) {
  return {
    name: String(body.name || "").trim(),
    tag: String(body.tag || "").trim() || "Piece",
    price: Math.max(0, Math.round(Number(body.price) || 0)),
    blurb: String(body.blurb || "").trim(),
    story: String(body.story || "").trim(),
    materials: parseList(body.materials),
    dimensions: String(body.dimensions || "").trim(),
    care: String(body.care || "").trim(),
  };
}

const uploadedPaths = (files) => (files || []).map((f) => `uploads/${f.filename}`);

/* delete an image file only if it is one of ours under uploads/ */
function removeUpload(path) {
  if (!path || !path.startsWith("uploads/")) return;
  const file = join(UPLOAD_DIR, basename(path));
  try { if (existsSync(file)) unlinkSync(file); } catch { /* ignore */ }
}

/* ---- public ---- */
router.get("/products", (_req, res) => {
  res.json(listProducts());
});

/* ---- admin ---- */
router.post("/admin/products", requireAuth, upload.array("images", 8), (req, res) => {
  const f = fieldsFromBody(req.body);
  if (!f.name) return res.status(400).json({ error: "Name is required" });
  if (!f.price) return res.status(400).json({ error: "Price is required" });

  const id = uniqueSlug(slugify(f.name));
  const images = uploadedPaths(req.files);
  const product = createProduct({ id, ...f, images });
  res.status(201).json(product);
});

router.put("/admin/products/:id", requireAuth, upload.array("images", 8), (req, res) => {
  const existing = getProduct(req.params.id);
  if (!existing) return res.status(404).json({ error: "Not found" });

  const f = fieldsFromBody(req.body);
  if (!f.name) return res.status(400).json({ error: "Name is required" });

  // keepImages: which existing image paths to retain; new uploads are appended
  const keep = parseList(req.body.keepImages);
  const removed = existing.images.filter((img) => !keep.includes(img));
  removed.forEach(removeUpload);

  const images = [...keep, ...uploadedPaths(req.files)];
  const product = updateProduct(req.params.id, { ...f, images });
  res.json(product);
});

router.delete("/admin/products/:id", requireAuth, (req, res) => {
  const existing = getProduct(req.params.id);
  if (!existing) return res.status(404).json({ error: "Not found" });
  existing.images.forEach(removeUpload);
  deleteProduct(req.params.id);
  res.json({ ok: true });
});

export default router;
