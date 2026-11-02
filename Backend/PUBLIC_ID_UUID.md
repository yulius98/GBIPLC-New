# Public ID UUID v7 (Opsi Hybrid) — Panduan Implementasi & Backfill

> Dokumentasi implementasi UUID sebagai **public identifier** di seluruh API
> backend GBI PLC, termasuk cara **backfill data lama** yang sudah berjalan
> di production.

## 1. Latar Belakang & Keputusan Arsitektur

### Kenapa tidak langsung ganti semua `id` ke UUID?

Ganti PK ke UUID di **semua** tabel dengan satu kali langkah itu berisiko besar
(19 tabel: schema, FK, seed, crudFactory, JWT, frontend). Keputusan yang
diambil adalah **Opsi 1 (Hybrid)**:

- Kolom `id` (`Int autoincrement`) **TETAP** sebagai PK internal untuk join/FK.
- Kolom **baru** `public_id` (`UUID v7`) ditambahkan sebagai identifier yang
  diekspos ke level API (URL `/:id`, payload respons).

Manfaat:

1. **Anti-enumeration** — URL seperti `/admin/kunjungan/57` tidak lagi
   membocorkan jumlah baris; identifier tidak terduga (mis. `/admin/kunjungan/0190...`).
2. **Index tetap sehat** — v7 *time-ordered*, tidak menyebar acak seperti v4.
3. **Migrasi berlapis** — bisa tabel demi tabel tanpa mematahkan relasi `Int`
   yang sudah ada (mis. `tbl_kunjungan.id_jemaat`).
4. **Backward compatible** — selama transisi, endpoint menerima UUID *maupun*
   angka.

### Kenapa UUID **v7**, bukan v4?

| Versi | Karakter | Konsekuensi index B-tree |
|-------|----------|--------------------------|
| v4 (random) | acak penuh | index fragmentation, cache miss tinggi |
| **v7 (time-ordered)** | timestamp millis di 48 bit pertama | hampir sebagus autoincrement |

UUID v7 digenerate **di database** oleh fungsi `uuid_generate_v7()` karena
Postgres 16 (versi `docker-compose.yml`) belum punya `uuidv7()` native
(masuk mulai Postgres 18).

---

## 2. Status Implementasi

### Fase 1 (selesai)

| Tabel | Kolom | Migration |
|-------|-------|-----------|
| `users` | `public_id UUID @unique DEFAULT uuid_generate_v7()` | `20261102000000_add_public_id_uuid_v7` |
| `tbl_service_schedules` | idem | idem |

Kode pendukung:

| File | Peran |
|------|-------|
| `src/utils/publicId.js` | `resolveRowId(raw)` → `{ public_id }` (UUID) atau `{ id }` (Int) atau `null` |
| `src/utils/crudFactory.js` | `get/update/remove` uuid-aware — semua tabel yang memakai factory otomatis siap fase 2 |
| `src/modules/users/users.controller.js` | `/myprofile/:id` menerima UUID atau Int |
| `src/modules/users/user.serializer.js` | `public_id` ikut keluar di semua respons user |

Frontend yang sudah memakai `public_id`:
`MyDataPage.jsx`, `ProfilePage.jsx`, `components/ServiceScheduleSection.jsx`.

### Fase 2 (rencana — tabel yang sama polanya)

Daftar lengkap 13 tabel, titik kode yang harus disentuh, urutan deploy, dan
keputusan menyembunyikan `id` internal dari respons:
**[`PUBLIC_ID_FASE2.md`](./PUBLIC_ID_FASE2.md)**.

### Tabel yang sengaja TIDAK di-UUID-kan

| Tabel | Alasan |
|-------|--------|
| `reading_schedules` | 298 baris statis, id tidak pernah dikirim sebagai identifier ke klien |
| `tbl_seo_settings` | Singleton — kode mengandalkan `id = 1` |
| `password_reset_tokens` | Sudah aman via token acak |
| `tbl_komsels` | Belum ada endpoint per-row (list saja) |

---

## 3. Cara Deploy ke Production (Runbook)

`docker-compose.yml` sudah menjalankan `npx prisma migrate deploy` otomatis
saat container backend start, jadi backfill berjalan otomatis saat deploy.

```bash
# 0) Pre-flight: backup dulu (wajib)
docker exec gbiplc-db pg_dump -U "$DB_USER" -Fc "$DB_NAME" > backup_$(date +%F).dump

# 1) Deploy (migrasi + backfill berjalan otomatis)
docker compose up -d --build backend

# 2) Pantau log migrasi
docker compose logs -f backend | grep -i migrate
```

Atau manual / lokal:

```bash
cd Backend
npm run db:migrate        # prisma migrate dev (dev; membuat client baru)
# atau
npm run db:deploy         # prisma migrate deploy (prod; tanpa prompt)
```

### Checklist verifikasi pasca-deploy

```sql
-- 1) Semua baris lama harus sudah punya public_id
SELECT COUNT(*) FROM users WHERE public_id IS NULL;              -- harus 0
SELECT COUNT(*) FROM tbl_service_schedules WHERE public_id IS NULL; -- harus 0

-- 2) UUID harus format v7 (bit version = 7 → digit ke-13 = '7')
SELECT id, public_id FROM users
WHERE substr(public_id::text, 15, 1) <> '7' OR public_id IS NULL
LIMIT 5;                                                         -- harus kosong

-- 3) Unik?
SELECT COUNT(*), COUNT(DISTINCT public_id) FROM users;           -- kedua angka sama
```

Uji dari sisi API:

```bash
# ambil public_id dari /api/user (login dulu), lalu:
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/myprofile/<public_id>
# ganti dengan id Int lama (uji kompatibilitas) — juga harus jalan selama transisi:
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/myprofile/<id_int>
```

Uji UI: edit profil di `/data-saya`, edit/hapus jadwal ibadah di
`/dashboard/setting`.

---

## 4. Cara Backfill Data Lama (Detail)

Backfill **ada di dalam migrasi** (statement `UPDATE ... WHERE public_id IS NULL`),
sehingga:

1. **Idempotent** — dapat di-re-run kapan pun dengan aman; baris yang sudah punya nilai
   tidak pernah ditimpa (`WHERE ... IS NULL`).
2. **Zero-downtime friendly** — kolom ditambah nullable → diisi → baru
   `SET NOT NULL`; table lock sesingkat-singkatnya (tabel aplikasi ini masih
   kecil, jadi aman).
3. Baris **baru** setelah migrate otomatis dapat UUID dari `DEFAULT`.

### Re-run backfill manual (tanpa migrasi baru)

Jika ada baris yang entah bagaimana kelewat (bulk import, restore partial):

```sql
-- /tmp atau langsung di psql:
docker exec -it gbiplc-db psql -U "$DB_USER" -d "$DB_NAME"

-- a) pastikan fungsi ada (migration sudah membuatnya):
SELECT uuid_generate_v7();

-- b) backfill idempotent semua tabel yang punya kolom public_id:
UPDATE users                SET public_id = uuid_generate_v7() WHERE public_id IS NULL;
UPDATE tbl_service_schedules SET public_id = uuid_generate_v7() WHERE public_id IS NULL;
-- fase 2: tambahkan tabel lain persis pola ini

-- c) cek sisa
SELECT 'users' t, count(*) total, count(public_id) filled FROM users
UNION ALL
SELECT 'tbl_service_schedules', count(*), count(public_id)
  FROM tbl_service_schedules;
```

> Catatan: tabel di aplikasi ini masih kecil sehingga `UPDATE` sekali jalan
> aman. Untuk tabel fase 2 yang kelak berukuran besar (ratusan ribu baris),
> pecah `UPDATE` per-batch (`WHERE id BETWEEN ... `) dengan jeda antar-batch.

---

## 5. Resep Menambah Tabel Baru (Fase 2)

### Langkah 1 — Template SQL migration

Buat folder `prisma/migrations/<timestamp>_add_public_id_<tabel>/migration.sql`
(idem pola fase 1 — blok fungsi generator boleh ditulis ulang karena
`CREATE OR REPLACE` no-op dan aman):

```sql
-- PENTING (Prisma migrate): statement SQL dipisah per ';', jadi body fungsi
-- harus bebas ';'. Karena itu dibuat LANGUAGE sql (satu ekspresi SELECT),
-- bukan LANGUAGE plpgsql (BEGIN ... END mengandung ';').
-- substr() = fungsi biasa -> argumen koma; sintaks "FROM" hanya untuk
-- substring()/overlay() bentuk khusus.
CREATE OR REPLACE FUNCTION uuid_generate_v7() RETURNS uuid
LANGUAGE sql VOLATILE AS $$
  SELECT encode(
           set_bit(
             set_bit(
               overlay(
                 uuid_send(gen_random_uuid())
                 PLACING substr(
                   int8send(floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint),
                   3)
                 FROM 1 FOR 6),
             52, 1), 53, 1),
           'hex')::uuid
$$;

ALTER TABLE "<nama_tabel>" ADD COLUMN "public_id" UUID;

-- BACKFILL data lama (idempotent)
UPDATE "<nama_tabel>" SET "public_id" = uuid_generate_v7() WHERE "public_id" IS NULL;

ALTER TABLE "<nama_tabel>" ALTER COLUMN "public_id" SET NOT NULL;
ALTER TABLE "<nama_tabel>" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v7();
CREATE UNIQUE INDEX "<nama_tabel>_public_id_key" ON "<nama_tabel>"("public_id");
```

> Cukup catat nama fisik tabelnya (bukan nama model) yang tercantum di
> `@@map("...")` pada `prisma/schema.prisma` — nama tabel fisik SQL harus persis.

### Langkah 2 — schema.prisma

```prisma
public_id String @unique @db.Uuid @default(dbgenerated("uuid_generate_v7()"))
```

(Lakukan `npx prisma generate` agar tipe `public_id: string` tersedia di client.)

### Langkah 3 — Backend

- Tabel memakai `createCrudController` → **tidak perlu kode tambahan**
  (`crudFactory` sudah uuid-aware sejak fase 1).
- Route/controller yang query manual (`findUnique({ where: { id: Number(...) } })`)
  → ganti ke `resolveRowId(req.params.id)` (lihat `users.controller.js`).
- Serializer/field yang di-expose → masukkan `public_id` ke daftar field aman
  (lihat `user.serializer.js`), dan jangan lagi keluarkan `id` internal
  ke respons API.
- **Jangan** ekspos `id` internal ke payload untuk endpoint barunya.

### Langkah 4 — Frontend

- Ganti semua penggunaan `item.id` di URL API menjadi `item.public_id`
  (cari pola `` api.put(`/.../${...id}`) `` atau `api.delete(...)` di
  `src/pages/` dan `src/components/`).
- Kolom tabel admin yang sekadar menampilkan data tidak perlu berubah —
  yang berubah hanya nilai identifier yang dikirim balik ke API (`public_id`).

---

## 6. Kompatibilitas (Sangat Penting)

- API menerima **kedua** format `:id` selama fase transisi — jalur mobile
  **Flutter (plc_mobile)** tidak patah selama transisi.
- JWT tetap memuat `sub = id` internal — klaim ini tidak pernah diekspos
  sebagai identifier API.
- Payload admin CRUD (`/api/admin/*`, `/api/youth/*`) menerima keduanya via
  crudFactory.

---

## 7. Rollback

Bila sesuatu rusak:

1. **Kode rollback** — `public_id` yang belum dipakai klien cukup diatasi
   dengan `git revert` commit frontend (frontend memakai `user.public_id`);
   backend tetap aman karena masih menerima `id` Int.
2. **Data rollback** — restore dump:
   ```bash
   docker exec -i gbiplc-db pg_restore -U "$DB_USER" -d "$DB_NAME" --clean < backup_YYYY-MM-DD.dump
   ```
3. **Drop kolom** (jika benar-benar perlu membuang kolom):
   ```sql
   DROP INDEX IF EXISTS "users_public_id_key";
   ALTER TABLE "users" DROP COLUMN IF EXISTS "public_id";
   DROP INDEX IF EXISTS "tbl_service_schedules_public_id_key";
   ALTER TABLE "tbl_service_schedules" DROP COLUMN IF EXISTS "public_id";
   -- fungsi uuid_generate_v7() boleh dibiarkan (tidak berdampak)
   ```
   Buat migration SQL baru untuk ini — **jangan** edit migration yang sudah
   `deploy` di prod.

## 8. Troubleshooting

| Gejala | Penyebab | Solusi |
|---|---|---|
| `ERROR: function uuid_generate_v7() does not exist` saat migrate | migrasi fase 1 belum jalan | `npm run db:deploy` di Backend |
| `syntax error at or near "FROM"` saat apply migration | fungsi generator dibuat `LANGUAGE plpgsql` (body mengandung `;` → terbelah migrator) atau `substr(x FROM n)` (sintaks salah; `substr` = fungsi biasa, pakai `substr(x, n)`) | gunakan fungsi `LANGUAGE sql` satu ekspresi persis template di Section 5 |
| Baris lama `public_id = null` | database hasil restore lama / migrasi tidak habis | jalankan blok backfill manual (Section 4) |
| `P2002 unique violation` saat bulk import | import script menulis kolom `public_id` dengan nilai duplikat | jangan set kolom `public_id` di import; biarkan pakai DEFAULT |
| FE gagal muat data setelah edit profil | localStorage user lama tanpa `public_id` | `/api/user` di-refetch otomatis saat boot; hard refresh |
| `404 Data tidak ditemukan` meski baris ada | param `:id` bukan UUID maupun angka (biasanya `undefined`/string kosong — cek FE mengirim `item.public_id`) | log param di backend; pastikan FE memakai `item.public_id` |

---

*Terakhir diperbarui: fase 1 — users + tbl_service_schedules
(migration `20261102000000_add_public_id_uuid_v7`).*
