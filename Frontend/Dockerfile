# ---------- Build stage ----------
# Node 24 (LTS s/d 30 Apr 2028); Node 20 sudah EOL 30 Apr 2026.
# Samakan dengan Backend/Dockerfile supaya toolchain build konsisten.
FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Serve stage ----------
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
