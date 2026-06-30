/* =========================================================
   LUNA — database (SQLite via better-sqlite3)
   One file holds products + orders. Created + seeded on first run.
   ========================================================= */
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SEED_PRODUCTS } from "./seed-data.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/* data dir holds luna.db + uploads/ — mounted as a volume on the server */
export const DATA_DIR = process.env.LUNA_DATA_DIR || join(__dirname, "data");
export const UPLOAD_DIR = join(DATA_DIR, "uploads");
mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new Database(join(DATA_DIR, "luna.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    tag        TEXT NOT NULL,
    price      INTEGER NOT NULL,
    blurb      TEXT NOT NULL DEFAULT '',
    story      TEXT NOT NULL DEFAULT '',
    materials  TEXT NOT NULL DEFAULT '[]',   -- JSON array
    dimensions TEXT NOT NULL DEFAULT '',
    care       TEXT NOT NULL DEFAULT '',
    images     TEXT NOT NULL DEFAULT '[]',   -- JSON array of paths
    sort       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    order_id   TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    customer   TEXT NOT NULL,                -- JSON
    payment    TEXT NOT NULL,                -- JSON
    items      TEXT NOT NULL,                -- JSON
    totals     TEXT NOT NULL,                -- JSON
    status     TEXT NOT NULL DEFAULT 'new'
  );
`);

/* ---------- row <-> object mapping ---------- */
function rowToProduct(r) {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    tag: r.tag,
    price: r.price,
    blurb: r.blurb,
    story: r.story,
    materials: JSON.parse(r.materials || "[]"),
    dimensions: r.dimensions,
    care: r.care,
    images: JSON.parse(r.images || "[]"),
  };
}

function rowToOrder(r) {
  if (!r) return null;
  return {
    orderId: r.order_id,
    createdAt: r.created_at,
    customer: JSON.parse(r.customer),
    payment: JSON.parse(r.payment),
    items: JSON.parse(r.items),
    totals: JSON.parse(r.totals),
    status: r.status,
  };
}

/* ---------- products ---------- */
const qAllProducts = db.prepare("SELECT * FROM products ORDER BY sort ASC, created_at ASC");
const qProduct = db.prepare("SELECT * FROM products WHERE id = ?");
const qInsertProduct = db.prepare(`
  INSERT INTO products (id, name, tag, price, blurb, story, materials, dimensions, care, images, sort, created_at)
  VALUES (@id, @name, @tag, @price, @blurb, @story, @materials, @dimensions, @care, @images, @sort, @created_at)
`);
const qUpdateProduct = db.prepare(`
  UPDATE products SET name=@name, tag=@tag, price=@price, blurb=@blurb, story=@story,
    materials=@materials, dimensions=@dimensions, care=@care, images=@images
  WHERE id=@id
`);
const qDeleteProduct = db.prepare("DELETE FROM products WHERE id = ?");
const qMaxSort = db.prepare("SELECT COALESCE(MAX(sort), 0) AS m FROM products");

export const listProducts = () => qAllProducts.all().map(rowToProduct);
export const getProduct = (id) => rowToProduct(qProduct.get(id));

export function createProduct(p) {
  const sort = qMaxSort.get().m + 1;
  qInsertProduct.run({
    id: p.id,
    name: p.name,
    tag: p.tag,
    price: p.price,
    blurb: p.blurb || "",
    story: p.story || "",
    materials: JSON.stringify(p.materials || []),
    dimensions: p.dimensions || "",
    care: p.care || "",
    images: JSON.stringify(p.images || []),
    sort,
    created_at: new Date().toISOString(),
  });
  return getProduct(p.id);
}

export function updateProduct(id, p) {
  qUpdateProduct.run({
    id,
    name: p.name,
    tag: p.tag,
    price: p.price,
    blurb: p.blurb || "",
    story: p.story || "",
    materials: JSON.stringify(p.materials || []),
    dimensions: p.dimensions || "",
    care: p.care || "",
    images: JSON.stringify(p.images || []),
  });
  return getProduct(id);
}

export const deleteProduct = (id) => qDeleteProduct.run(id).changes > 0;

/* ---------- orders ---------- */
const qAllOrders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC");
const qOrder = db.prepare("SELECT * FROM orders WHERE order_id = ?");
const qInsertOrder = db.prepare(`
  INSERT INTO orders (order_id, created_at, customer, payment, items, totals, status)
  VALUES (@order_id, @created_at, @customer, @payment, @items, @totals, @status)
`);
const qUpdateStatus = db.prepare("UPDATE orders SET status = ? WHERE order_id = ?");

export const listOrders = () => qAllOrders.all().map(rowToOrder);
export const getOrder = (id) => rowToOrder(qOrder.get(id));

export function createOrder(o) {
  qInsertOrder.run({
    order_id: o.orderId,
    created_at: o.createdAt,
    customer: JSON.stringify(o.customer),
    payment: JSON.stringify(o.payment),
    items: JSON.stringify(o.items),
    totals: JSON.stringify(o.totals),
    status: o.status || "new",
  });
  return getOrder(o.orderId);
}

export const setOrderStatus = (id, status) => qUpdateStatus.run(status, id).changes > 0;

/* ---------- first-run seed ---------- */
const seedTx = db.transaction(() => {
  SEED_PRODUCTS.forEach((p, i) => {
    qInsertProduct.run({
      id: p.id,
      name: p.name,
      tag: p.tag,
      price: p.price,
      blurb: p.blurb || "",
      story: p.story || "",
      materials: JSON.stringify(p.materials || []),
      dimensions: p.dimensions || "",
      care: p.care || "",
      images: JSON.stringify(p.images || []),
      sort: i + 1,
      created_at: new Date().toISOString(),
    });
  });
});

if (db.prepare("SELECT COUNT(*) AS n FROM products").get().n === 0) {
  seedTx();
  console.log(`[Luna] seeded ${SEED_PRODUCTS.length} products into a fresh database`);
}

export default db;
