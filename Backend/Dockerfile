# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

ENV NODE_ENV=production
# Dibutuhkan agar `prisma generate` (melalui prisma.config.ts) bisa load env
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/gbiplc?schema=public

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

# ---------- Runtime stage ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# bcryptjs murni JS; openssl dibutuhkan Prisma engine di Alpine
RUN apk add --no-cache openssl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY package.json package-lock.json ./
COPY src ./src
COPY public ./public

# Volume untuk file upload (public/uploads)
VOLUME ["/app/public/uploads"]

EXPOSE 8000

# Migrasi dijalankan via docker-compose (command override) sebelum start.
CMD ["node", "src/index.js"]
