-- Judul-judul seksi halaman Tentang (sebelumnya hardcode di AboutPage.jsx):
-- - selayang_judul  : judul seksi "Siapa Kami" ("Sebuah Keluarga Iman di Yogyakarta")
-- - pelayanan_judul : judul seksi "Pelayanan" ("Yang Kami Lakukan Bersama")
--
-- Migration terpisah (bukan mengubah 20261104000000_add_tentang_kami) agar aman
-- meskipun migrasi sebelumnya sudah di-apply di database.

ALTER TABLE "tbl_tentang_kami"
  ADD COLUMN "selayang_judul"  TEXT NOT NULL DEFAULT 'Sebuah Keluarga Iman di Yogyakarta',
  ADD COLUMN "pelayanan_judul" TEXT NOT NULL DEFAULT 'Yang Kami Lakukan Bersama';
