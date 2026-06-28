/* =========================================================
   LUNA — cart (localStorage, no backend)
   Stores { [productId]: qty }. Emits "luna:cart" on every change.
   ========================================================= */
import { byId, products } from "./products.js";
import { SHIPPING } from "./config.js";

const KEY = "luna_cart_v1";

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    // keep only ids that still exist in the catalogue
    const clean = {};
    Object.keys(raw).forEach((id) => {
      if (products.some((p) => p.id === id)) {
        const q = Math.max(1, Math.min(99, parseInt(raw[id], 10) || 1));
        clean[id] = q;
      }
    });
    return clean;
  } catch {
    return {};
  }
}

function write(map) {
  localStorage.setItem(KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent("luna:cart", { detail: { count: count() } }));
}

/* ---------- reads ---------- */
export function lines() {
  const map = read();
  return Object.keys(map).map((id) => {
    const p = byId(id);
    const qty = map[id];
    return { ...p, qty, lineTotal: p.price * qty };
  });
}

export function count() {
  const map = read();
  return Object.values(map).reduce((a, b) => a + b, 0);
}

export function subtotal() {
  return lines().reduce((a, l) => a + l.lineTotal, 0);
}

export function shipping(sub = subtotal()) {
  if (sub <= 0) return 0;
  return sub >= SHIPPING.freeOver ? 0 : SHIPPING.flat;
}

export function total() {
  const sub = subtotal();
  return sub + shipping(sub);
}

/* ---------- writes ---------- */
export function add(id, qty = 1) {
  if (!products.some((p) => p.id === id)) return;
  const map = read();
  map[id] = Math.min(99, (map[id] || 0) + qty);
  write(map);
}

export function setQty(id, qty) {
  const map = read();
  const q = Math.max(0, Math.min(99, parseInt(qty, 10) || 0));
  if (q <= 0) delete map[id];
  else map[id] = q;
  write(map);
}

export function remove(id) {
  const map = read();
  delete map[id];
  write(map);
}

export function clear() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("luna:cart", { detail: { count: 0 } }));
}

/* ---------- subscribe ---------- */
export function onChange(cb) {
  window.addEventListener("luna:cart", cb);
  // also react to cart edits made in another tab
  window.addEventListener("storage", (e) => { if (e.key === KEY) cb(); });
}
