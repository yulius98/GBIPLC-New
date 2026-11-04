-- AlterTable
ALTER TABLE "tbl_tentang_kami" ALTER COLUMN "selayang_judul" DROP DEFAULT,
ALTER COLUMN "pelayanan_judul" DROP DEFAULT;

-- CreateTable
CREATE TABLE "tbl_visitor_counts" (
    "id" SERIAL NOT NULL,
    "visitor_hash" TEXT NOT NULL,
    "visit_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_visitor_counts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_visitor_counts_visitor_hash_key" ON "tbl_visitor_counts"("visitor_hash");
