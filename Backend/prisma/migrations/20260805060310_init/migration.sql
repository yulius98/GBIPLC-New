-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('jemaat', 'pengurus', 'pendeta');

-- CreateEnum
CREATE TYPE "YouthGalleryType" AS ENUM ('image', 'video');

-- CreateEnum
CREATE TYPE "YouthScheduleType" AS ENUM ('weekly', 'special_event');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "email_verified_at" TIMESTAMP(3),
    "password" TEXT,
    "alamat" TEXT,
    "tgl_lahir" TIMESTAMP(3),
    "no_HP" TEXT,
    "gol_darah" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "filename" TEXT,
    "path" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'jemaat',
    "reading_start_date" TIMESTAMP(3),
    "remember_token" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "tbl_kunjungans" (
    "id" SERIAL NOT NULL,
    "id_jemaat" INTEGER NOT NULL,
    "tglkunjungan" TIMESTAMP(3) NOT NULL,
    "nama_timbesuk" TEXT NOT NULL,
    "filename" TEXT,
    "path" TEXT,
    "keterangan" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_kunjungans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_carousels" (
    "id" SERIAL NOT NULL,
    "tema" TEXT,
    "description" TEXT,
    "filename" TEXT,
    "path" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_carousels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_toko_jemaats" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "nama_usaha" TEXT NOT NULL,
    "jenis_usaha" TEXT NOT NULL,
    "alamat_usaha" TEXT NOT NULL,
    "no_telp" INTEGER,
    "keterangan" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_toko_jemaats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_pastor_notes" (
    "id" SERIAL NOT NULL,
    "tgl_note" TIMESTAMP(3) NOT NULL,
    "note" TEXT NOT NULL,
    "filename" TEXT,
    "path" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_pastor_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_events" (
    "id" SERIAL NOT NULL,
    "tgl_event" TIMESTAMP(3) NOT NULL,
    "keterangan" TEXT,
    "filename" TEXT,
    "path" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_popup_ads" (
    "id" SERIAL NOT NULL,
    "filename" TEXT,
    "path" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_popup_ads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_materi_kotbahs" (
    "id" SERIAL NOT NULL,
    "tgl_kotbah" TIMESTAMP(3) NOT NULL,
    "judul" TEXT,
    "filename" TEXT,
    "path" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_materi_kotbahs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_ibadah_rayas" (
    "id" SERIAL NOT NULL,
    "tgl_ibadah" TIMESTAMP(3) NOT NULL,
    "ibadah_ke" TEXT,
    "link_ibadah" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_ibadah_rayas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_komsels" (
    "id" SERIAL NOT NULL,
    "nama_komsel" TEXT NOT NULL,
    "ketua_komsel" TEXT NOT NULL,
    "no_telp" TEXT,
    "alamat" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_komsels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_materi_komsels" (
    "id" SERIAL NOT NULL,
    "tgl_komsel" TIMESTAMP(3) NOT NULL,
    "judul" TEXT,
    "filename" TEXT,
    "path" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_materi_komsels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_schedules" (
    "id" SERIAL NOT NULL,
    "day" INTEGER NOT NULL,
    "morning_passage" TEXT NOT NULL,
    "evening_passage" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reading_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_youth_programs" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "frequency" TEXT NOT NULL,
    "category" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_youth_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_youth_galleries" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "YouthGalleryType" NOT NULL DEFAULT 'image',
    "file_path" TEXT NOT NULL,
    "thumbnail_path" TEXT,
    "category" TEXT,
    "event_date" TIMESTAMP(3),
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_youth_galleries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_youth_schedules" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "YouthScheduleType" NOT NULL DEFAULT 'weekly',
    "day_of_week" TEXT,
    "event_date" TIMESTAMP(3),
    "start_time" TEXT,
    "end_time" TEXT,
    "location" TEXT NOT NULL,
    "location_url" TEXT,
    "category" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_youth_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notofications" (
    "id" SERIAL NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "jam_kirim" TIMESTAMP(3),
    "pesan" TEXT NOT NULL,
    "frekuensi" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notofications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "tbl_kunjungans_id_jemaat_idx" ON "tbl_kunjungans"("id_jemaat");

-- CreateIndex
CREATE UNIQUE INDEX "reading_schedules_day_key" ON "reading_schedules"("day");

-- AddForeignKey
ALTER TABLE "tbl_kunjungans" ADD CONSTRAINT "tbl_kunjungans_id_jemaat_fkey" FOREIGN KEY ("id_jemaat") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
