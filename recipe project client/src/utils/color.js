export const DEFAULT_COLOR = '#f5cb5c'

const INK = '#17263b'
const INK_LUMINANCE = 0.019

// Accepts "#f5cb5c", "f5cb5c", "#fc5" and returns "#rrggbb", or null if invalid.
export function normalizeHex(input) {
  let value = String(input ?? '').trim().toLowerCase()
  if (!value.startsWith('#')) value = '#' + value
  if (/^#[0-9a-f]{3}$/.test(value)) {
    value = '#' + value[1] + value[1] + value[2] + value[2] + value[3] + value[3]
  }
  return /^#[0-9a-f]{6}$/.test(value) ? value : null
}

function luminance(hex) {
  const channels = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

// Picks dark or white text, whichever is easier to read on the given colour.
export function readableText(hex) {
  const valid = normalizeHex(hex) ?? DEFAULT_COLOR
  const l = luminance(valid)
  const withInk = (l + 0.05) / (INK_LUMINANCE + 0.05)
  const withWhite = 1.05 / (l + 0.05)
  return withInk >= withWhite ? INK : '#ffffff'
}
