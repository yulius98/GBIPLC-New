# GBI PLC Backend (Express.js + PostgreSQL)

Refactor backend API dari Laravel (gbiPLC) ke **Express.js 5** + **PostgreSQL** (Prisma ORM).
Fokus fase 1: **backend API** yang reusable, mudah dibaca, dan kompatibel dengan
format respons API Laravel lama sehingga aplikasi mobile **Flutter (plc_mobile)**
tetap berfungsi.

## Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Runtime | Node.js ≥ 18 (dipakai: v24) |
| Framework | Express.js 5 |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (HS256) + bcryptjs |
| Validasi | Zod |
| Tanggal | dayjs |
| Upload | Multer |
| HTTP client | Axios (scraping alkitab.mobi) |

## Struktur Proyek

```
Backend/
├── prisma/
│   ├── schema.prisma          # Definisi seluruh tabel
│   ├── seed.js                # Seed 298 hari reading schedule + admin
│   └── migrations/            # Migrasi PostgreSQL
├── src/
│   ├── index.js               # Entry point
│   ├── app.js                 # Setup Express (middleware global, routes)
│   ├── config/env.js          # Konfigurasi environment terpusat
│   ├── constants/             # Konstanta (roles, kitab Alkitab)
│   ├── middlewares/           # authenticate, authorize, upload, errorHandler
│   ├── modules/               # Fitur per-modul (routes + controller + validation)
│   │   ├── auth/              # login, logout, refresh, /api/user
│   │   ├── users/             # register, myprofile, birthday
│   │   ├── contents/          # pastornote, event, carousel, lifegroup, materi-kotbah, ibadahraya
│   │   ├── reading/           # bacaan Alkitab harian
│   │   ├── dashboard/         # statistik jemaat
│   │   ├── passwordReset/     # forgot & reset password
│   │   ├── youth/             # programs, galleries, schedules
│   │   └── misc/              # kunjungan, toko-jemaat, popup-ads, notofications, materi-komsel
│   ├── services/              # fileUpload, bible (scraping + audio), mail, token
│   ├── utils/                 # apiResponse, validate, asyncHandler, AppError, crudFactory, date
│   └── routes/index.js        # Penggabung semua router /api
├── public/uploads/            # File hasil upload (disajikan via /uploads)
├── .env.example
└── package.json
```

## Arsitektur & Konvensi

- **Modular per fitur**: tiap fitur punya `*.routes.js`, `*.controller.js`, `*.validation.js`.
- **Reusable helper**:
  - `validate(schema, source)` — validasi Zod, error diformat seperti Laravel (`errors: { field: [..] }`).
  - `createCrudController({...})` — factory CRUD generik untuk resource berulang.
  - `apiResponse` — format respons konsisten `{ status, message, data }`.
  - `fileUploadService` — simpan/hapus/replace file upload.
  - `tokenService` — sign/verify JWT.
- **Format respons dipertahankan** agar kompatibel dengan Flutter:
  - Sukses: `{ "status": true, "message": "...", "data": ... }`
  - Gagal/validasi: `{ "status": false, "message": "...", "errors": {...} }`
  - Login/refresh: `{ access_token, token_type, expires_in, refresh_ttl }`
  - `GET /api/reading/today` mengembalikan `{ date, morning, evening, progress }` (tanpa wrapper, sesuai aslinya).

## Instalasi & Setup

### 1. Persiapan environment

```bash
cp .env.example .env
```

Isi minimal di `.env`:

```env
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/gbiplc?schema=public
JWT_SECRET=<string acak panjang>
PORT=8000
```

### 2. Instal dependensi & migrasi

```bash
npm install
npx prisma migrate dev --name init   # buat tabel PostgreSQL
npm run db:seed                        # seed reading schedule + admin
```

Hasil seed (bisa diubah via env `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`):

| Role | Email | Password |
|------|-------|----------|
| pengurus (admin) | admin@gbiplc.test | Admin123! |

### 3. Jalankan server

```bash
npm run dev     # mode development (auto-reload)
npm start       # production
```

Server berjalan di `http://localhost:8000`. Cek `GET /health`.

### Script lain

| Script | Fungsi |
|--------|--------|
| `npm test` | Integration test API (`test/api.test.js`, memakai server + DB lokal) |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Buat migrasi baru (`prisma migrate dev`) |
| `npm run db:deploy` | Terapkan migrasi di production |
| `npm run db:reset` | Reset database + re-migrate + re-seed |
| `npm run db:studio` | Buka Prisma Studio |
| `npm run db:import` | Import dump MySQL (dry-run, laporan baris per tabel) |
| `npm run db:import:apply` | Import dump MySQL ke PostgreSQL (`--apply`) |

## Daftar Endpoint API

### Auth & User
| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| POST | `/api/login` | - | Login, body `{ email, password }` |
| POST | `/api/refresh` | - | Buat token baru dari token lama |
| POST | `/api/logout` | - | Logout |
| GET | `/api/user` | JWT | Data user yang login |
| POST | `/api/register` | - | Daftar jemaat (multipart, field `filename` opsional) |
| GET | `/api/myprofile/:id` | JWT | Detail profil + photo_url |
| GET | `/api/myprofile/:id/edit` | JWT | Data untuk form edit |
| PUT | `/api/myprofile/:id` | JWT | Update profil (multipart opsional) |
| GET | `/api/birthday` | - | Jemaat berulang tahun bulan ini |

### Konten
| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| GET | `/api/pastornote` | - | Pastor note terbaru |
| GET | `/api/event` | - | Event bulan dari event terbaru |
| GET | `/api/carousel` | - | Banner carousel aktif |
| GET | `/api/lifegroup` | - | Daftar life group |
| GET | `/api/materi-kotbah` | - | Daftar judul kotbah |
| GET | `/api/materi-kotbah/getlink?tgl_kotbah=` | - | Materi kotbah per tanggal |
| GET | `/api/materi-kotbah/download/:id` | - | Download file materi kotbah |
| GET | `/api/ibadahraya?tgl_ibadah=&ibadah_ke=` | - | Link ibadah raya |

### Reading (Bacaan Alkitab)
| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| GET | `/api/reading/today` | JWT | Bacaan pagi & malam hari ini |
| POST | `/api/reading/start-date` | JWT | Set tanggal mulai (hanya jika belum ada) |
| PUT | `/api/reading/start-date` | JWT | Ubah tanggal mulai |

### Dashboard (pengurus)
| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| GET | `/api/dashboard/:id` | JWT + pengurus | Statistik jumlah jemaat |
| GET | `/api/pengurus/dashboard` | JWT + pengurus | Cek akses pengurus |

### Password Reset
| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| POST | `/api/forgot-password` | - | Kirim link reset (`{ email }`) |
| POST | `/api/reset-password` | - | Reset password (`{ email, token, password }`) |

### Youth (baru)
| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| GET | `/api/youth/programs` | - | Daftar program youth |
| POST/PUT/DELETE | `/api/youth/programs[/:id]` | JWT + pengurus | CRUD program |
| GET | `/api/youth/galleries` | - | Daftar galeri |
| POST/PUT/DELETE | `/api/youth/galleries[/:id]` | JWT + pengurus | CRUD galeri |
| GET | `/api/youth/schedules` | - | Daftar jadwal |
| POST/PUT/DELETE | `/api/youth/schedules[/:id]` | JWT + pengurus | CRUD jadwal |

### Pendukung (baru)
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/kunjungan`, `/api/toko-jemaat`, `/api/popup-ads`, `/api/notofications`, `/api/materi-komsel` | - |
| GET | `/api/materi-komsel/getlink?tgl_komsel=&judul=` | - |
| POST/PUT/DELETE | di atas `/:id` | JWT + pengurus |

### Upload (chunk, Resumable.js)
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/chunk-upload` (query `resumableIdentifier`, `resumableChunkNumber`) | JWT + pengurus |
| POST | `/api/chunk-upload` (multipart, field `file`) | JWT + pengurus |
| POST | `/api/chunk-cleanup` (body `{ identifier }`) | JWT + pengurus |

> Chunk upload dipakai untuk file besar (PDF/PPT/PPTX), mis. materi kotbah.
> Protokol mengikuti Resumable.js: kirim chunk bertahap, jika semua chunk
> sudah terupload server menggabungkannya menjadi satu file di
> `public/uploads/materi-kotbah/<random>.<ext>` dan mengembalikan nama file
> (untuk disimpan ke database via endpoint CRUD terkait).

> Catatan: tabel & endpoint pendukung (kunjungan, toko jemaat, popup ads, notifikasi,
> materi komsel) dibuat lengkap meski belum ada di `routes/api.php` Laravel, agar API
> mencakup seluruh skema database.

## Migrasi Data MySQL -> PostgreSQL

Dump lama (`philadel_db_gbiplc.sql`) adalah dump MySQL phpMyAdmin. Script
[`prisma/import-mysql-dump.js`](prisma/import-mysql-dump.js) mem-parse dump tersebut
dan menyisipkan datanya ke PostgreSQL melalui Prisma, **mempertahankan ID asli**
agar relasi antar tabel tetap valid.

```bash
npm run db:import            # dry-run: tampilkan jumlah baris per tabel
npm run db:import:apply      # benar-benar menulis ke database
node prisma/import-mysql-dump.js path/to/dump.sql --apply
```

Cara kerja & catatan:

- Hanya tabel yang ada di schema Prisma yang diimport; tabel internal Laravel
  (`cache`, `jobs`, `sessions`, `migrations`, dll) otomatis dilewati.
- Dengan `--apply`, data lama pada tabel yang diimport **dihapus dulu** lalu
  disisipkan ulang (dump dianggap sumber data resmi), dan sequence `id`
  disinkronkan agar id baru tidak bentrok.
- Konversi tipe dilakukan otomatis berdasar schema Prisma:
  - `datetime`/`timestamp` MySQL → `timestamptz` PostgreSQL;
    nilai `0000-00-00 00:00:00` menjadi `NULL`.
  - `tinyint(1)` → `Boolean`, `int` → `Int`, `enum` MySQL → enum Prisma.
  - Kolom `TIME` (youth_schedules) → disimpan sebagai `String` (`HH:MM`).
  - Kolom `id` auto-increment → `serial` PostgreSQL (sequence di-sync).
- **Password**: hash bcrypt Laravel (`$2y$`) kompatibel dengan bcryptjs yang
  dipakai backend, jadi jemaat yang punya password tetap bisa login. User tanpa
  password (`NULL`) tidak bisa login sampai password di-set (lihat FAQ).

## Catatan Implementasi

- **Algoritma JWT** diubah dari RS256 (Laravel) ke **HS256** agar tidak perlu
  pasangan kunci RSA. Token hanya diverifikasi oleh backend, bukan oleh client,
  sehingga aman & sederhana.
- **Fitur Reading** memakai scraping `alkitab.mobi` + URL audio `SABDA.org`
  (sama seperti Laravel) dengan cache in-memory (node-cache) 7 hari.
  URL audio tidak divalidasi keberadaannya (sesuai perilaku aslinya).
- **Email** bersifat opsional. Jika `MAIL_ENABLED=false`, link reset dicetak ke
  log server (mode development). Untuk produksi, isi konfigurasi SMTP di `.env`.
- **Upload file** disimpan di `public/uploads/` dan disajikan di `/uploads/<path>`.

## Keamanan

- Password di-hash dengan bcrypt (cost 12).
- Path upload dibatasi (anti path traversal) di `fileUploadService.deleteFile`.
- Validasi input dengan Zod di semua endpoint tulis.
- Role-based access control lewat middleware `authenticate` + `authorize`.
