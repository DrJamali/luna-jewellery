/* =========================================================
   LUNA — order placement
   Sends the cart (product ids + quantities) to the API. The server
   recomputes prices/totals, stores the order, and returns it with a
   server-generated order number. A copy is kept locally for the
   confirmation screen.
   ========================================================= */
import { lines, clear } from "./cart.js";

const LAST_KEY = "luna_last_order";

/* customer = { name, phone, email, address, city, notes }
   payment  = { method: "cod" | "stripe" } */
export async function placeOrder(customer, payment) {
  const items = lines().map((l) => ({ id: l.id, qty: l.qty }));

  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ customer, payment, items }),
  });

  if (!res.ok) {
    let msg = "We couldn't place your order. Please try again.";
    try { const j = await res.json(); if (j?.error) msg = j.error; } catch { /* ignore */ }
    throw new Error(msg);
  }

  const order = await res.json();

  // keep a copy for the confirmation page
  try { localStorage.setItem(LAST_KEY, JSON.stringify(order)); } catch { /* ignore */ }

  clear();
  return order;
}

export function lastOrder() {
  try { return JSON.parse(localStorage.getItem(LAST_KEY) || "null"); }
  catch { return null; }
}
