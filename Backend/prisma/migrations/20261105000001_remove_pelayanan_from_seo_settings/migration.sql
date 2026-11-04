-- Hapus kolom "Pelayanan / Konsultasi" dari tbl_seo_settings.
-- Field pelayanan_* sudah tidak lagi ditampilkan/dipakai:
-- whitelist SEO_FIELDS di settings.controller.js tidak memasukkannya sejak
-- tabel tbl_service_schedules & halaman Kontak meniadakan kebutuhan widget ini.
-- Pembuka kolomnya: migration 20260921011202_add_pelayanan_to_seo_settings.

ALTER TABLE "tbl_seo_settings"
  DROP COLUMN IF EXISTS "pelayanan_title",
  DROP COLUMN IF EXISTS "pelayanan_description",
  DROP COLUMN IF EXISTS "pelayanan_button_label",
  DROP COLUMN IF EXISTS "pelayanan_whatsapp_message";
