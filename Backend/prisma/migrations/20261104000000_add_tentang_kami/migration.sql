-- Tabel "Tentang Kami" untuk halaman /tentang (footing: singleton + multi-row)
-- Digunakan oleh: AboutPage (publik) + card "Tentang Kami" di panel Setting admin.

-- ========== tbl_tentang_kami (singleton, id=1) ==========
CREATE TABLE "tbl_tentang_kami" (
    "id" SERIAL NOT NULL,
    "judul" TEXT NOT NULL,
    "sub_judul" TEXT NOT NULL,
    "lede" TEXT NOT NULL,
    "paragraf_1" TEXT NOT NULL,
    "paragraf_2" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_tentang_kami_pkey" PRIMARY KEY ("id")
);

-- Seed data awal dari konten yang sebelumnya hardcode di AboutPage.jsx
INSERT INTO "tbl_tentang_kami"
  ("judul", "sub_judul", "lede", "paragraf_1", "paragraf_2", "created_at", "updated_at")
SELECT
  'Mengenal GBI Philadelphia Life Center',
  'Gereja Bethel di Yogyakarta yang terbuka bagi setiap keluarga untuk bertumbuh dalam iman dan kasih Kristus.',
  'Gereja Bethel Indonesia (GBI) Philadelphia Life Center di Yogyakarta yang melayani Ibadah Raya, Youth Ministry, dan Life Group.',
  'GBI Philadelphia Life Center (GBI PLC) adalah gereja Bethel di Yogyakarta yang terbuka bagi setiap keluarga. Kami merayakan Ibadah Raya setiap Minggu pukul 10.00 WIB, membagikan materi kotbah dan renungan Saat Teduh harian, serta melayani generasi muda lewat Youth Ministry dan persekutuan Life Group.',
  'Kami percaya gereja adalah rumah — tempat setiap orang disambut, diperlengkapi, dan dikirim untuk menjadi berkat bagi Yogyakarta. Apapun tahap hidup Anda, ada tempat bagi Anda dalam keluarga GBI PLC.',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "tbl_tentang_kami");

-- ========== tbl_tentang_kami_pelayanan (multi-row, kartu pelayanan) ==========
-- public_id UUID v7: dipakai admin CRUD; fungsi uuid_generate_v7()
-- sudah dibuat migration 20261102000000_add_public_id_uuid_v7.
CREATE TABLE "tbl_tentang_kami_pelayanan" (
    "id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "icon" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "frekuensi" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_tentang_kami_pelayanan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tbl_tentang_kami_pelayanan_public_id_key" ON "tbl_tentang_kami_pelayanan"("public_id");

-- Seed 4 kartu pelayanan dari array yang sebelumnya hardcode di AboutPage.jsx
INSERT INTO "tbl_tentang_kami_pelayanan" ("icon", "judul", "frekuensi", "deskripsi", "updated_at")
SELECT icon, judul, frekuensi, deskripsi, CURRENT_TIMESTAMP
FROM (VALUES
  ('IR', 'Ibadah Raya', 'Setiap Minggu, 10.00 WIB',
   'Perayaan bersama keluarga besar GBI PLC — menyembah Tuhan, mendengarkan kotbah, dan bertumbuh dalam iman.'),
  ('ST', 'Materi Kotbah & Saat Teduh', 'Mingguan & Harian',
   'Dapatkan materi kotbah mingguan dan renungan Saat Teduh harian untuk memperdalam perjalanan rohani Anda.'),
  ('YM', 'Youth Ministry', 'Sabtu, 16.00 WIB',
   'Wadah bagi generasi muda untuk bertumbuh dalam iman, persekutuan, dan pelayanan.'),
  ('LG', 'Life Group', 'Terjadwal',
   'Persekutuan kecil antar keluarga agar setiap anggota saling menguatkan dan bertumbuh bersama.')
) AS seed(icon, judul, frekuensi, deskripsi)
WHERE NOT EXISTS (SELECT 1 FROM "tbl_tentang_kami_pelayanan");
