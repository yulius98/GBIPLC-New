# Review Docker — Backend, Frontend & docker-compose

> Dibuat setelah penelusuran kode terkini (Prisma 7 + driver adapter `@prisma/adapter-pg`,
> Express 5, Vite 8, auth httpOnly cookie, Cloudflare tunnel).
> **Tidak ada kode Lama yang diubah** — semua perubahan di bawah ini bersifat rekomendasi
> yang tinggal diterapkan (salin-tempel) saat Anda siap.

---

## Ringkasan Temuan

| # | File | Status | Temuan |
|---|------|--------|--------|
| 1 | `Backend/Dockerfile` | ⚠️ **Perlu diubah** | `ENV NODE_ENV=production` sebelum `npm ci` membuat **devDependencies (termasuk CLI `prisma`) tidak terpasang**. Akibatnya `npx prisma generate` saat build dan `npx prisma migrate deploy` saat container start harus **mengunduh CLI dari internet** (rapuh & lambat setiap restart). |
| 2 | `Backend/.dockerignore` | ⚠️ Perlu diubah | Folder `public/uploads` (~96 MB file hasil development) ikut tersalin ke image, padahal di produksi file upload hidup di named volume `uploads_data`. |
| 3 | `docker-compose.yml` | ⚠️ Perlu diubah | (a) Tidak ada file `.env` di root, padahal `${DB_PASSWORD}` dan `${CLOUDFLARE_TUNNEL_TOKEN}` diinterpolasi dari situ → **token tunnel kosong**, `cloudflared` gagal berulang-ulang. (b) Password DB lari ke default `postgres` padahal password riil kamu `Laravel12` → backend gagal autentikasi. |
| 4 | `Frontend/Dockerfile` | ✅ Aman | Sudah benar: `npm ci` tanpa NODE_ENV=production (vite & plugin React dari devDeps terpasang), `dist` disalin ke nginx, proxy sudah mengarah ke `/api` + `/uploads`. Tidak perlu diubah. |
| 5 | `Frontend/.dockerignore` | 💡 Opsional | Sebaiknya tambahkan `.env*` supaya file env frontend (jika kelak dibuat) tidak ikut tersalin saat `COPY . .`. |
| 6 | File baru: `.env` (root) | ➕ **Wajib dibuat** | Sumber interpolasi `${...}` untuk compose (token tunnel + kredensial DB). |

---

## Detail Per Masalah

### 1. Backend/Dockerfile — CLI `prisma` hilang di image

**Fakta terverifikasi:** `npm ci` bersama `NODE_ENV=production` **melewati devDependencies**
(sudah saya uji langsung). Karena `prisma` berada di devDependencies
(`Backend/package.json`), maka:

- Saat build: `npx prisma generate` gagal menemukan CLI lokal → npx mengunduh dari npm registry (butuh jaringan saat build).
- Saat container start: `command` di compose menjalankan `npx prisma migrate deploy` — CLI tidak ada di `node_modules` runtime → **tiap start/restart container mengunduh dari internet**. Kalau jaringan bermasalah atau registry dibatasi, backend menunggu lama/gagal sebelum aplikasi jalan.

**Perbaikan minimal (diuji):** tambahkan flag `--include=dev` pada `npm ci`. Semua
perilaku lain tetap sama, `prisma migrate deploy` menjadi pasti bekerja tanpa jaringan.

**Kode terbaru `Backend/Dockerfile` (lengkap):**

```dockerfile
# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

ENV NODE_ENV=production
# Dibutuhkan agar `prisma generate` (melalui prisma.config.ts) bisa load env
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/gbiplc?schema=public

COPY package.json package-lock.json ./
# --include=dev wajib: NODE_ENV=production membuat `npm ci` melewati
# devDependencies, dan CLI `prisma` ada di sana. Tanpa ini, `npx prisma
# generate` saat build & `npx prisma migrate deploy` saat start container
# harus mengunduh CLI dari internet tiap kali jalan.
RUN npm ci --include=dev

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

# ---------- Runtime stage ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# brcyptjs murni JS; openssl aman-aman saja dipertahankan
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
```

> Catatan kecil: baris komentar asli salah ketik "brcyptjs" → boleh diperbaiki
> atau diabaikan. `openssl` boleh dihapus pada Prisma 7 (client memakai driver
> adapter pg, tanpa engine biner), tapi membiarkannya tidak berbahaya.

---

### 2. Backend/.dockerignore — keluarkan media upload dari image

Saat ini `.dockerignore` Backend hanya berisi:

```
node_modules
dist
.env
*.log
server.log
test
.git
```

`COPY public ./public` di Dockerfile ikut menyalin **`public/uploads` (±96 MB)**
hasil development ke dalam image. Di produksi upload hidup di volume
`uploads_data`, jadi file tersebut sia-sia memperbesar image dan (pada volume
baru) ikut ter-copy ke volume saat pertama kali jalan.

**Kode terbaru `Backend/.dockerignore` (lengkap):**

```
node_modules
dist
.env
*.log
server.log
test
.git
# Media upload tidak disertakan ke image; produksi memakai volume uploads_data
public/uploads
```

---

### 3. docker-compose.yml + file `.env` root baru

**Masalah (a) — token Cloudflare Tunnel:** interpolasi `${CLOUDFLARE_TUNNEL_TOKEN}`
di compose dibaca dari **environment OS atau `.env` di root proyek**, *bukan* dari
`env_file` milik service. Root `.env` tidak ada → `TUNNEL_TOKEN` kosong →
`cloudflared` error dan `restart: unless-stopped` membuatnya crash-loop.

**Masalah (b) — password DB:** `${DB_PASSWORD:-postgres}` lari ke default
`postgres`, sedangkan password Postgres riil di proyek ini adalah `Laravel12`
(dipakai di `Backend/.env`). Mismatch ini membuat `prisma migrate deploy` gagal
autentikasi.

Langkah koreksi terbaik adalah dua arah: buat `.env` root (sumber kebenaran untuk
compose), dan buat interpolasi gagal-cepat dengan sintaks `:?` supaya kesalahan
konfigurasi terlihat segera, bukan berupa error misterius di runtime.

**File baru — `.env` (di root proyek, sejajar docker-compose.yml):**

```env
# ============================================================
# Konfigurasi docker-compose (diinterpolasi dari file ini)
# ============================================================

# --- Database ---
DB_USER=postgres
DB_PASSWORD=Laravel12
DB_NAME=gbiplc

# --- Cloudflare Tunnel ---
# Salin nilai CLOUDFLARE_TUNNEL_TOKEN dari Backend/.env
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoi... (salin persis dari Backend/.env)
```

> Penting: `DB_PASSWORD` harus konsisten dengan password yang dibenamkan ke
> volume `db_data` **sejak pertama kali** container db dibuat. Kalau volume lama
> dibuat dengan password lain, ganti `DB_PASSWORD` agar cocok, atau hapus
> volume (`docker volume rm gbiplc_db_data`) lalu buat ulang.

**Kode terbaru `docker-compose.yml` (lengkap):**

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: gbiplc-db
    restart: unless-stopped

    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      # :? = jangan diam-diam memakai default kalau .env tidak diisi
      POSTGRES_PASSWORD: ${DB_PASSWORD:?Isi DB_PASSWORD di file .env root}
      POSTGRES_DB: ${DB_NAME:-gbiplc}

    ports:
      - "127.0.0.1:5434:5432"
    volumes:
      - db_data:/var/lib/postgresql/data

    healthcheck:
      test:
        [
          "CMD-SHELL",
          "pg_isready -U ${DB_USER:-postgres} -d ${DB_NAME:-gbiplc}"
        ]
      interval: 5s
      timeout: 5s
      retries: 10

  backend:
    build:
      context: ./Backend
      dockerfile: Dockerfile

    container_name: gbiplc-backend
    restart: unless-stopped

    env_file:
      - ./Backend/.env

    environment:
      NODE_ENV: production
      PORT: 8000
      # :? memastikan password selalu disetel eksplisit dari .env root,
      # tidak pernah rontok ke "postgres" default
      DATABASE_URL: postgresql://${DB_USER:-postgres}:${DB_PASSWORD:?Isi DB_PASSWORD di file .env root}@db:5432/${DB_NAME:-gbiplc}?schema=public

    volumes:
      - uploads_data:/app/public/uploads

    depends_on:
      db:
        condition: service_healthy

    command: >
      sh -c "npx prisma migrate deploy &&
             node src/index.js"

    # Healthcheck memanfaatkan endpoint /health yang sudah ada di app.js.
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:8000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 60s

    ports:
      # Terikat loopback: backend hanya dijangkau dari server sendiri (debug),
      # bukan internet — menutupi spoof X-Forwarded-For / rate-limit bypass.
      - "127.0.0.1:8001:8000"

  frontend:
    build:
      context: ./Frontend
      dockerfile: Dockerfile

    container_name: gbiplc-frontend
    restart: unless-stopped

    depends_on:
      backend:
        condition: service_started

    ports:
      # Terikat loopback: publik hanya lewat cloudflared tunnel. Jika port 80
      # terbuka ke internet, klien langsung bisa memalsukan X-Forwarded-For
      # dan melewati rate limit (CF-Connecting-IP pun tidak berlaku pada
      # request yang tidak lewat Cloudflare).
      - "127.0.0.1:80:80"

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: gbiplc-cloudflared
    restart: unless-stopped
    # TUNNEL_TOKEN diinterpolasi dari .env root — env_file ./Backend/.env
    # dihapus karena tidak relevan bagi cloudflared (hanya membebani
    # container dengan DB_URL/mail/token JWT).
    environment:
      TUNNEL_TOKEN: ${CLOUDFLARE_TUNNEL_TOKEN:?Isi CLOUDFLARE_TUNNEL_TOKEN di file .env root}
    command: tunnel --no-autoupdate run
    depends_on:
      backend:
        condition: service_started
      frontend:
        condition: service_started

volumes:
  db_data:
  uploads_data:
```

Perubahan ringkas vs versi lama:

1. `POSTGRES_PASSWORD` dan `DATABASE_URL` memakai sintaks `:?` (gagal-cepat
   kalau `.env` root belum diisi).
2. Healthcheck `/health` untuk backend (Node 20 punya `fetch` global).
3. `cloudflared` — `env_file` dihapus, token diambil murni dari `.env` root;
   sekali lagi, ini kunci perbaikan crash-loop tunnel.

---

### 4. Frontend/Dockerfile — aman, tidak perlu diubah

Sudah sesuai kondisi saat ini:

- `npm ci` di stage builder tanpa `NODE_ENV=production` → devDeps (vite,
  @vitejs/plugin-react) terpasang → `npm run build` bekerja.
- `COPY . .` aman berkat `.dockerignore` (node_modules/dist/.git terkecualikan).
- `VITE_API_URL` **tidak perlu** diberi build-arg: client default ke `/api`
  (same-origin), dan `nginx.conf` sudah mem-proxy `/api` + `/uploads` ke
  `http://backend:8000`.
- Auth cookie httpOnly: same-origin via proxy nginx → tanpa masalah CORS.

---

### 5. Frontend/.dockerignore — perubahan opsional

**Kode terbaru `Frontend/.dockerignore` (lengkap):**

```
node_modules
dist
.git
# Cegah file env frontend ikut tersalin saat COPY . .
.env*
*.log
```

---

## Checklist Penerapan

```bash
# 1. Buat .env root (isi DB_PASSWORD & CLOUDFLARE_TUNNEL_TOKEN)
#    -> lihat bagian "File baru — .env" di atas

# 2. Terapkan pembaruan file:
#    - Backend/Dockerfile         (npm ci --include=dev)
#    - Backend/.dockerignore      (tambah public/uploads)
#    - docker-compose.yml         (kode di atas)
#    - Frontend/.dockerignore     (opsional)

# 3. Build ulang dari nol
docker compose build

# 4. Jalankan dan pastikan urutannya sehat
docker compose up -d
docker compose ps          # db healthy -> backend healthy -> frontend
docker compose logs cloudflared   # tunnel harus "Registered tunnel connection"

# (Opsional) reset volume db bila password lama mati-mati match
docker compose down -v     # hapus juga volume db_data
docker compose up -d
```

## Tidak Perlu Diubah (sudah diverifikasi cocok dengan kode saat ini)

- `Frontend/nginx.conf` — proxy `/api` & `/uploads` ke `backend:8000`, SPA fallback, header keamanan.
- `VOLUME ["/app/public/uploads"]` + `uploads_data:/app/public/uploads` — sesuai modul upload backend.
- Binding loopback `127.0.0.1` pada semua port host — sesuai kebijakan rate-limit `CF-Connecting-IP` yang dibaca backend.
- `node:20-alpine` — memenuhi `engines: >=20.19.0` dan fitur `import.meta.dirname` (Node ≥ 20.11).
