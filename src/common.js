/* =========================================================
   LUNA — shared chrome for every page
   nav + footer injection · preloader · Lenis · reveals · magnetic
   ========================================================= */
/* styles.css is loaded via a render-blocking <link> in each HTML head
   (not imported here) so the page paints fully styled on first frame,
   avoiding the flash of the unstyled preloader SVG. */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { products, pkr, STORE } from "./products.js";
import { add as cartAdd, count as cartCount, onChange as cartOnChange } from "./cart.js";

gsap.registerPlugin(ScrollTrigger);

export const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const isTouch = window.matchMedia("(hover: none)").matches;
export { gsap, ScrollTrigger };

const MOON = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M68 18 A38 38 0 1 0 68 82 A30 30 0 1 1 68 18 Z" /></svg>`;
const BAG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>`;

/* ---------- nav ---------- */
function renderNav() {
  const mount = document.getElementById("nav-mount");
  if (!mount) return;
  mount.innerHTML = `
    <nav class="nav" id="nav">
      <a href="index.html" class="nav__logo" aria-label="Luna home">${MOON}<span>LUNA</span></a>
      <div class="nav__links">
        <a href="shop.html">Shop</a>
        <a href="index.html#collection">Collection</a>
        <a href="contact.html">Contact</a>
      </div>
      <div class="nav__end">
        <a href="cart.html" class="nav__cart" aria-label="Cart" data-cart-link>${BAG}<span class="nav__cart__n" data-cart-count>0</span></a>
        <button class="nav__burger" aria-label="Menu" aria-expanded="false">
          <span></span><span></span>
        </button>
      </div>
    </nav>
    <div class="menu" id="menu" aria-hidden="true">
      <a href="index.html">Home</a>
      <a href="shop.html">Shop</a>
      <a href="index.html#collection">Collection</a>
      <a href="cart.html">Cart</a>
      <a href="contact.html">Contact</a>
      <a href="privacy.html">Privacy</a>
      <a href="refund.html">Refund</a>
    </div>`;

  const burger = mount.querySelector(".nav__burger");
  const menu = mount.querySelector("#menu");
  const close = () => { document.body.classList.remove("menu-open"); burger.setAttribute("aria-expanded", "false"); menu.setAttribute("aria-hidden", "true"); };
  burger.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    burger.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-hidden", String(!open));
  });
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
}

/* ---------- footer ---------- */
function renderFooter() {
  const mount = document.getElementById("footer-mount");
  if (!mount) return;
  const shopLinks = products
    .map((p) => `<a href="product.html?id=${p.id}">${p.name.replace(" Earrings", "").replace(" Necklace", "")}</a>`)
    .join("");
  mount.innerHTML = `
    <footer class="footer">
      <div class="footer__grid">
        <div class="footer__brand">
          <div class="footer__logo">${MOON} LUNA</div>
          <p>Pretty everyday jewellery from Lahore. Wear the moon, carry the night.</p>
        </div>
        <div class="footer__col">
          <h4>Shop</h4>
          <a href="shop.html">All pieces</a>
          ${shopLinks}
          <a href="cart.html">Cart</a>
        </div>
        <div class="footer__col">
          <h4>Luna</h4>
          <a href="index.html#atelier">About</a>
          <a href="contact.html">Contact &amp; store</a>
          <a href="privacy.html">Privacy policy</a>
          <a href="refund.html">Refund policy</a>
        </div>
        <div class="footer__col footer__visit">
          <h4>Visit</h4>
          <p>${STORE.name}<br>${STORE.address}</p>
          <p>${STORE.hours}</p>
          <a href="${STORE.maps}" target="_blank" rel="noopener">Get directions</a>
        </div>
      </div>
      <div class="footer__bottom">
        <span>© 2026 Luna Jewellery · ${STORE.address}</span>
        <span>All prices in PKR (Rs)</span>
      </div>
    </footer>`;
}

/* ---------- preloader ---------- */
function runPreloader(done) {
  const pre = document.getElementById("preloader");
  const bar = document.getElementById("pl-bar");
  if (!pre) return done();
  if (reduced) { pre.style.display = "none"; return done(); }
  gsap.timeline({ onComplete: () => { pre.style.display = "none"; done(); } })
    .set(bar, { scaleX: 0 })
    .to(bar, { scaleX: 1, duration: 1.0, ease: "power2.inOut" })
    .to(".preloader__moon", { rotate: 14, scale: 1.06, duration: 1.0, ease: "power2.out" }, 0)
    .to(".preloader__inner", { y: -8, opacity: 0, duration: 0.4, ease: "power2.in" }, "+=0.05")
    .to(pre, { yPercent: -100, duration: 0.75, ease: "power4.inOut" }, "-=0.1");
}

/* ---------- Lenis smooth scroll ---------- */
function initLenis() {
  if (reduced) return null;
  const lenis = new Lenis({
    lerp: 0.1,                   // snappier follow — 0.075 felt floaty/laggy
    wheelMultiplier: 1.0,
    smoothWheel: true,
    syncTouch: false,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

/* ---------- nav scrolled state ---------- */
function navState() {
  const nav = document.getElementById("nav");
  if (!nav) return;
  const upd = (y) => nav.classList.toggle("scrolled", y > 30);
  ScrollTrigger.create({ start: "top -30", end: 99999, onUpdate: (s) => upd(s.scroll()) });
  upd(window.scrollY);
}

/* ---------- anchor smooth scroll ---------- */
function anchorScroll(lenis) {
  document.querySelectorAll('a[href*="#"]').forEach((a) => {
    const href = a.getAttribute("href");
    const hashIdx = href.indexOf("#");
    const path = href.slice(0, hashIdx);
    const onThisPage = path === "" || path === "index.html" ? location.pathname.endsWith("index.html") || location.pathname.endsWith("/") : false;
    if (hashIdx === 0 || (onThisPage && path === "index.html")) {
      a.addEventListener("click", (e) => {
        const id = href.slice(hashIdx);
        const el = document.querySelector(id);
        if (!el) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(el, { offset: -10 });
        else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
        document.body.classList.remove("menu-open");
      });
    }
  });
}

/* ---------- magnetic buttons ---------- */
export function magnetic(scope = document) {
  if (isTouch) return;
  scope.querySelectorAll("[data-magnetic]").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - (r.left + r.width / 2)) * 0.3, y: (e.clientY - (r.top + r.height / 2)) * 0.4, duration: 0.6, ease: "power3.out" });
    });
    el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.4)" }));
  });
}

/* ---------- generic reveals (sub-pages) ---------- */
export function reveals(scope = document) {
  scope.querySelectorAll(".reveal").forEach((el) => {
    if (reduced) { el.style.opacity = 1; return; }
    gsap.fromTo(el, { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 86%" },
    });
  });
}

/* ---------- cart badge ---------- */
let _lastCartN = 0;
function refreshCartBadge() {
  const n = cartCount();
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = String(n);
    el.classList.toggle("is-empty", n === 0);
    if (n > _lastCartN && n > 0) gsap.fromTo(el, { scale: 0.3 }, { scale: 1, duration: 0.5, ease: "back.out(3.5)" });
  });
  _lastCartN = n;
}

/* ---------- toast ---------- */
let toastEl = null;
export function toast(msg) {
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.className = "toast";
    document.body.appendChild(toastEl);
  }
  toastEl.innerHTML = msg;
  toastEl.classList.add("show");
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => toastEl.classList.remove("show"), 2600);
}

/* ---------- fly-to-cart: a thumbnail of the piece arcs into the cart icon ---------- */
function flyToCart(btn) {
  if (reduced) return;
  const cart = document.querySelector("[data-cart-link]") || document.querySelector(".nav__cart");
  const card = btn.closest(".scard, .gpanel, .pdp");
  const media = card && card.querySelector(".scard__media, .gpanel__media, .pdp__media, img");
  if (!cart || !media) return;
  const m = media.getBoundingClientRect();
  const c = cart.getBoundingClientRect();
  if (!m.width || !c.width) return;
  const size = Math.min(m.width, 150);
  const img = media.querySelector ? media.querySelector("img") : null;
  const poster = (img && (img.currentSrc || img.getAttribute("src"))) || null;
  const fly = document.createElement("div");
  fly.style.cssText =
    `position:fixed;left:${m.left + m.width / 2 - size / 2}px;top:${m.top + m.height / 2 - size / 2}px;` +
    `width:${size}px;height:${size}px;border-radius:18px;z-index:120;pointer-events:none;` +
    `background:${poster ? `#0b0b12 url('${poster}') center/cover` : "linear-gradient(180deg,#f3deae,#e6cb8d)"};` +
    `box-shadow:0 24px 60px -22px rgba(0,0,0,.75);will-change:transform,opacity;`;
  document.body.appendChild(fly);
  const tx = c.left + c.width / 2 - (m.left + m.width / 2);
  const ty = c.top + c.height / 2 - (m.top + m.height / 2);
  gsap.timeline({ onComplete: () => fly.remove() })
    .to(fly, { duration: 0.5, x: tx * 0.45, y: ty - 60, scale: 0.7, ease: "power2.out" })
    .to(fly, { duration: 0.45, x: tx, y: ty, scale: 0.1, opacity: 0.3, rotation: 18, ease: "power2.in" })
    .fromTo(cart, { scale: 1 }, { scale: 1.22, duration: 0.18, ease: "back.out(4)", yoyo: true, repeat: 1 }, "-=0.12");
}

/* ---------- pointer-driven 3D tilt for product cards ---------- */
export function cardTilt(scope = document) {
  if (reduced || !window.matchMedia("(hover:hover) and (pointer:fine)").matches) return;
  scope.querySelectorAll(".scard").forEach((card) => {
    if (card.dataset.tilt) return;
    card.dataset.tilt = "1";
    const ry = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3.out" });
    const rx = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3.out" });
    const ly = gsap.quickTo(card, "y", { duration: 0.5, ease: "power3.out" });
    gsap.set(card, { transformPerspective: 1000, transformOrigin: "center" });
    card.addEventListener("mouseenter", () => ly(-10));
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 10);
      rx((0.5 - (e.clientY - r.top) / r.height) * 10);
    });
    card.addEventListener("mouseleave", () => { ry(0); rx(0); ly(0); });
  });
}

/* ---------- global "add to bag" (delegated, works on every page) ---------- */
function bindAddToCart() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    e.preventDefault();
    const id = btn.getAttribute("data-add");
    const p = products.find((x) => x.id === id);
    if (!p) return;
    cartAdd(id, 1);
    flyToCart(btn);
    const wasText = btn.querySelector("span");
    if (wasText && !btn.dataset.busy) {
      btn.dataset.busy = "1";
      const orig = wasText.textContent;
      wasText.textContent = "Added ✓";
      setTimeout(() => { wasText.textContent = orig; delete btn.dataset.busy; }, 1400);
    }
    toast(`<strong>${p.name}</strong> added to your bag · <a href="cart.html">View bag →</a>`);
  });
}

/* ---------- video playback governor ----------
   Only videos in (or near) the viewport are allowed to decode. This caps the
   number of simultaneous 720p decoders to ~1-2 at a time — six videos decoding
   at once is what made scrolling jitter and starved the hero on first load.
   Call playInView(scope) after injecting any markup that contains <video>. */
let _vio = null;
export function playInView(scope = document) {
  if (!("IntersectionObserver" in window)) {
    scope.querySelectorAll("video").forEach((v) => { v.muted = true; const p = v.play(); p && p.catch && p.catch(() => {}); });
    return null;
  }
  if (!_vio) {
    _vio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const v = e.target;
        if (e.isIntersecting) { if (v.paused) { const p = v.play(); p && p.catch && p.catch(() => {}); } }
        else if (!v.paused) v.pause();
      });
    }, { rootMargin: "300px", threshold: 0.01 });
  }
  scope.querySelectorAll("video").forEach((v) => {
    v.muted = true;
    if (!v.dataset.govern) { v.dataset.govern = "1"; _vio.observe(v); }
  });
  return _vio;
}

/* back-compat alias */
export const startVideos = playInView;

/* ---------- fps meter (load any page with ?fps to enable) ---------- */
function fpsMeter() {
  if (!/[?&]fps/.test(location.search)) return;
  const el = document.createElement("div");
  el.style.cssText = "position:fixed;left:10px;bottom:10px;z-index:9999;font:600 13px/1.3 monospace;color:#0f0;background:rgba(0,0,0,.8);padding:6px 10px;border-radius:8px;pointer-events:none;white-space:pre";
  document.body.appendChild(el);
  let frames = 0, last = performance.now(), lo = 999;
  const loop = (t) => {
    frames++;
    if (t - last >= 500) {
      const fps = Math.round((frames * 1000) / (t - last));
      lo = Math.min(lo, fps);
      const playing = [...document.querySelectorAll("video")].filter((v) => !v.paused).length;
      el.textContent = `${fps} fps  (min ${lo})\n${playing} videos playing`;
      frames = 0; last = t;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/* ---------- boot common; returns { lenis } once preloader is gone ---------- */
export function initCommon() {
  fpsMeter();
  renderNav();
  renderFooter();
  startVideos();
  bindAddToCart();
  refreshCartBadge();
  cartOnChange(refreshCartBadge);
  return new Promise((res) => {
    runPreloader(() => {
      const lenis = initLenis();
      navState();
      anchorScroll(lenis);
      magnetic();
      res({ lenis });
    });
  });
}
