/* =========================================================
   LUNA — store config
   Swap these for your real values before going live.
   ========================================================= */

/* Orders are POSTed here as JSON when a customer checks out.
   DUMMY placeholder — replace with your real endpoint.
   Easiest test: create a free URL at https://webhook.site and paste it here. */
export const ORDER_WEBHOOK = "https://webhook.site/00000000-0000-0000-0000-000000000000";

/* Delivery — flat rate across Pakistan, free over a threshold (PKR). */
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
