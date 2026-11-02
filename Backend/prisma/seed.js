import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import DEFAULT_SEO from '../src/modules/settings/seoDefaults.js';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const BOOKS = [
  ['GEN', 50], ['EXO', 40], ['LEV', 27], ['NUM', 36], ['DEU', 34],
  ['JOS', 24], ['JDG', 21], ['RUT', 4], ['1SA', 31], ['2SA', 24],
  ['1KI', 22], ['2KI', 25], ['1CH', 29], ['2CH', 36], ['EZR', 10],
  ['NEH', 13], ['EST', 10], ['JOB', 42], ['PSA', 150], ['PRO', 31],
  ['ECC', 12], ['SNG', 8], ['ISA', 66], ['JER', 52], ['LAM', 5],
  ['EZK', 48], ['DAN', 12], ['HOS', 14], ['JOL', 3], ['AMO', 9],
  ['OBA', 1], ['JON', 4], ['MIC', 7], ['NAM', 3], ['HAB', 3],
  ['ZEP', 3], ['HAG', 2], ['ZEC', 14], ['MAL', 4], ['MAT', 28],
  ['MRK', 16], ['LUK', 24], ['JHN', 21], ['ACT', 28], ['ROM', 16],
  ['1CO', 16], ['2CO', 13], ['GAL', 6], ['EPH', 6], ['PHP', 4],
  ['COL', 4], ['1TH', 5], ['2TH', 3], ['1TI', 6], ['2TI', 4],
  ['TIT', 3], ['PHM', 1], ['HEB', 13], ['JAS', 5], ['1PE', 5],
  ['2PE', 3], ['1JN', 5], ['2JN', 1], ['3JN', 1], ['JUD', 1], ['REV', 22],
];

const TOTAL_DAYS = 298;

/**
 * Buat 298 hari jadwal bacaan Alkitab (pagi & malam, masing-masing 2 pasal).
 * Logika identik dengan ReadingScheduleSeeder Laravel.
 */
async function seedReadingSchedules() {
  let day = 1;
  let bookIndex = 0;
  let chapter = 1;
  const rows = [];

  while (day <= TOTAL_DAYS) {
    const morning = [];
    const evening = [];

    const take = () => {
      if (bookIndex >= BOOKS.length) {
        bookIndex = 0;
        chapter = 1;
      }
      if (chapter > BOOKS[bookIndex][1]) {
        bookIndex += 1;
        chapter = 1;
        if (bookIndex >= BOOKS.length) bookIndex = 0;
      }
      const ref = `${BOOKS[bookIndex][0]}.${chapter}`;
      chapter += 1;
      return ref;
    };

    for (let i = 0; i < 2; i += 1) morning.push(take());
    for (let i = 0; i < 2; i += 1) evening.push(take());

    rows.push({
      day,
      morning_passage: morning.join('-'),
      evening_passage: evening.join('-'),
    });
    day += 1;
  }

  await prisma.readingSchedule.createMany({ data: rows });
  console.log(`[SEED] reading_schedules: ${rows.length} hari dibuat.`);
}

/**
 * Buat user admin/pengurus untuk testing login.
 */
async function seedAdminUser() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@gbiplc.test';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    console.log(`[SEED] Admin sudah ada: ${email}`);
    return;
  }

  await prisma.user.create({
    data: {
      name: 'Admin GBI',
      email,
      password: await bcrypt.hash(password, 12),
      role: 'pengurus',
    },
  });
  console.log(`[SEED] Admin dibuat: ${email} / ${password}`);
}

/**
 * Buat baris setting SEO (singleton, id=1) bila belum ada.
 * Nilai default diambil dari satu sumber kebenaran
 * (src/modules/settings/seoDefaults.js) — sama dengan yang dipakai
 * auto-create runtime di settings.controller.js.
 * Idempotent: tidak pernah menimpa baris yang sudah di-maintenance admin.
 */
async function seedSeoSettings() {
  const existing = await prisma.tblSeoSetting.findUnique({ where: { id: 1 } });
  if (existing) {
    console.log('[SEED] Setting SEO sudah ada.');
    return;
  }
  await prisma.tblSeoSetting.create({
    data: { ...DEFAULT_SEO, og_image: null },
  });
  console.log('[SEED] Setting SEO dibuat.');
}

async function main() {
  await prisma.readingSchedule.deleteMany();
  await seedReadingSchedules();
  await seedAdminUser();
  await seedSeoSettings();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
