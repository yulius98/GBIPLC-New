-- Tabel Data Gembala (singleton, id=1): nama gembala & wakil gembala
-- untuk footer PublicLayout (pentas publik) dan panel admin Setting.

CREATE TABLE "tbl_data_gembala" (
    "id" SERIAL NOT NULL,
    "nama_gembala" TEXT NOT NULL,
    "wakil_gembala" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_data_gembala_pkey" PRIMARY KEY ("id")
);

-- Seed data awal agar footer tidak kosong di prod:
-- nilai yang sebelumnya hardcode di PublicLayout.jsx
INSERT INTO "tbl_data_gembala" ("nama_gembala", "wakil_gembala", "created_at", "updated_at")
SELECT 'Pdm. Jimmy Sugiarto', 'Pdm. Freddy Budiman', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "tbl_data_gembala");
