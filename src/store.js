/* =========================================================
   LUNA — store pages (shop / cart / checkout)
   ========================================================= */
import { initCommon, reveals, toast, playInView } from "./common.js";
import { products, pkr } from "./products.js";
import { SHIPPING, PAYMENTS } from "./config.js";
import { lines, subtotal, shipping, total, setQty, remove, count } from "./cart.js";
import { placeOrder } from "./order.js";

const page = document.body.dataset.page;

const ARROW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;

/* ============================ SHOP ============================ */
function buildShop() {
  const grid = document.getElementById("shop-grid");
  if (!grid) return;
  grid.innerHTML = products.map((p) => `
    <article class="scard">
      <a class="scard__media" href="product.html?id=${p.id}" aria-label="${p.name}">
        <video muted loop playsinline preload="metadata" poster="${p.poster}"><source src="${p.video}" type="video/mp4" /></video>
        <span class="scard__scrim"></span>
        <span class="scard__tag">${p.tag}</span>
      </a>
      <div class="scard__body">
        <h3><a href="product.html?id=${p.id}">${p.name}</a></h3>
        <p>${p.blurb}</p>
        <div class="scard__foot">
          <span class="scard__price">${pkr(p.price)}</span>
          <div class="scard__acts">
            <a class="scard__view" href="product.html?id=${p.id}">View ${ARROW}</a>
            <button class="scard__add" data-add="${p.id}"><span>Add to bag</span></button>
          </div>
        </div>
      </div>
    </article>`).join("");
  playInView(grid);
}

/* ============================ CART ============================ */
function fmtShip(sub) {
  if (sub <= 0) return "—";
  return shipping(sub) === 0 ? "Free" : pkr(shipping(sub));
}

function buildCart() {
  const root = document.getElementById("cart-root");
  const linesEl = document.getElementById("cart-lines");
  const empty = document.getElementById("cart-empty");
  if (!linesEl) return;

  const render = () => {
    const items = lines();
    const isEmpty = items.length === 0;
    root.hidden = isEmpty;
    empty.hidden = !isEmpty;
    if (isEmpty) return;

    linesEl.innerHTML = items.map((l) => `
      <div class="cline" data-id="${l.id}">
        <a class="cline__media" href="product.html?id=${l.id}">
          <video muted loop playsinline preload="metadata" poster="${l.poster}"><source src="${l.video}" type="video/mp4" /></video>
        </a>
        <div class="cline__info">
          <span class="cline__tag">${l.tag}</span>
          <h3><a href="product.html?id=${l.id}">${l.name}</a></h3>
          <span class="cline__unit">${pkr(l.price)} each</span>
          <button class="cline__remove" data-remove="${l.id}">Remove</button>
        </div>
        <div class="qty" aria-label="Quantity">
          <button type="button" class="qty__btn" data-dec="${l.id}" aria-label="Decrease">−</button>
          <span class="qty__n">${l.qty}</span>
          <button type="button" class="qty__btn" data-inc="${l.id}" aria-label="Increase">+</button>
        </div>
        <div class="cline__total">${pkr(l.lineTotal)}</div>
      </div>`).join("");

    playInView(linesEl);

    const sub = subtotal();
    document.getElementById("sum-subtotal").textContent = pkr(sub);
    document.getElementById("sum-shipping").textContent = fmtShip(sub);
    document.getElementById("sum-total").textContent = pkr(total());
  };

  // delegated controls
  linesEl.addEventListener("click", (e) => {
    const inc = e.target.closest("[data-inc]");
    const dec = e.target.closest("[data-dec]");
    const rm = e.target.closest("[data-remove]");
    if (inc) { const id = inc.dataset.inc; const cur = lines().find((l) => l.id === id); setQty(id, (cur?.qty || 1) + 1); render(); }
    if (dec) { const id = dec.dataset.dec; const cur = lines().find((l) => l.id === id); setQty(id, (cur?.qty || 1) - 1); render(); }
    if (rm) { remove(rm.dataset.remove); render(); }
  });

  render();
}

/* ========================== CHECKOUT ========================== */
function renderSummary() {
  const wrap = document.getElementById("co-items");
  if (!wrap) return;
  const items = lines();
  wrap.innerHTML = items.map((l) => `
    <div class="summary__item">
      <span class="summary__q">${l.qty}×</span>
      <span class="summary__name">${l.name}</span>
      <span class="summary__price">${pkr(l.lineTotal)}</span>
    </div>`).join("");
  const sub = subtotal();
  document.getElementById("co-subtotal").textContent = pkr(sub);
  document.getElementById("co-shipping").textContent = fmtShip(sub);
  document.getElementById("co-total").textContent = pkr(total());
}

function renderPayments() {
  const box = document.getElementById("pay-options");
  if (!box) return;
  const cod = `
    <label class="pay__opt ${PAYMENTS.cod ? "" : "is-off"}">
      <input type="radio" name="payment" value="cod" ${PAYMENTS.cod ? "checked" : "disabled"} />
      <span class="pay__main">
        <span class="pay__title">Cash on Delivery</span>
        <span class="pay__sub">Pay in cash when your pieces arrive. Available across Pakistan.</span>
      </span>
      <span class="pay__badge">Available</span>
    </label>`;
  const stripe = `
    <label class="pay__opt is-off">
      <input type="radio" name="payment" value="stripe" disabled />
      <span class="pay__main">
        <span class="pay__title">Card payment</span>
        <span class="pay__sub">Visa, Mastercard and more via Stripe.</span>
      </span>
      <span class="pay__badge pay__badge--soon">Coming soon</span>
    </label>`;
  box.innerHTML = cod + stripe;
}

function buildCheckout() {
  const form = document.getElementById("order-form");
  const root = document.getElementById("checkout-root");
  const confirm = document.getElementById("confirm");
  if (!form) return;

  // empty bag → send to cart
  if (count() === 0) {
    root.innerHTML = `<div class="empty" style="grid-column:1/-1">
      <div class="empty__moon"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M68 18 A38 38 0 1 0 68 82 A30 30 0 1 1 68 18 Z" /></svg></div>
      <h2>Your bag is empty</h2>
      <p>Add a piece before checking out.</p>
      <a href="shop.html" class="btn btn--solid" data-magnetic><span>Browse the collection</span></a></div>`;
    return;
  }

  renderSummary();
  renderPayments();

  const err = document.getElementById("order-err");
  const btn = document.getElementById("place-order");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.hidden = true;

    const data = Object.fromEntries(new FormData(form).entries());
    const required = { name: "your name", phone: "a phone number", address: "a delivery address", city: "your city" };
    const missing = Object.keys(required).filter((k) => !String(data[k] || "").trim());
    if (missing.length) {
      err.textContent = `Please add ${required[missing[0]]} so we can deliver your order.`;
      err.hidden = false;
      form.querySelector(`[name="${missing[0]}"]`)?.focus();
      return;
    }
    if (!/[0-9]{7,}/.test(String(data.phone).replace(/\D/g, ""))) {
      err.textContent = "Please enter a valid phone number we can reach you on.";
      err.hidden = false;
      form.querySelector('[name="phone"]')?.focus();
      return;
    }

    const method = (new FormData(form).get("payment")) || "cod";

    btn.disabled = true;
    btn.querySelector("span").textContent = "Placing order…";

    const order = await placeOrder({
      name: data.name.trim(), phone: data.phone.trim(),
      email: (data.email || "").trim(), address: data.address.trim(),
      city: data.city.trim(), notes: (data.notes || "").trim(),
    }, { method });

    // show confirmation
    root.hidden = true;
    confirm.hidden = false;
    document.getElementById("cf-id").textContent = order.orderId;
    document.getElementById("cf-total").textContent = pkr(order.totals.total);
    document.getElementById("cf-pay").textContent = method === "cod" ? "Cash on Delivery" : "Card";
    document.getElementById("cf-note").textContent = method === "cod"
      ? `Please keep ${pkr(order.totals.total)} ready for the courier. We will WhatsApp you to confirm delivery.`
      : "We will be in touch to complete payment.";
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast(`Order <strong>${order.orderId}</strong> placed ✦`);
  });
}

/* ============================ boot ============================ */
initCommon().then(() => {
  if (page === "shop") buildShop();
  if (page === "cart") buildCart();
  if (page === "checkout") buildCheckout();
  reveals();
});
