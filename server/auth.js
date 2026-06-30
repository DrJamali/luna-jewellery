/* =========================================================
   LUNA — admin auth (single shared password)
   - Password is compared against a hash (scrypt). Supply either
     ADMIN_PASSWORD_HASH (preferred) or ADMIN_PASSWORD (hashed at boot).
   - On login we set an httpOnly cookie holding an HMAC-signed token
     ("exp.signature"), so sessions are stateless and survive restarts.
   ========================================================= */
import crypto from "node:crypto";

const COOKIE = "luna_admin";
const DAY = 24 * 60 * 60 * 1000;
const TTL = 7 * DAY; // a week

/* dev fallback secret/password so a fresh clone runs; OVERRIDE in production */
const SECRET = process.env.SESSION_SECRET || "luna-dev-secret-change-me";

/* ---- password hashing (scrypt: salt.hash, both hex) ---- */
export function hashPassword(plain) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(plain), salt, 64);
  return `${salt.toString("hex")}.${hash.toString("hex")}`;
}

function verifyPassword(plain, stored) {
  if (!stored || !stored.includes(".")) return false;
  const [saltHex, hashHex] = stored.split(".");
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(String(plain), salt, expected.length);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

/* resolve the configured password hash once */
const PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH ||
  hashPassword(process.env.ADMIN_PASSWORD || "luna-admin");

export const checkPassword = (plain) => verifyPassword(plain, PASSWORD_HASH);

/* ---- signed token: "<expMs>.<hmac>" ---- */
function sign(expMs) {
  return crypto.createHmac("sha256", SECRET).update(String(expMs)).digest("hex");
}

function makeToken() {
  const exp = Date.now() + TTL;
  return `${exp}.${sign(exp)}`;
}

function validToken(token) {
  if (!token || !token.includes(".")) return false;
  const [expStr, sig] = token.split(".");
  const exp = Number(expStr);
  if (!exp || Date.now() > exp) return false;
  const good = sign(exp);
  return sig.length === good.length &&
    crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good));
}

/* ---- tiny cookie helpers (no extra dependency) ---- */
function readCookie(req, name) {
  const raw = req.headers.cookie || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

export function setLoginCookie(res) {
  const token = makeToken();
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${token}; Path=/; HttpOnly; Max-Age=${Math.floor(TTL / 1000)}; SameSite=Lax`
  );
}

export function clearLoginCookie(res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`);
}

export function isAuthed(req) {
  return validToken(readCookie(req, COOKIE));
}

/* express middleware for /api/admin/* (except login) */
export function requireAuth(req, res, next) {
  if (isAuthed(req)) return next();
  res.status(401).json({ error: "unauthorized" });
}
