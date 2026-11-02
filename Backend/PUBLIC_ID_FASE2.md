# Fase 2 — Public ID UUID v7: Daftar Tugas

> Lanjutan dari [`PUBLIC_ID_UUID.md`](./PUBLIC_ID_UUID.md). Fase 1 sudah
> selesai dan tervalidasi untuk `users` + `tbl_service_schedules`. Dokumen ini
> adalah **checklist kerja fase 2**: tabel sisanya, titik kode yang harus
> disentuh (backend & frontend), urutan deploy yang aman, serta keputusan
> menyembunyikan `id` internal dari respons API.

## 0. Prinsip Kerja Fase 2

Fase 1 sudah menyiapkan seluruh infrastruktur — di fase 2 **tidak perlu
mengubah `crudFactory.js` lagi**. Setiap tabel baru cukup lewat pola ini:

```text
migration SQL (template Section 5 PUBLIC_ID_UUID.md)
  → schema.prisma (+13 blok kolom public_id)
  → npx prisma generate + migrate
  → perbaiki titik kode manual + FE
```

Urutan besar yang menjaga keamanan deploy:

```text
BE deploy dulu (respons masih memuat id + public_id)
  → FE dipindah ke public_id
  → baru id internal disembunyikan dari respons
```

Dengan begitu tidak ada langkah yang mematahkan klien yang sedang berjalan.

---

## 1. Tabel yang Di-UUID-kan (13 tabel)

Semua memakai template migrasi persis Section 5 dokumen utama. **Nama fisik
tabel SQL WAJIB** sesuai nilai `@@map` di `prisma/schema.prisma`, bukan nama
model Prisma:

| #  | Tabel fisik (SQL)      | Model Prisma       | API yang bersangkutan |
|----|------------------------|--------------------|----------------------|
| 1  | `tbl_kunjungans`       | `TblKunjungan`     | `/kunjungan` (list publik; tulis = auth pengurus) |
| 2  | `tbl_carousels`        | `TblCarousel`      | `/carousel` publik + `/admin/carousel` |
| 3  | `tbl_toko_jemaats`     | `TblTokoJemaat`    | `/toko-jemaat` |
| 4  | `tbl_pastor_notes`     | `TblPastorNote`    | `/pastornote` publik + `/admin/pastornote` |
| 5  | `tbl_events`           | `TblEvent`         | `/event` publik + `/admin/event` |
| 6  | `tbl_popup_ads`        | `TblPopupAd`       | `/popup-ads` |
| 7  | `tbl_materi_kotbahs`   | `TblMateriKotbah`  | `/materi-kotbah` + **publik `/materi-kotbah/download/:id`** |
| 8  | `tbl_ibadah_rayas`     | `TblIbadahRaya`    | `/ibadahraya` publik + `/admin/ibadahraya` |
| 9  | `tbl_materi_komsels`   | `TblMateriKomsel`  | `/materi-komsel` (publik) + admin CRUD |
| 10 | `notofications`        | `Notofication`     | `/notofications` (publik GET + `:id`) |
| 11 | `tbl_youth_programs`   | `TblYouthProgram`  | `/youth/programs` (publik GET `:id`) |
| 12 | `tbl_youth_galleries`  | `TblYouthGallery`  | `/youth/galleries` (publik GET `:id`) |
| 13 | `tbl_youth_schedules`  | `TblYouthSchedule` | `/youth/schedules` (publik GET `:id`) |

**Sengaja tidak diubah** (konsisten dengan keputusan fase 1): `tbl_komsels`,
`tbl_seo_settings`, `reading_schedules`, `password_reset_tokens`.

---

## 2. Titik Kode Backend yang Harus Disentuh (hasil audit aktual)

### 2.1 `src/utils/crudFactory.js` — ✅ TIDAK DIUBAH LAGI

`get/update/remove` sudah uuid-aware (`resolveRowId`) sejak fase 1. 13 tabel
ini semuanya lewat `createCrudController()` → otomatis mendukung
`public_id` begitu kolomnya ada di schema. Tambahan util di factory hanya
untuk langkah "sembunyikan id dari respons" (poin 4).

### 2.2 `src/modules/contents/contents.controller.js` — `downloadMateriKotbah()`

Query manual `findUnique({ where: { id } })` → ganti:

```js
import resolveRowId from '../../utils/publicId.js';

// ...
const selector = resolveRowId(req.params.id);
if (!selector) throw new AppError('File tidak ditemukan', 404);

const item = await prisma.tblMateriKotbah.findUnique({ where: selector });
```

Ini **endpoint publik** (download file) — prioritas karena URL-nya saat ini
masih dapat di-enumerate.

### 2.3 `src/modules/dashboard/dashboard.controller.js` — `index()`

`GET /api/dashboard/:id` masih `Number(req.params.id)` + cari User via `id`.
Karena `users` sudah memiliki `public_id` sejak fase 1, langsung diubah:

```js
const selector = resolveRowId(req.params.id);
if (!selector) throw new AppError('User tidak ditemukan', 404);

const user = await prisma.user.findUnique({
  where: selector,
  select: { name: true },
});
```

### 2.4 Yang TIDAK perlu diubah

- `token.service.js` — JWT `sub = id` internal dipertahankan.
- `misc.routes.js` / `admin.routes.js` / `youth.routes.js` — bekas tabel
  didefinisikan lewat `createCrudController` → otomatis.
- `users.routes.js` / `users.controller.js` — sudah hybrid sejak fase 1.

---

## 3. Titik Kode Frontend yang Harus Disentuh (hasil audit aktual)

### 3.1 `components/AdminCrudPage.jsx` — **satu file untuk 6 CRUD sekaligus**

Baris `api.put(\`${apiPath}/${editing.id}\`)` dan
`api.delete(\`${apiPath}/${item.id}\`)` → ganti ke `public_id`. Satu file ini
melayani halaman `AdminKunjunganPage` (`/kunjungan`), `AdminKegiatanPage`
(`/admin/carousel`, `/admin/event`), `AdminSaatTeduhPage`
(`/admin/pastornote`), dan `AdminIbadahRayaPage` (`/admin/materi-kotbah`,
`/admin/ibadahraya`).

> ⚠️ **Urutan aman**: ubah FE dulu ke `item.public_id ?? item.id`
> (dengan fallback) — sebelum BE migrate, fallback id masih jalan; setelah BE
> migrate, fallback otomatis tidak terpakai. Fallback bisa dipangkas
> belakangan setelah id disembunyikan dari respons (poin 4).

Pastikan uji mencakup: CRUD murni, upload file, dan delete item yang punya
file (contoh: hapus materi kotbah / foto jemaat) karena `fileFields`
membaca file lama dari baris eksisting.

### 3.2 `pages/DashboardPage.jsx`

`api.get(\`/dashboard/${user.id}\`)` → `/dashboard/${user.public_id}`
(pasangan dari Section 2.3).

### 3.3 Sudah selesai fase 1 (tidak disentuh lagi)

`MyDataPage.jsx`, `ProfilePage.jsx`, `ServiceScheduleSection.jsx` — sudah
`public_id`.

### 3.4 Halaman yang TIDAK memakai id di URL (backend-only)

`YouthPage.jsx`, popup-ads, notofications, materi-komsel, toko-jemaat —
semuanya hanya memanggil list. **Tidak ada perubahan FE** untuk 5 tabel
tersebut.

---

## 4. Langkah Penutup Fase 2: Sembunyikan `id` Internal dari Respons API

Saat ini respons masih memuat `id` + `public_id` bersamaan (disengaja selama
transisi). Target akhir: **id internal tidak dikirim ke klien lagi**.

**Opsi A (disarankan — konservatif):**

- Endpoint **publik** (tanpa auth): `/carousel`, `/event`, `/pastornote`,
  `/kunjungan`, `/popup-ads`, `/notofications`, `/materi-komsel`,
  `/materi-kotbah` (list & `available`), `/ibadahraya`, `/youth/*`,
  `/lifegroup`, `/birthday` → `id` dihilangkan dari respons, hanya `public_id`.
- Endpoint **auth pengurus** (`/admin/*`) → tetap memuat `id` internal
  sampai aplikasi mobile Flutter diaudit, karena klien lama mungkin membaca
  `id` dari respons.

**Opsi B (bersih total):** crudFactory membuang `id` dari respons untuk semua tabel
yang punya `public_id` (satu patch di factory), diikuti QA aplikasi mobile.
Risiko: mobile lama ikut tidak lagi menerima `id`.

Sketsa implementasi di crudFactory (saat langkah ini dijalankan):

```js
// di handler list/get/create/update sebelum res.json()
const strip = (rows) => hasPublicId
  ? rows.map(({ id, ...rest }) => rest)
  : rows;
```

Catatan: `user.serializer.js` sudah aman mengatur field ekspos — cukup
pastikan `id` tidak dimasukkan lagi bila Opsi B dipilih.

---

## 5. Urutan Deploy (Runbook Eksekusi Fase 2)

```text
1) Backup database (pg_dump) — wajib
2) BE: migration batch 13 tabel + schema.prisma + npx prisma generate
3) Deploy BE — respons masih memuat keduanya (id + public_id)
4) Verifikasi backfill: count(id) == count(public_id) per tabel,
   semua UUID digit-7 (query verifikasi milik PUBLIC_ID_UUID.md Section 3)
5) FE: AdminCrudPage (public_id ?? id), DashboardPage (public_id), build
6) Uji UI lengkap di 6 halaman admin (CRUD + upload + delete berkas),
   materi-kotbah download, halaman dashboard
7) BE: sembunyikan id dari endpoint publik (Opsi A)
8) Audit + QA mobile Flutter; jalankan Opsi B bila ingin bersih total
9) Perbarui status implementasi di PUBLIC_ID_UUID.md → "fase 2 selesai"
```

Verifikasi SQL final:

```sql
-- harus 0 di SEMUA tabel yang di-UUID-kan (13 tabel)
SELECT 'tbl_kunjungans' AS t, COUNT(*) FROM tbl_kunjungans WHERE public_id IS NULL
UNION ALL SELECT 'tbl_carousels', COUNT(*) FROM tbl_carousels WHERE public_id IS NULL
UNION ALL SELECT 'tbl_toko_jemaats', COUNT(*) FROM tbl_toko_jemaats WHERE public_id IS NULL
UNION ALL SELECT 'tbl_pastor_notes', COUNT(*) FROM tbl_pastor_notes WHERE public_id IS NULL
UNION ALL SELECT 'tbl_events', COUNT(*) FROM tbl_events WHERE public_id IS NULL
UNION ALL SELECT 'tbl_popup_ads', COUNT(*) FROM tbl_popup_ads WHERE public_id IS NULL
UNION ALL SELECT 'tbl_materi_kotbahs', COUNT(*) FROM tbl_materi_kotbahs WHERE public_id IS NULL
UNION ALL SELECT 'tbl_ibadah_rayas', COUNT(*) FROM tbl_ibadah_rayas WHERE public_id IS NULL
UNION ALL SELECT 'tbl_materi_komsels', COUNT(*) FROM tbl_materi_komsels WHERE public_id IS NULL
UNION ALL SELECT 'notofications', COUNT(*) FROM notofications WHERE public_id IS NULL
UNION ALL SELECT 'tbl_youth_programs', COUNT(*) FROM tbl_youth_programs WHERE public_id IS NULL
UNION ALL SELECT 'tbl_youth_galleries', COUNT(*) FROM tbl_youth_galleries WHERE public_id IS NULL
UNION ALL SELECT 'tbl_youth_schedules', COUNT(*) FROM tbl_youth_schedules WHERE public_id IS NULL;
```

Verifikasi API: lakukan CRUD satu item di tiap halaman admin, dan
`GET /materi-kotbah/download/<public_id>` dari halaman Ibadah Raya.

---

## 6. Rollback Fase 2

Pola sama dengan fase 1 (lihat `PUBLIC_ID_UUID.md` Section 7). Karena tiap
tabel berdiri sendiri, rollback per-tabel pun bisa:

```sql
DROP INDEX IF EXISTS "<tabel>_public_id_key";
ALTER TABLE "<tabel>" DROP COLUMN IF EXISTS "public_id";
```

---

*Disusun dari audit aktual: grep FE `api.(get|put|delete)(` + `apiPath=`
(ditemukan AdminCrudPage melayani 6 apiPath) dan grep BE
`Number(req.params.id)` (2 lokasi). Bila struktur kode berubah, ulangi dua
audit greep yang sama.*
