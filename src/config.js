/* =========================================================
   LUNA — store config
   Swap these for your real values before going live.
   ========================================================= */

/* Orders are placed via the Luna API (same-origin POST /api/orders),
   stored in the server database and managed from the admin dashboard. */

/* Delivery — flat rate across Pakistan, free over a threshold (PKR).
   Mirrored server-side in server/orders.routes.js (SHIPPING). */
export const SHIPPING = {
  flat: 250,
  freeOver: 15000,
  label: "Delivery across Pakistan",
};

/* Payment methods. COD is live now; Stripe is wired for the future. */
export const PAYMENTS = {
  cod: true,      // Cash on Delivery — available now
  stripe: false,  // Card via Stripe — flip to true once keys + backend are ready
};
