function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Gagal memuat gambar.'))
    img.src = url
  })
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

export async function toWebp(file, maxKB = 250) {
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImage(objectUrl)
    const maxBytes = maxKB * 1024
    const MAX_DIM = 1600
    let width = img.naturalWidth
    let height = img.naturalHeight

    if (!width || !height) throw new Error('Dimensi gambar tidak valid.')

    const scale = Math.min(1, MAX_DIM / Math.max(width, height))
    width = Math.max(1, Math.round(width * scale))
    height = Math.max(1, Math.round(height * scale))

    let quality = 0.85
    let blob = null

    for (let attempt = 0; attempt < 20 && !(blob && blob.size <= maxBytes); attempt++) {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      blob = await canvasToBlob(canvas, 'image/webp', quality)

      if (blob.size <= maxBytes) break
      if (quality > 0.5) {
        quality -= 0.1
      } else {
        width = Math.max(1, Math.round(width * 0.8))
        height = Math.max(1, Math.round(height * 0.8))
        quality = 0.6
      }
    }

    return blob
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
