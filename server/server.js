/* =========================================================
   LUNA — application server
   Serves the built site (dist/) + uploaded images + the API,
   all from one origin so the storefront and admin are same-origin.
   ========================================================= */
import express from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { UPLOAD_DIR } from "./db.js";
import { checkPassword, setLoginCookie, clearLoginCookie, isAuthed } from "./auth.js";
import productRoutes from "./products.routes.js";
import orderRoutes from "./orders.routes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "256kb" }));

/* ---- auth endpoints ---- */
app.post("/api/admin/login", (req, res) => {
  if (!checkPassword(req.body?.password)) {
    return res.status(401).json({ error: "Wrong password" });
  }
  setLoginCookie(res);
  res.json({ ok: true });
});

app.post("/api/admin/logout", (req, res) => {
  clearLoginCookie(res);
  res.json({ ok: true });
});

app.get("/api/admin/me", (req, res) => {
  res.json({ ok: isAuthed(req) });
});

/* ---- API ---- */
app.use("/api", productRoutes);
app.use("/api", orderRoutes);

/* unknown API route → JSON 404 (don't fall through to the SPA shell) */
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

/* ---- uploaded product images ---- */
app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "7d" }));

/* ---- the built static site ---- */
if (existsSync(DIST)) {
  app.use(express.static(DIST, { maxAge: "1h" }));
} else {
  console.warn(`[Luna] dist/ not found at ${DIST} — run "npm run build" first`);
}

/* multi-page site: serve index.html for any non-file route as a fallback */
app.get("*", (_req, res) => {
  const index = join(DIST, "index.html");
  if (existsSync(index)) return res.sendFile(index);
  res.status(503).send("Site not built. Run: npm run build");
});

const PORT = Number(process.env.PORT) || 80;
app.listen(PORT, () => {
  console.log(`[Luna] server listening on http://localhost:${PORT}`);
});
