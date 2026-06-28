/* =========================================================
   LUNA — sub-pages (product / contact / privacy / refund)
   ========================================================= */
import { initCommon, reveals, toast, playInView } from "./common.js";
import { products, byId, pkr } from "./products.js";
import { add as cartAdd } from "./cart.js";

const page = document.body.dataset.page;

function buildProduct() {
  const id = new URLSearchParams(location.search).get("id");
  const p = byId(id);
  document.title = `${p.name} · LUNA`;
  const set = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = val; };

  set("#p-crumb", p.name);
  set("#p-tag", p.tag);
  set("#p-name", p.name);
  set("#p-price", pkr(p.price));
  set("#p-blurb", p.blurb);
  set("#p-story", p.story);
  set("#p-dimensions", p.dimensions);
  set("#p-care", p.care);

  const vid = document.querySelector("#p-video");
  if (vid) { vid.poster = p.poster; vid.querySelector("source").src = p.video; vid.load(); vid.muted = true; const pp = vid.play(); pp && pp.catch && pp.catch(() => {}); }

  const mats = document.querySelector("#p-materials");
  if (mats) mats.innerHTML = p.materials.map((m) => `<li>${m}</li>`).join("");

  const wa = document.querySelector("#p-wa");
  if (wa) { const msg = encodeURIComponent(`Hi Luna! I would love to enquire about the ${p.name} (${pkr(p.price)}).`); wa.href = `https://wa.me/923001234567?text=${msg}`; }

  /* quantity stepper + add to bag */
  const qEl = document.querySelector("#p-qty");
  let qty = 1;
  const draw = () => { if (qEl) qEl.textContent = String(qty); };
  document.querySelector("#p-minus")?.addEventListener("click", () => { qty = Math.max(1, qty - 1); draw(); });
  document.querySelector("#p-plus")?.addEventListener("click", () => { qty = Math.min(99, qty + 1); draw(); });
  document.querySelector("#p-add")?.addEventListener("click", () => {
    cartAdd(p.id, qty);
    toast(`<strong>${p.name}</strong> ×${qty} added to your bag · <a href="cart.html">View bag →</a>`);
  });

  const rel = document.querySelector("#p-related");
  if (rel) {
    rel.innerHTML = products.filter((x) => x.id !== p.id).map((r) => `
      <a class="rcard" href="product.html?id=${r.id}">
        <video muted loop playsinline preload="metadata" poster="${r.poster}"><source src="${r.video}" type="video/mp4" /></video>
        <span class="rcard__scrim"></span>
        <div class="rcard__info"><h3>${r.name}</h3><span>${pkr(r.price)}</span></div>
      </a>`).join("");
    playInView(rel);
  }
}

function bindContact() {
  const form = document.getElementById("cform");
  if (!form) return;
  form.addEventListener("submit", (e) => { e.preventDefault(); form.classList.add("sent"); });
}

initCommon().then(() => {
  if (page === "product") buildProduct();
  if (page === "contact") bindContact();
  reveals();
});
