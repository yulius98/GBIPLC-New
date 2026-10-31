-- CreateTable untuk jadwal ibadah (multi-row) di halaman Setting
CREATE TABLE "tbl_service_schedules" (
    "id" SERIAL NOT NULL,
    "service_name" TEXT NOT NULL,
    "day_of_week" TEXT NOT NULL,
    "opens" TEXT NOT NULL,
    "closes" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_service_schedules_pkey" PRIMARY KEY ("id")
);

-- Seed data awal: konversi jadwal single-row dari tbl_seo_settings (jika ada)
INSERT INTO "tbl_service_schedules" ("service_name", "day_of_week", "opens", "closes", "created_at", "updated_at")
SELECT service_name, day_of_week, opens, closes, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "tbl_seo_settings"
WHERE id = 1 AND service_name IS NOT NULL AND service_name <> ''
LIMIT 1;
