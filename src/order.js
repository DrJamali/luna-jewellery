/* =========================================================
   LUNA — order placement
   Builds the order payload and POSTs it to ORDER_WEBHOOK.
   Fire-and-forget: the order still succeeds for the customer
   even if the webhook is unreachable (it is queued locally).
   ========================================================= */
import { ORDER_WEBHOOK } from "./config.js";
import { lines, subtotal, shipping, total, clear } from "./cart.js";

const LAST_KEY = "luna_last_order";

function orderId() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LUNA-${ymd}-${rand}`;
}

/* customer = { name, phone, email, address, city, notes }
   payment  = { method: "cod" | "stripe" } */
export function buildOrder(customer, payment) {
  const items = lines().map((l) => ({
    id: l.id, name: l.name, tag: l.tag,
    price: l.price, qty: l.qty, lineTotal: l.lineTotal,
  }));
  const sub = subtotal();
  const ship = shipping(sub);
  return {
    orderId: orderId(),
    createdAt: new Date().toISOString(),
    source: "luna-web",
    currency: "PKR",
    customer,
    payment: { method: payment.method, status: payment.method === "cod" ? "pending_cod" : "unpaid" },
    items,
    totals: { subtotal: sub, shipping: ship, total: total(), count: items.reduce((a, i) => a + i.qty, 0) },
  };
}

/* Returns the order object on success. Webhook failure is non-fatal. */
export async function placeOrder(customer, payment) {
  const order = buildOrder(customer, payment);

  try {
    await fetch(ORDER_WEBHOOK, {
      method: "POST",
      mode: "no-cors", // lets the order reach arbitrary webhooks without CORS blocking
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
      keepalive: true,
    });
  } catch (err) {
    // network/endpoint down — keep the order locally so nothing is lost
    console.warn("[Luna] order webhook unreachable, order stored locally:", err);
  }

  // keep a copy of unsent orders for safety + the confirmation page
  try {
    const queue = JSON.parse(localStorage.getItem("luna_orders") || "[]");
    queue.push(order);
    localStorage.setItem("luna_orders", JSON.stringify(queue));
    localStorage.setItem(LAST_KEY, JSON.stringify(order));
  } catch {}

  clear();
  return order;
}

export function lastOrder() {
  try { return JSON.parse(localStorage.getItem(LAST_KEY) || "null"); }
  catch { return null; }
}
