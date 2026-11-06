const MAX_SIDE = 900
const MAX_FILE_BYTES = 15 * 1024 * 1024

// Reads a picture, shrinks it (longest side 900px) and returns a small JPEG data URL,
// so it fits in the browser's storage.
export async function fileToResizedDataUrl(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Choose an image file (JPG, PNG or WebP).')
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('That picture is too large. Choose one under 15 MB.')
  }

  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Could not read that picture. Try another file.'))
      el.src = url
    })

    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)

    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff' // transparent PNGs get a white background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    return canvas.toDataURL('image/jpeg', 0.82)
  } finally {
    URL.revokeObjectURL(url)
  }
}
