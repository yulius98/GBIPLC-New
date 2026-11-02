/**
 * Helper untuk opsi "Hybrid Public ID":
 * kolom id (Int autoincrement) tetap PK internal, sementara public_id (UUID v7)
 * dipakai sebagai identifier di level API sehingga URL tidak menyebarkan
 * sekuens jumlah baris (enumeration).
 *
 * Fase transisi: endpoint menerima KEDUanya.
 * - Param UUID          -> dicari via kolom public_id
 * - Param angka         -> dicari via kolom id (kompatibel klien lama)
 * - Param lain          -> null (handler melempar 404/422)
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const INT_RE = /^\d{1,15}$/;

/**
 * Ubah parameter :id mentah menjadi where-clause Prisma untuk kolom selector,
 * atau null bila formatnya tidak valid sebagai UUID maupun Int.
 *
 * @param {string} raw - nilai mentah req.params.id
 * @param {string} [intKey='id'] - nama kolom PK internal
 * @returns {object|null} mis. { public_id } / { id: 12 } / null
 */
export function resolveRowId(raw, intKey = 'id') {
  const value = String(raw ?? '').trim();

  if (UUID_RE.test(value)) return { public_id: value.toLowerCase() };
  if (INT_RE.test(value)) return { [intKey]: Number(value) };
  return null;
}

export default resolveRowId;
