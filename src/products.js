/* =========================================================
   LUNA — product catalogue (single source of truth)
   Prices in PKR (Pakistani Rupee). Order: bangle first.
   ========================================================= */

export const products = [
  {
    id: "bangle",
    name: "Celestial Bangle",
    tag: "Bangle",
    price: 8900,
    video: "video/products/bangle.mp4",
    poster: "video/products/bangle.jpg",
    blurb: "A single unbroken arc of recycled gold, turned to catch the light like a ring around the moon.",
    story:
      "The Celestial Bangle is shaped from one continuous arc of recycled gold, polished by hand until it holds the light the way a halo rings the moon. It sits weighty and quiet on the wrist, made to be worn every day and handed down after.",
    materials: ["18k recycled gold vermeil", "Hand-polished finish", "Hypoallergenic core"],
    dimensions: "Inner diameter 60mm · 6mm band",
    care: "Wipe with the enclosed cloth. Keep away from perfume and water.",
  },
  {
    id: "moon",
    name: "Celestial Moon Necklace",
    tag: "Necklace",
    price: 6490,
    video: "video/products/moon.mp4",
    poster: "video/products/moon.jpg",
    blurb: "A recycled-gold crescent cradling a single hand-set star. The signature Luna piece.",
    story:
      "The piece that started Luna. A slim crescent of recycled gold cradles a single hand-set star, strung on a fine adjustable chain that falls just below the collarbone. It is the moon you carry with you, wherever the night takes you.",
    materials: ["18k recycled gold", "Hand-set cubic zirconia star", "Adjustable 16–18in chain"],
    dimensions: "Crescent 18mm · chain 16–18in adjustable",
    care: "Store flat in the pouch provided. Avoid contact with water and lotion.",
  },
  {
    id: "jhumka",
    name: "Peacock Jhumka Earrings",
    tag: "Earrings",
    price: 4800,
    video: "video/products/jhumka.mp4",
    poster: "video/products/jhumka.jpg",
    blurb: "Oxidised silver jhumkas crowned with a single peacock eye, swinging with the slightest turn.",
    story:
      "A love letter to the subcontinent. Oxidised silver jhumkas are crowned with a single enamelled peacock eye and finished with a fall of tiny bells that catch every turn of the head. Light to wear, impossible to ignore.",
    materials: ["Oxidised 925 sterling silver", "Hand-enamelled peacock motif", "Secure push backs"],
    dimensions: "Drop 42mm · bell width 22mm",
    care: "Oxidised silver deepens with age. Polish gently only to brighten.",
  },
  {
    id: "bracelet",
    name: "Rose Vine Bracelet",
    tag: "Bracelet",
    price: 5900,
    video: "video/products/bracelet.mp4",
    poster: "video/products/bracelet.jpg",
    blurb: "Rubies in bloom along a trailing vine of emerald leaves, wrapped close to the wrist.",
    story:
      "A garden for the wrist. Lab-grown rubies bloom along a trailing silver vine, each leaf set with a sliver of emerald green. The clasp hides inside the vine so the bracelet reads as one unbroken line of flowers.",
    materials: ["Rhodium-plated 925 silver", "Lab-grown ruby & emerald", "Hidden box clasp"],
    dimensions: "Length 18cm · 5mm vine",
    care: "Keep dry. Remove before sleeping or bathing.",
  },
];

export const byId = (id) => products.find((p) => p.id === id) || products[0];

/* PKR formatter → "Rs 8,900" */
export const pkr = (n) => "Rs " + Number(n).toLocaleString("en-PK");

export const STORE = {
  name: "Luna Atelier & Store",
  address: "DHA Phase 3, Lahore, Pakistan",
  hours: "Mon–Sat · 12pm – 9pm",
  phone: "+92 300 1234567",
  email: "hello@luna.pk",
  whatsapp: "+92 300 1234567",
  maps: "https://www.google.com/maps/search/?api=1&query=DHA+Phase+3+Lahore",
};
