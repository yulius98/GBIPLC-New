#!/usr/bin/env node
/**
 * Import data dari dump MySQL phpMyAdmin (philadel_db_gbiplc.sql) ke PostgreSQL
 * melalui Prisma, mempertahankan ID asli (agar relasi antar tabel tetap valid).
 *
 * Cara pakai:
 *   node prisma/import-mysql-dump.js                    # dry-run (laporan jumlah baris)
 *   node prisma/import-mysql-dump.js --apply            # benar-benar menulis ke database
 *   node prisma/import-mysql-dump.js path/to/dump.sql --apply
 *
 * Catatan:
 * - Hanya tabel yang ada di schema Prisma yang diimport.
 *   Tabel internal Laravel (cache, jobs, sessions, migrations, dll) dilewati.
 * - Dengan --apply, data lama pada tabel yang diimport akan DIHAPUS dulu
 *   (dump dianggap sumber data resmi untuk migrasi), lalu disisipkan ulang,
 *   dan sequence id disinkronkan.
 * - Hash password bcrypt Laravel ($2y$) kompatibel dengan bcryptjs yang
 *   dipakai backend, sehingga jemaat asli tetap bisa login.
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
const APPLY = process.argv.includes('--apply');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

function camelCase(name) {
  return name[0].toLowerCase() + name.slice(1);
}

/**
 * Baca satu nilai literal MySQL mulai dari posisi i dalam str.
 * Mengembalikan { value, next } di mana next = indeks setelah nilai.
 */
function readValue(str, i) {
  const n = str.length;
  while (i < n && /[\s,]/.test(str[i])) i += 1;
  if (i >= n) return { value: undefined, next: i };

  let c = str[i];
  // Awalan collation seperti _utf8mb4'...'
  if (c === '_') {
    while (i < n && /[A-Za-z0-9]/.test(str[i])) i += 1;
    c = str[i];
  }

  if (c === "'" || c === '"') {
    const quote = c;
    i += 1;
    let out = '';
    while (i < n) {
      const ch = str[i];
      if (ch === '\\') {
        const nx = str[i + 1];
        const map = { 0: '\0', n: '\n', r: '\r', b: '\b', t: '\t', Z: '\x1a', '"': '"', "'": "'", '\\': '\\' };
        out += nx in map ? map[nx] : nx === undefined ? '\\' : nx;
        i += 2;
      } else if (ch === quote) {
        if (str[i + 1] === quote) {
          out += quote;
          i += 2;
        } else {
          i += 1;
          break;
        }
      } else {
        out += ch;
        i += 1;
      }
    }
    return { value: out, next: i };
  }

  // Token tak ber-quote (angka, NULL, dst) hingga koma/tutup kurung.
  let token = '';
  while (i < n && str[i] !== ',' && str[i] !== ')') {
    token += str[i];
    i += 1;
  }
  const t = token.trim();
  if (/^null$/i.test(t)) return { value: null, next: i };
  if (/^true$/i.test(t)) return { value: 'true', next: i };
  if (/^false$/i.test(t)) return { value: 'false', next: i };
  return { value: t, next: i };
}

/** Parse isi satu baris "(v1, v2, ...)" menjadi array nilai. */
function parseRow(str) {
  const values = [];
  let i = 0;
  while (i < str.length) {
    const { value, next } = readValue(str, i);
    if (next <= i) break;
    if (value !== undefined) values.push(value);
    i = next;
  }
  return values;
}

/** Ekstrak daftar baris dari teks setelah VALUES (bisa banyak baris, diakhiri ';'). */
function extractRows(valuesText) {
  const rows = [];
  let depth = 0;
  let start = -1;
  let i = 0;
  const n = valuesText.length;
  while (i < n) {
    const ch = valuesText[i];
    if (ch === "'" || ch === '"') {
      const quote = ch;
      i += 1;
      while (i < n) {
        if (valuesText[i] === '\\') i += 2;
        else if (valuesText[i] === quote) {
          if (valuesText[i + 1] === quote) i += 2;
          else { i += 1; break; }
        } else i += 1;
      }
      continue;
    }
    if (ch === '(') {
      depth += 1;
      if (depth === 1) start = i + 1;
    } else if (ch === ')') {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        rows.push(parseRow(valuesText.slice(start, i)));
        start = -1;
      }
    }
    i += 1;
  }
  return rows;
}

/** Ekstrak seluruh pernyataan INSERT dari dump. */
function extractInserts(sql) {
  const inserts = [];
  const re = /INSERT\s+INTO\s+`([^`]+)`\s*(?:\(([^)]*)\))?\s*VALUES\s*/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const table = m[1];
    const columns = m[2]
      ? m[2].split(',').map((c) => c.trim().replace(/^`|`$/g, ''))
      : null;
    const start = re.lastIndex;
    let depth = 0;
    let i = start;
    let end = start;
    let inStr = null;
    while (i < sql.length) {
      const ch = sql[i];
      if (inStr) {
        if (ch === '\\') i += 2;
        else if (ch === inStr) {
          if (sql[i + 1] === inStr) i += 2;
          else { inStr = null; i += 1; }
        } else i += 1;
        continue;
      }
      if (ch === "'" || ch === '"') inStr = ch;
      else if (ch === '(') depth += 1;
      else if (ch === ')') depth -= 1;
      else if (ch === ';' && depth === 0) { end = i; break; }
      i += 1;
    }
    const valuesText = sql.slice(start, end);
    const rows = columns ? extractRows(valuesText) : [];
    inserts.push({ table, columns, rows });
  }
  return inserts;
}

/** Konversi nilai MySQL menjadi tipe Prisma berdasarkan definisi field. */
function convertValue(field, raw) {
  if (raw === null) {
    // Kolom non-nullable yang NULL: lewati agar default dipakai.
    return field.isNullable ? null : undefined;
  }
  if (field.kind === 'enum') return raw;
  switch (field.type) {
    case 'Boolean':
      return raw === '1' || raw === 'true' ? true : raw === '0' || raw === 'false' ? false : Boolean(raw);
    case 'Int':
      return raw === '' ? null : Number.parseInt(raw, 10);
    case 'Float':
      return raw === '' ? null : parseFloat(raw);
    case 'DateTime': {
      if (raw === '0000-00-00 00:00:00' || raw === '0000-00-00') return null;
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    default:
      return raw;
  }
}

// Urutan delete yang aman terhadap foreign key (anak sebelum induk).
const FK_SAFE_ORDER = [
  'tbl_kunjungans',
  'users',
  'tbl_carousels',
  'tbl_events',
  'tbl_ibadah_rayas',
  'tbl_komsels',
  'tbl_materi_komsels',
  'tbl_materi_kotbahs',
  'tbl_pastor_notes',
  'tbl_popup_ads',
  'tbl_toko_jemaats',
  'tbl_youth_galleries',
  'tbl_youth_programs',
  'tbl_youth_schedules',
  'reading_schedules',
  'password_reset_tokens',
];

async function main() {
  const dumpPath =
    process.argv.slice(2).find((a) => !a.startsWith('--')) ||
    path.join(import.meta.dirname, '../../philadel_db_gbiplc.sql');

  if (!fs.existsSync(dumpPath)) {
    console.error(`[ERROR] File dump tidak ditemukan: ${dumpPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(dumpPath, 'utf8');
  const inserts = extractInserts(sql);
  const models = Prisma.dmmf.datamodel.models;

  const modelByTable = {};
  for (const model of models) modelByTable[model.dbName] = model;

  const prisma = new PrismaClient({ adapter });

  // Gabungkan seluruh statement INSERT per tabel (dump bisa memecah 1 tabel
  // menjadi banyak INSERT), lalu import 1x per tabel.
  const perTable = {};
  for (const ins of inserts) {
    if (!modelByTable[ins.table] || !ins.columns) {
      if (!perTable[ins.table]) console.log(`[SKIP] tabel ${ins.table} (tidak ada di schema Prisma)`);
      continue;
    }
    if (!perTable[ins.table]) {
      perTable[ins.table] = { model: modelByTable[ins.table], columns: ins.columns, rows: [] };
    }
    perTable[ins.table].rows.push(...ins.rows);
  }

  let planned = 0;

  for (const table of FK_SAFE_ORDER.filter((t) => perTable[t]).concat(Object.keys(perTable).filter((t) => !FK_SAFE_ORDER.includes(t)))) {
    const { model, columns, rows: rawRows } = perTable[table];

    const accessor = prisma[camelCase(model.name)];
    if (!accessor) {
      console.log(`[SKIP] model ${model.name} tidak tersedia di Prisma Client`);
      continue;
    }

    const fieldMap = {};
    for (const f of model.fields) {
      if (f.kind === 'scalar' || f.kind === 'enum') fieldMap[f.dbName || f.name] = f;
    }

    const rows = [];
    for (const rawRow of rawRows) {
      const data = {};
      columns.forEach((col, idx) => {
        const field = fieldMap[col];
        if (!field) return;
        const v = convertValue(field, rawRow[idx]);
        if (v !== undefined) data[field.name] = v;
      });
      rows.push(data);
    }

    if (rows.length === 0) {
      console.log(`[SKIP] ${table}: 0 baris`);
      continue;
    }

    planned += rows.length;
    console.log(`[${APPLY ? 'IMPORT' : 'DRY-RUN'}] ${table} -> ${model.name}: ${rows.length} baris`);

    if (!APPLY) continue;

    await accessor.deleteMany({});
    await accessor.createMany({ data: rows, skipDuplicates: false });

    // Sinkronkan sequence id agar id baru tidak bentrok (khusus PK bertipe id).
    const idField = model.fields.find((f) => f.isId && f.kind === 'scalar' && (f.dbName || f.name) === 'id');
    if (idField) {
      try {
        await prisma.$executeRawUnsafe(
          `SELECT setval(pg_get_serial_sequence('${table}', 'id'), (SELECT COALESCE(MAX(id), 1) FROM "${table}"))`
        );
      } catch (e) {
        console.warn(`  [WARN] sinkronisasi sequence ${table} dilewati: ${e.meta?.message || e.message}`);
      }
    }
    console.log(`  -> ${rows.length} baris disisipkan ke ${table}`);
  }

  await prisma.$disconnect();

  if (!APPLY) {
    console.log(`\nTotal ${planned} baris siap diimport. Jalankan ulang dengan --apply untuk menulis ke database.`);
  } else {
    console.log('\nImport selesai.');
  }
}

main().catch((err) => {
  console.error('[ERROR] Import gagal:', err);
  process.exit(1);
});
