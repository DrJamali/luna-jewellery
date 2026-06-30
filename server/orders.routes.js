/* =========================================================
   LUNA — order routes
   POST  /api/orders             (public — place an order)
   GET   /api/admin/orders       (auth — list, newest first)
   PATCH /api/admin/orders/:id   (auth — change status)

   Totals are recomputed server-side from DB prices; the client
   only sends product ids + quantities, so prices can't be tampered.
   ========================================================= */
import { Router } from "express";
import crypto from "node:crypto";
import { getProduct, createOrder, listOrders, getOrder, setOrderStatus } from "./db.js";
import { requireAuth } from "./auth.js";

const router = Router();

/* delivery rules — mirror src/config.js SHIPPING */
const SHIPPING = { flat: 250, freeOver: 15000 };
const STATUSES = ["new", "confirmed", "shipped", "delivered", "cancelled"];

function orderId() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `LUNA-${ymd}-${rand}`;
}

function clean(s, max = 400) {
  return String(s == null ? "" : s).trim().slice(0, max);
}

/* ---- public: place an order ---- */
router.post("/orders", (req, res) => {
  const body = req.body || {};
  const c = body.customer || {};

  const customer = {
    name: clean(c.name, 120),
    phone: clean(c.phone, 40),
    email: clean(c.email, 160),
    address: clean(c.address, 300),
    city: clean(c.city, 80),
    notes: clean(c.notes, 500),
  };
  if (!customer.name || !customer.phone || !customer.address || !customer.city) {
    return res.status(400).json({ error: "Missing delivery details" });
  }

  // rebuild line items from DB so prices are authoritative
  const reqItems = Array.isArray(body.items) ? body.items : [];
  const items = [];
  for (const it of reqItems) {
    const p = getProduct(String(it.id || ""));
    if (!p) continue;
    const qty = Math.max(1, Math.min(99, parseInt(it.qty, 10) || 1));
    items.push({ id: p.id, name: p.name, tag: p.tag, price: p.price, qty, lineTotal: p.price * qty });
  }
  if (!items.length) return res.status(400).json({ error: "Your bag is empty" });

  const subtotal = items.reduce((a, i) => a + i.lineTotal, 0);
  const ship = subtotal <= 0 ? 0 : subtotal >= SHIPPING.freeOver ? 0 : SHIPPING.flat;
  const total = subtotal + ship;
  const count = items.reduce((a, i) => a + i.qty, 0);

  const method = body.payment?.method === "stripe" ? "stripe" : "cod";

  const order = {
    orderId: orderId(),
    createdAt: new Date().toISOString(),
    customer,
    payment: { method, status: method === "cod" ? "pending_cod" : "unpaid" },
    items,
    totals: { subtotal, shipping: ship, total, count },
    status: "new",
  };

  const saved = createOrder(order);
  res.status(201).json(saved);
});

/* ---- admin ---- */
router.get("/admin/orders", requireAuth, (_req, res) => {
  res.json(listOrders());
});

router.patch("/admin/orders/:id", requireAuth, (req, res) => {
  const status = String(req.body?.status || "");
  if (!STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status" });
  if (!getOrder(req.params.id)) return res.status(404).json({ error: "Not found" });
  setOrderStatus(req.params.id, status);
  res.json(getOrder(req.params.id));
});

export default router;
