# =========================================================
# LUNA — application image (serves the built site + API)
# Debian-slim (glibc) so better-sqlite3 uses its prebuilt binary.
# =========================================================
FROM node:20-slim

WORKDIR /app

# install production deps first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# app code + prebuilt site
COPY server ./server
COPY dist ./dist

ENV NODE_ENV=production
ENV PORT=8082
ENV LUNA_DATA_DIR=/app/server/data

EXPOSE 8082

# data dir (db + uploads) is mounted as a volume at runtime
CMD ["node", "server/server.js"]
