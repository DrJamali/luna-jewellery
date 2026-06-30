import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  base: "./",
  server: {
    host: true,           // listen on your LAN ip too
    open: true,
    cors: true,
    allowedHosts: true,   // allow ngrok / tunnel hostnames (fixes "host is not allowed")
    proxy: {              // dev (vite) → talk to the Node API/uploads on port 8090
      "/api": "http://localhost:8090",
      "/uploads": "http://localhost:8090",
    },
  },
  build: {
    target: "es2020",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        admin: resolve(__dirname, "admin.html"),
        shop: resolve(__dirname, "shop.html"),
        product: resolve(__dirname, "product.html"),
        cart: resolve(__dirname, "cart.html"),
        checkout: resolve(__dirname, "checkout.html"),
        contact: resolve(__dirname, "contact.html"),
        privacy: resolve(__dirname, "privacy.html"),
        refund: resolve(__dirname, "refund.html"),
      },
    },
  },
});
