/* =========================================================
   LUNA — product catalogue (single source of truth)
   Prices in PKR (Pakistani Rupee).
   Media: each product has an `images` array (first = primary).
   ========================================================= */

export const products = [
  {
    id: "flower-cuff",
    name: "Flower Hand Cuff",
    tag: "Cuff",
    price: 1200,
    images: ["images/products/flower-cuff-1.jpg"],
    blurb: "A gold-tone cuff of open flowers that wraps softly around the wrist.",
    story:
      "An open cuff lined with blossoms in warm gold. It sits light on the wrist and slips on easily — an everyday piece with a little bit of bloom.",
    materials: ["Gold-tone finish", "Open cuff", "Adjustable fit"],
    dimensions: "Open cuff · fits most wrists",
    care: "Keep dry. Wipe with a soft cloth.",
  },
  {
    id: "snake-cuff",
    name: "Snake Hand Cuff",
    tag: "Cuff",
    price: 860,
    images: ["images/products/snake-cuff-1.jpg", "images/products/snake-cuff-2.jpg"],
    blurb: "A sleek serpent cuff with a stone-set head and green eyes.",
    story:
      "A serpent curving around the wrist, its head dotted with tiny clear stones and finished with two green eyes. An open cuff that adjusts to fit.",
    materials: ["Gold-tone finish", "Clear stone pavé", "Green stone eyes"],
    dimensions: "Open cuff · adjustable",
    care: "Keep dry. Avoid perfume and lotion.",
  },
  {
    id: "moon-pendant",
    name: "Moon Pendant",
    tag: "Pendant",
    price: 650,
    images: ["images/products/moon-pendant-1.jpg", "images/products/moon-pendant-2.jpg"],
    blurb: "A gold crescent moon with a single star, on a fine chain.",
    story:
      "A small gold crescent cradling a single star, on a fine chain that sits just below the collarbone. The piece that started Luna.",
    materials: ["Gold-tone finish", "Star-set crystal", "Adjustable chain"],
    dimensions: "Crescent ~18mm · chain 16–18in adjustable",
    care: "Store dry. Keep away from water.",
  },
  {
    id: "rose-vine",
    name: "Rose Vine Bracelet",
    tag: "Bracelet",
    price: 959,
    images: ["images/products/rose-vine-1.jpg", "images/products/rose-vine-2.jpg"],
    blurb: "A silver-tone vine of red blooms and green leaves for the wrist.",
    story:
      "Red stones bloom along a slim silver vine, with green leaves set between them. A neat clasp keeps it sitting as one clean line.",
    materials: ["Silver-tone finish", "Red & green stones", "Box clasp"],
    dimensions: "Length ~18cm",
    care: "Keep dry. Store flat.",
  },
  {
    id: "peacock-jhumka",
    name: "Peacock Jhumka",
    tag: "Earrings",
    price: 660,
    images: ["images/products/peacock-jhumka-1.jpg", "images/products/peacock-jhumka-2.jpg"],
    blurb: "Oxidised jhumka earrings with a peacock-eye top and bell drops.",
    story:
      "A peacock-eye top sits above a classic jhumka dome, edged with a row of little bells that move when you do. Light to wear, easy to love.",
    materials: ["Oxidised silver-tone finish", "Peacock-feather motif", "Bell drops"],
    dimensions: "Drop ~42mm",
    care: "Polish gently to brighten.",
  },
  {
    id: "butterfly-ring",
    name: "Butterfly Ring",
    tag: "Ring",
    price: 720,
    images: ["images/products/butterfly-ring-1.jpg", "images/products/butterfly-ring-2.jpg"],
    blurb: "A silver butterfly ring with a warm amber-tone stone at the centre.",
    story:
      "Open wings in silver meeting at a warm amber-tone stone, on a band that adjusts to fit. Delicate, but happy to stand out.",
    materials: ["Silver-tone finish", "Amber-tone stone", "Adjustable band"],
    dimensions: "Adjustable band",
    care: "Keep dry. Wipe with a soft cloth.",
  },
];

export const byId = (id) => products.find((p) => p.id === id) || products[0];

/* primary image helper */
export const cover = (p) => (p.images && p.images[0]) || "";

/* PKR formatter → "Rs 8,900" */
export const pkr = (n) => "Rs " + Number(n).toLocaleString("en-PK");

export const STORE = {
  name: "Luna Store",
  address: "DHA Phase 3, Lahore, Pakistan",
  hours: "Mon–Sat · 12pm – 9pm",
  phone: "+92 300 1234567",
  email: "hello@luna.pk",
  whatsapp: "+92 300 1234567",
  maps: "https://www.google.com/maps/search/?api=1&query=DHA+Phase+3+Lahore",
};
