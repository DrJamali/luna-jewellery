/* =========================================================
   LUNA — admin dashboard
   Talks to the same-origin API. Single-password login, product
   CRUD with image upload, and order status management.
   ========================================================= */

const $ = (s, r = document) => r.querySelector(s);
const pkr = (n) => "Rs " + Number(n || 0).toLocaleString("en-PK");
const imgUrl = (path) => (path ? (path.startsWith("/") ? path : "/" + path) : "");
const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const STATUSES = ["new", "confirmed", "shipped", "delivered", "cancelled"];

/* ---------------- API helpers ---------------- */
async function api(path, opts = {}) {
  const res = await fetch(path, { credentials: "same-origin", ...opts });
  if (res.status === 401) { showLogin(); throw new Error("unauthorized"); }
  return res;
}
async function apiJson(path, opts) {
  const res = await api(path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

/* ---------------- view switching ---------------- */
function showLogin() {
  $("#login").style.display = "grid";
  $("#shell").style.display = "none";
}
function showShell() {
  $("#login").style.display = "none";
  $("#shell").style.display = "block";
}

/* ---------------- login ---------------- */
$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#login-err");
  err.textContent = "";
  const btn = $("#login-btn");
  btn.disabled = true;
  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ password: $("#pw").value }),
    });
    if (!res.ok) throw new Error("Wrong password");
    $("#pw").value = "";
    showShell();
    loadProducts();
    loadOrders();
  } catch (e2) {
    err.textContent = e2.message || "Sign in failed";
  } finally {
    btn.disabled = false;
  }
});

$("#logout").addEventListener("click", async () => {
  try { await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" }); } catch {}
  showLogin();
});

/* ---------------- tabs ---------------- */
document.querySelectorAll(".tab").forEach((t) => {
  t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("is-active", x === t));
    const name = t.dataset.tab;
    $("#panel-products").classList.toggle("is-active", name === "products");
    $("#panel-orders").classList.toggle("is-active", name === "orders");
  });
});

/* ================= PRODUCTS ================= */
function renderProducts(list) {
  const grid = $("#pgrid");
  if (!list.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1">No products yet. Click “Add product” to create your first piece.</div>`;
    return;
  }
  grid.innerHTML = list.map((p) => {
    const cover = p.images && p.images[0];
    return `
    <article class="pcard" data-id="${esc(p.id)}">
      <div class="pcard__media">
        ${cover ? `<img src="${esc(imgUrl(cover))}" alt="${esc(p.name)}" />`
                : `<div class="pcard__no">No photo</div>`}
      </div>
      <div class="pcard__body">
        <span class="pcard__tag">${esc(p.tag)}</span>
        <h3 class="pcard__name">${esc(p.name)}</h3>
        <span class="pcard__price">${pkr(p.price)}</span>
        <div class="pcard__acts">
          <button class="btn btn--sm" data-edit="${esc(p.id)}">Edit</button>
          <button class="btn btn--sm btn--danger" data-del="${esc(p.id)}">Delete</button>
        </div>
      </div>
    </article>`;
  }).join("");
}

let PRODUCTS = [];
async function loadProducts() {
  try {
    PRODUCTS = await apiJson("/api/products");
    renderProducts(PRODUCTS);
  } catch (e) { console.warn(e); }
}

/* delegated edit / delete */
$("#pgrid").addEventListener("click", async (e) => {
  const edit = e.target.closest("[data-edit]");
  const del = e.target.closest("[data-del]");
  if (edit) openModal(PRODUCTS.find((p) => p.id === edit.dataset.edit));
  if (del) {
    const p = PRODUCTS.find((x) => x.id === del.dataset.del);
    if (!p) return;
    if (!confirm(`Delete “${p.name}”? This can't be undone.`)) return;
    try {
      await apiJson(`/api/admin/products/${encodeURIComponent(p.id)}`, { method: "DELETE" });
      loadProducts();
    } catch (err) { alert(err.message); }
  }
});

/* ---------------- product modal ---------------- */
let keepImages = [];   // existing paths retained on edit
let newFiles = [];     // freshly selected File objects

function renderThumbs() {
  const wrap = $("#thumbs");
  const existing = keepImages.map((path, i) =>
    `<div class="thumb"><img src="${esc(imgUrl(path))}" alt="" /><button type="button" data-keep="${i}">×</button></div>`);
  const fresh = newFiles.map((f, i) =>
    `<div class="thumb"><img src="${URL.createObjectURL(f)}" alt="" /><button type="button" data-new="${i}">×</button></div>`);
  wrap.innerHTML = existing.concat(fresh).join("");
}

$("#thumbs").addEventListener("click", (e) => {
  const k = e.target.closest("[data-keep]");
  const n = e.target.closest("[data-new]");
  if (k) { keepImages.splice(+k.dataset.keep, 1); renderThumbs(); }
  if (n) { newFiles.splice(+n.dataset.new, 1); renderThumbs(); }
});

$("#f-images").addEventListener("change", (e) => {
  newFiles = newFiles.concat(Array.from(e.target.files || []));
  e.target.value = "";
  renderThumbs();
});

function openModal(product) {
  const editing = !!product;
  $("#modal-title").textContent = editing ? "Edit product" : "Add product";
  $("#form-err").textContent = "";
  $("#f-id").value = editing ? product.id : "";
  $("#f-name").value = editing ? product.name : "";
  $("#f-tag").value = editing ? product.tag : "";
  $("#f-price").value = editing ? product.price : "";
  $("#f-dimensions").value = editing ? (product.dimensions || "") : "";
  $("#f-blurb").value = editing ? (product.blurb || "") : "";
  $("#f-story").value = editing ? (product.story || "") : "";
  $("#f-materials").value = editing ? (product.materials || []).join("\n") : "";
  $("#f-care").value = editing ? (product.care || "") : "";
  keepImages = editing ? [...(product.images || [])] : [];
  newFiles = [];
  renderThumbs();
  $("#modal").classList.add("is-open");
}
function closeModal() { $("#modal").classList.remove("is-open"); }

$("#add-product").addEventListener("click", () => openModal(null));
$("#modal-close").addEventListener("click", closeModal);
$("#cancel").addEventListener("click", closeModal);
$("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });

$("#product-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#form-err");
  err.textContent = "";
  const id = $("#f-id").value;
  const editing = !!id;

  if (!$("#f-name").value.trim()) { err.textContent = "Name is required"; return; }
  if (!$("#f-price").value) { err.textContent = "Price is required"; return; }

  const fd = new FormData();
  fd.append("name", $("#f-name").value.trim());
  fd.append("tag", $("#f-tag").value.trim());
  fd.append("price", $("#f-price").value);
  fd.append("dimensions", $("#f-dimensions").value.trim());
  fd.append("blurb", $("#f-blurb").value.trim());
  fd.append("story", $("#f-story").value.trim());
  fd.append("care", $("#f-care").value.trim());
  const materials = $("#f-materials").value.split("\n").map((s) => s.trim()).filter(Boolean);
  fd.append("materials", JSON.stringify(materials));
  if (editing) fd.append("keepImages", JSON.stringify(keepImages));
  newFiles.forEach((f) => fd.append("images", f));

  const save = $("#save");
  save.disabled = true;
  save.textContent = "Saving…";
  try {
    const path = editing
      ? `/api/admin/products/${encodeURIComponent(id)}`
      : "/api/admin/products";
    await apiJson(path, { method: editing ? "PUT" : "POST", body: fd });
    closeModal();
    loadProducts();
  } catch (e2) {
    err.textContent = e2.message || "Could not save";
  } finally {
    save.disabled = false;
    save.textContent = "Save product";
  }
});

/* ================= ORDERS ================= */
function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString("en-PK", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function renderOrders(list) {
  const wrap = $("#orders-wrap");
  if (!list.length) {
    wrap.innerHTML = `<div class="empty">No orders yet. They'll show up here as customers check out.</div>`;
    return;
  }
  const rows = list.map((o) => {
    const items = (o.items || []).map((i) => `${i.qty}× ${esc(i.name)}`).join(", ");
    const c = o.customer || {};
    const opts = STATUSES.map((s) =>
      `<option value="${s}" ${s === o.status ? "selected" : ""}>${s[0].toUpperCase() + s.slice(1)}</option>`).join("");
    const pay = o.payment?.method === "cod" ? "COD" : (o.payment?.method || "");
    return `
    <tr data-id="${esc(o.orderId)}">
      <td><div class="o-id">${esc(o.orderId)}</div><div class="o-when">${fmtDate(o.createdAt)}</div></td>
      <td class="o-cust"><strong>${esc(c.name)}</strong><span>${esc(c.phone)}</span><span>${esc(c.city)}</span></td>
      <td class="o-items">${items}</td>
      <td class="o-total">${pkr(o.totals?.total)}<div class="o-when">${pay}</div></td>
      <td><select class="o-status" data-status="${esc(o.status)}">${opts}</select></td>
    </tr>`;
  }).join("");

  wrap.innerHTML = `
    <table class="otable">
      <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

let ORDERS = [];
async function loadOrders() {
  try {
    ORDERS = await apiJson("/api/admin/orders");
    renderOrders(ORDERS);
  } catch (e) { console.warn(e); }
}

$("#refresh-orders").addEventListener("click", loadOrders);

$("#orders-wrap").addEventListener("change", async (e) => {
  const sel = e.target.closest(".o-status");
  if (!sel) return;
  const id = sel.closest("tr").dataset.id;
  const status = sel.value;
  sel.disabled = true;
  try {
    await apiJson(`/api/admin/orders/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    sel.dataset.status = status;
  } catch (err) {
    alert(err.message);
    loadOrders();
  } finally {
    sel.disabled = false;
  }
});

/* ---------------- boot ---------------- */
(async function init() {
  try {
    const me = await fetch("/api/admin/me", { credentials: "same-origin" }).then((r) => r.json());
    if (me.ok) { showShell(); loadProducts(); loadOrders(); }
    else showLogin();
  } catch {
    showLogin();
  }
})();
