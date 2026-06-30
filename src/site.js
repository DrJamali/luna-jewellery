/* =========================================================
   LUNA — sub-pages (product / contact / privacy / refund)
   ========================================================= */
import { initCommon, reveals, toast } from "./common.js";
import { products, byId, pkr, cover, loadProducts } from "./products.js";
import { add as cartAdd } from "./cart.js";

const page = document.body.dataset.page;

const CHEV = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M15 6l-6 6 6 6"/></svg>`;

/* image gallery: fade slideshow with arrows, dots and swipe */
function buildGallery(root, images, name) {
  if (!root) return;
  const imgs = images && images.length ? images : [];
  root.innerHTML = `
    <div class="gal__stage">
      ${imgs.map((src, i) => `<img class="gal__img${i === 0 ? " is-active" : ""}" src="${src}" alt="${name} — view ${i + 1}"${i === 0 ? "" : ' loading="lazy"'} />`).join("")}
    </div>
    ${imgs.length > 1 ? `
    <button class="gal__nav gal__nav--prev" aria-label="Previous image">${CHEV}</button>
    <button class="gal__nav gal__nav--next" aria-label="Next image">${CHEV}</button>
    <div class="gal__dots">${imgs.map((_, i) => `<button class="gal__dot${i === 0 ? " is-active" : ""}" data-i="${i}" aria-label="View ${i + 1}"></button>`).join("")}</div>` : ""}
  `;
  if (imgs.length < 2) return;
  const slides = Array.from(root.querySelectorAll(".gal__img"));
  const dots = Array.from(root.querySelectorAll(".gal__dot"));
  let cur = 0;
  const go = (i) => {
    cur = (i + slides.length) % slides.length;
    slides.forEach((s, j) => s.classList.toggle("is-active", j === cur));
    dots.forEach((d, j) => d.classList.toggle("is-active", j === cur));
  };
  root.querySelector(".gal__nav--prev").addEventListener("click", () => go(cur - 1));
  root.querySelector(".gal__nav--next").addEventListener("click", () => go(cur + 1));
  dots.forEach((d) => d.addEventListener("click", () => go(+d.dataset.i)));
  let sx = null;
  root.addEventListener("pointerdown", (e) => { sx = e.clientX; });
  root.addEventListener("pointerup", (e) => { if (sx == null) return; const dx = e.clientX - sx; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1)); sx = null; });
}

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

  buildGallery(document.querySelector("#p-gallery"), p.images, p.name);

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
        <img src="${cover(r)}" alt="${r.name}" loading="lazy" />
        <span class="rcard__scrim"></span>
        <div class="rcard__info"><h3>${r.name}</h3><span>${pkr(r.price)}</span></div>
      </a>`).join("");
  }
}

function bindContact() {
  const form = document.getElementById("cform");
  if (!form) return;
  form.addEventListener("submit", (e) => { e.preventDefault(); form.classList.add("sent"); });
}

initCommon().then(async () => {
  await loadProducts();
  if (page === "product") buildProduct();
  if (page === "contact") bindContact();
  reveals();
});
