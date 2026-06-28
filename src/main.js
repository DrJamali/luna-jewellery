/* =========================================================
   LUNA — home
   Lenis smooth scroll · horizontal pinned gallery · vertical film sections
   ========================================================= */
import { initCommon, magnetic, reduced, gsap, ScrollTrigger } from "./common.js";
import { products, pkr } from "./products.js";

/* split a heading into masked, rising words */
function splitWords(el) {
  if (!el) return [];
  const inners = [];
  const walk = (node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === 3) {
        if (child.textContent.trim() === "") return;
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((tok) => {
          if (tok.trim() === "") { frag.appendChild(document.createTextNode(tok)); return; }
          const w = document.createElement("span"); w.className = "w";
          const wi = document.createElement("span"); wi.className = "wi"; wi.textContent = tok;
          w.appendChild(wi); frag.appendChild(w); inners.push(wi);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1 && child.tagName !== "BR") walk(child);
    });
  };
  walk(el);
  return inners;
}

const ARROW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;

/* ---------- rail + film HUD (macro sections) ---------- */
function railHud(lenis) {
  const secs = Array.from(document.querySelectorAll("[data-rail]"));
  const rail = document.getElementById("rail");
  const chNow = document.getElementById("ch-now");
  const chTotal = document.getElementById("ch-total");
  const chLabel = document.getElementById("ch-label");
  const labels = secs.map((s) => s.dataset.label || "");
  const pad2 = (n) => String(n).padStart(2, "0");
  if (chTotal) chTotal.textContent = pad2(secs.length);

  const btns = secs.map((s, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.setAttribute("aria-label", labels[i]);
    b.innerHTML = `<span class="txt">${labels[i]}</span><span class="dot"></span>`;
    b.addEventListener("click", () => { lenis ? lenis.scrollTo(s, { offset: -10 }) : s.scrollIntoView({ behavior: "smooth" }); });
    rail && rail.appendChild(b);
    return b;
  });

  let cur = -1;
  const set = (i) => {
    if (i === cur) return; cur = i;
    if (chNow) chNow.textContent = pad2(i + 1);
    if (chLabel) chLabel.textContent = labels[i];
    btns.forEach((b, j) => b.classList.toggle("is-active", j === i));
  };
  secs.forEach((s, i) => ScrollTrigger.create({ trigger: s, start: "top 55%", end: "bottom 45%", onEnter: () => set(i), onEnterBack: () => set(i) }));
  set(0);
}

/* ---------- vertical cinematic sections ---------- */
function verticalSections() {
  document.querySelectorAll(".chapter").forEach((ch) => {
    const inners = !reduced ? splitWords(ch.querySelector(".ch__title")) : [];
    const revs = Array.from(ch.querySelectorAll(".ch-rev"));

    if (!reduced) {
      if (inners.length) gsap.set(inners, { yPercent: 118 });
      if (revs.length) gsap.set(revs, { y: 34, opacity: 0 });
    } else {
      revs.forEach((r) => (r.style.opacity = 1));
    }

    const intro = () => {
      if (reduced) return;
      const tl = gsap.timeline();
      if (inners.length) tl.to(inners, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.07 });
      if (revs.length) tl.to(revs, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.08 }, 0.2);
    };

    let seen = false;
    ScrollTrigger.create({
      trigger: ch, start: "top 72%", end: "bottom top",
      /* is-active is added once and NEVER removed: the ken-burns zoom plays a
         single time per section. Re-adding it on every scroll-back re-ran the
         7.5s scale transition on top of the video resuming = the jitter.
         Playback itself is handled by the viewport governor (playInView). */
      onEnter: () => { if (!seen) { seen = true; intro(); } ch.classList.add("is-active"); },
    });

    /* fire intro for whatever is on screen at load (hero) */
    if (ch.getBoundingClientRect().top < window.innerHeight * 0.75) { seen = true; intro(); ch.classList.add("is-active"); }
  });
}

/* ---------- horizontal product gallery (pinned) ---------- */
function gallery() {
  const sec = document.querySelector(".gallery");
  const track = document.querySelector(".gallery__track");
  if (!sec || !track) return;
  const n = products.length;

  track.innerHTML = products.map((p, i) => `
    <article class="gpanel" data-i="${i}">
      <a class="gpanel__media" href="product.html?id=${p.id}" aria-label="${p.name}">
        <video muted loop playsinline preload="auto" poster="${p.poster}"><source src="${p.video}" type="video/mp4" /></video>
        <span class="gpanel__scrim"></span>
      </a>
      <div class="gpanel__info">
        <span class="gpanel__idx g-rev">${String(i + 1).padStart(2, "0")} — ${String(n).padStart(2, "0")} · ${p.tag}</span>
        <h3 class="gpanel__title">${p.name}</h3>
        <p class="g-rev">${p.blurb}</p>
        <div class="gpanel__foot g-rev">
          <span class="gpanel__price">${pkr(p.price)}</span>
          <div class="gpanel__acts">
            <button class="gpanel__add" data-add="${p.id}"><span>Add to bag</span></button>
            <a class="gpanel__cta" href="product.html?id=${p.id}" data-magnetic>View ${ARROW}</a>
          </div>
        </div>
      </div>
    </article>`).join("");

  magnetic(track);
  const panels = gsap.utils.toArray(".gpanel", track);
  const vids = panels.map((p) => p.querySelector("video"));
  vids.forEach((v) => v && (v.muted = true));
  const gNow = document.getElementById("g-now");
  const setNow = (i) => { if (gNow) gNow.textContent = String(i + 1).padStart(2, "0"); };

  /* Play ONLY the centred panel, and only while the gallery is on screen.
     The 4 panels share a vertical position, so a generic IntersectionObserver
     fires all of them at once (= 4 videos decoding in the hero, ~36fps). We
     gate them by hand so exactly one 720p stream ever decodes here. */
  let galleryVisible = false;
  let active = 0;
  /* keep the centred panel AND its neighbour peeking in playing — max 2 at a
     time (≈50fps on a modest GPU) instead of all four (which tanked to 36fps) */
  const playOnly = (i) => {
    active = i;
    const keep = new Set([i]);
    if (i + 1 < vids.length) keep.add(i + 1);
    else if (i - 1 >= 0) keep.add(i - 1);
    vids.forEach((v, j) => {
      if (!v) return;
      if (keep.has(j) && galleryVisible) { if (v.paused) { const p = v.play(); p && p.catch && p.catch(() => {}); } }
      else if (!v.paused) v.pause();
    });
  };
  /* Visibility via IntersectionObserver, NOT ScrollTrigger: the gallery pins
     (position:fixed) during the horizontal scroll, which fooled a ScrollTrigger
     into reporting "not visible" — so only the first panel's video ever played.
     IO reads the real rendered box and stays correct while pinned. */
  new IntersectionObserver(([e]) => {
    galleryVisible = e.isIntersecting;
    if (galleryVisible) playOnly(active);
    else vids.forEach((v) => v && !v.paused && v.pause());
  }, { threshold: 0.01 }).observe(sec);

  /* prep entrance for each panel */
  panels.forEach((panel) => {
    const inners = reduced ? [] : splitWords(panel.querySelector(".gpanel__title"));
    const revs = Array.from(panel.querySelectorAll(".g-rev"));
    if (!reduced) { gsap.set(inners, { yPercent: 118 }); gsap.set(revs, { y: 22, opacity: 0 }); }
    panel._intro = () => {
      if (reduced) return;
      const tl = gsap.timeline();
      tl.to(inners, { yPercent: 0, duration: 1, ease: "expo.out", stagger: 0.06 });
      tl.to(revs, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.07 }, 0.1);
    };
  });

  const desktop = !reduced && window.matchMedia("(min-width: 761px)").matches;

  if (desktop) {
    /* pinned horizontal scroll: vertical wheel drives the rail sideways */
    let cur = -1;
    const activate = (i) => {
      if (i === cur) return; cur = i; setNow(i); playOnly(i);
      panels.forEach((p, j) => p.classList.toggle("is-active", j === i));
      if (!panels[i].dataset.seen) { panels[i].dataset.seen = "1"; panels[i]._intro(); }
    };
    const amt = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tween = gsap.to(track, {
      x: () => -amt(), ease: "none",
      scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + amt() * 1.15, pin: true, scrub: 1.1, anticipatePin: 1, invalidateOnRefresh: true, onToggle: (s) => sec.classList.toggle("is-live", s.isActive) },
    });
    panels.forEach((panel, i) => ScrollTrigger.create({ trigger: panel, containerAnimation: tween, start: "left 72%", end: "right 28%", onEnter: () => activate(i), onEnterBack: () => activate(i) }));
    activate(0);
  } else {
    /* touch / reduced-motion: native horizontal scroll, counter follows */
    sec.classList.add("is-static");
    panels.forEach((p, i) => { p.classList.toggle("is-active", i === 0); p._intro(); });
    setNow(0);
    let tk = false;
    track.addEventListener("scroll", () => {
      if (tk) return; tk = true;
      requestAnimationFrame(() => {
        tk = false;
        const c = track.scrollLeft + track.clientWidth / 2;
        let best = Infinity, bi = 0;
        panels.forEach((p, i) => { const pc = p.offsetLeft + p.offsetWidth / 2; const d = Math.abs(pc - c); if (d < best) { best = d; bi = i; } });
        panels.forEach((p, i) => p.classList.toggle("is-active", i === bi));
        setNow(bi); playOnly(bi);
      });
    }, { passive: true });
  }
}

/* ---------- top progress ---------- */
function progressBar() {
  const bar = document.getElementById("progress");
  if (!bar || reduced) return;
  gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 } });
}

/* ---------- starfield (house) ---------- */
function stars() {
  const canvas = document.getElementById("house-stars");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let pts = [];
  const size = () => {
    const r = canvas.parentElement.getBoundingClientRect();
    canvas.width = r.width; canvas.height = r.height;
    pts = Array.from({ length: 110 }, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 1.3 + 0.3, a: Math.random(), s: Math.random() * 0.02 + 0.004 }));
  };
  size();
  new ResizeObserver(size).observe(canvas.parentElement);
  let raf = null;
  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pts.forEach((p) => { p.a += p.s; const op = 0.35 + Math.sin(p.a) * 0.35; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(247,210,222,${Math.max(0, op)})`; ctx.fill(); });
    raf = requestAnimationFrame(tick);
  };
  new IntersectionObserver((e) => { if (e[0].isIntersecting && !raf && !reduced) tick(); else if (!e[0].isIntersecting && raf) { cancelAnimationFrame(raf); raf = null; } }).observe(canvas.parentElement);
}

/* ---------- boot ---------- */
stars();
initCommon().then(({ lenis }) => {
  verticalSections();
  gallery();
  railHud(lenis);
  progressBar();
  ScrollTrigger.refresh();
});
