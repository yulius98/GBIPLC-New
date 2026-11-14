import api from '../api/client'

/**
 * Upload file besar secara bertahap (protokol Resumable.js) ke /api/chunk-upload.
 *
 * Setiap request hanya membawa satu potongan kecil, sehingga tidak terkena batas
 * ukuran body request (Cloudflare ±100MB, nginx 60MB). Chunk dikirim berurutan,
 * dan chunk yang sudah ada di server dilewati, jadi upload yang terputus bisa
 * dilanjutkan dengan memilih file yang sama lagi.
 */

export const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_RETRIES = 3

// Hanya karakter yang lolos sanitasi di backend ([a-zA-Z0-9_-]).
// Berbasis ukuran + waktu modifikasi + nama, supaya file yang sama bisa di-resume.
function makeIdentifier(file) {
  const base = String(file.name || 'file')
    .replace(/\.[^.]+$/, '')
    .replace(/[^A-Za-z0-9_-]/g, '_')
    .slice(0, 60)
  return `${file.size}-${file.lastModified}-${base}`
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function chunkExists(identifier, chunkNumber) {
  try {
    const res = await api.get('/chunk-upload', {
      params: { resumableIdentifier: identifier, resumableChunkNumber: chunkNumber },
    })
    return res.status === 200 // 204 = belum ada
  } catch {
    return false // gagal cek -> kirim saja ulang chunk-nya
  }
}

function isRetryable(err) {
  const status = err.response?.status
  // Tanpa respons (jaringan putus/timeout), 5xx, atau 429 layak dicoba lagi.
  return !status || status >= 500 || status === 429
}

async function postChunk(body) {
  let lastError
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      const { data } = await api.post('/chunk-upload', body)
      return data
    } catch (err) {
      lastError = err
      if (!isRetryable(err)) break
      await sleep(1000 * 2 ** attempt)
    }
  }
  throw lastError
}

/**
 * @param {File} file
 * @param {{ onProgress?: (fraction: number) => void }} [options] fraction 0..1
 * @returns {Promise<{ filename: string, original_name: string }>}
 *   filename = path relatif hasil upload (mis. "materi-kotbah/<random>.pdf")
 */
export async function uploadFileInChunks(file, { onProgress } = {}) {
  if (!file || file.size === 0) {
    throw new Error('File kosong atau tidak valid.')
  }

  const identifier = makeIdentifier(file)
  const total = Math.ceil(file.size / CHUNK_SIZE)
  let sentBytes = 0
  let result = null

  onProgress?.(0)

  for (let number = 1; number <= total; number += 1) {
    const start = (number - 1) * CHUNK_SIZE
    const blob = file.slice(start, Math.min(start + CHUNK_SIZE, file.size))
    const isLast = number === total

    // Resume: lewati chunk yang sudah ada di server. Chunk terakhir selalu
    // dikirim, karena respons dari chunk terakhirlah yang memicu penggabungan.
    if (!isLast && (await chunkExists(identifier, number))) {
      sentBytes += blob.size
      onProgress?.(sentBytes / file.size)
      continue
    }

    const body = new FormData()
    // Field teks harus sebelum field file.
    body.append('resumableChunkNumber', number)
    body.append('resumableChunkSize', CHUNK_SIZE)
    body.append('resumableCurrentChunkSize', blob.size)
    body.append('resumableTotalSize', file.size)
    body.append('resumableType', file.type || '')
    body.append('resumableIdentifier', identifier)
    body.append('resumableFilename', file.name)
    body.append('resumableRelativePath', file.name)
    body.append('resumableTotalChunks', total)
    body.append('file', blob, file.name)

    result = await postChunk(body)
    sentBytes += blob.size
    onProgress?.(sentBytes / file.size)
  }

  if (result?.status !== 'success' || !result.filename) {
    // Biarkan chunk di server (bisa di-resume); beri tahu pengguna.
    throw new Error('Upload belum selesai. Coba simpan lagi untuk melanjutkan.')
  }
  return { filename: result.filename, original_name: result.original_name }
}
