-- Opsi 1 (Hybrid): tambahkan kolom public_id UUID v7.
--
-- Tabel dipilih: users + tbl_service_schedules (pilot phase).
-- Kolom id (Int autoincrement) TETAP dipertahankan sebagai PK internal
-- untuk join/FK; public_id dipakai sebagai identifier di level API.
--
-- PENTING (Prisma migrate): statement di file ini dipisahkan per ';'.
-- Jadi body fungsi HARUS bebas ';' — karena itu dibuat LANGUAGE sql
-- (satu ekspresi SELECT, tanpa BEGIN END), bukan LANGUAGE plpgsql.
-- Body juga bebas ';' agar tidak terbelah oleh migrator.
--
-- Postgres 16 belum punya uuidv7() native (masuk di PG18), jadi fungsi
-- dibuat di sini dan dipakai sebagai DEFAULT kolom — UUID v7 tetap
-- time-ordered sehingga index B-tree tetap rapi (tidak acak seperti v4).

-- ========== Fungsi generator UUID v7 ==========
-- Catatan sintaks: fungsi biasa (substr/overlay) wajib/khusus bentuk argumen
-- koma atau bentuk khusus SQL. substr() = fungsi biasa -> argumen koma.
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

-- ========== users ==========
-- 1) Tambah kolom (nullable dulu agar UPDATE backfill jelas terlihat)
ALTER TABLE "users" ADD COLUMN "public_id" UUID;

-- 2) BACKFILL data lama: tiap baris eksisting mendapat UUID v7 unik.
--    Idempotent: baris yang sudah punya nilai tidak ditimpa.
UPDATE "users" SET "public_id" = uuid_generate_v7() WHERE "public_id" IS NULL;

-- 3) Perkuat: NOT NULL + DEFAULT + UNIQUE
ALTER TABLE "users" ALTER COLUMN "public_id" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v7();
CREATE UNIQUE INDEX "users_public_id_key" ON "users"("public_id");

-- ========== tbl_service_schedules ==========
ALTER TABLE "tbl_service_schedules" ADD COLUMN "public_id" UUID;

UPDATE "tbl_service_schedules"
SET "public_id" = uuid_generate_v7()
WHERE "public_id" IS NULL;

ALTER TABLE "tbl_service_schedules" ALTER COLUMN "public_id" SET NOT NULL;
ALTER TABLE "tbl_service_schedules" ALTER COLUMN "public_id" SET DEFAULT uuid_generate_v7();
CREATE UNIQUE INDEX "tbl_service_schedules_public_id_key" ON "tbl_service_schedules"("public_id");
