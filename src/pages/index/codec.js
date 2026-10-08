const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
const LOOKUP = new Uint8Array(128)
for (let i = 0; i < BASE64.length; i++) LOOKUP[BASE64.charCodeAt(i)] = i

/**
 * base64 -> bytes. String-based file writes are lossy on the watch (bytes >= 128
 * become U+FFFD), so image chunks must be written as a Uint8Array.
 */
export function base64ToBytes(text) {
  let length = text.length
  while (length > 0 && text.charCodeAt(length - 1) === 61) length-- // strip "=" padding
  const bytes = new Uint8Array((length * 3) >> 2)
  let out = 0
  let i = 0
  for (; i + 4 <= length; i += 4) {
    const n = (LOOKUP[text.charCodeAt(i)] << 18) | (LOOKUP[text.charCodeAt(i + 1)] << 12) |
      (LOOKUP[text.charCodeAt(i + 2)] << 6) | LOOKUP[text.charCodeAt(i + 3)]
    bytes[out++] = n >> 16
    bytes[out++] = (n >> 8) & 255
    bytes[out++] = n & 255
  }
  const rest = length - i
  if (rest >= 2) {
    const n = (LOOKUP[text.charCodeAt(i)] << 18) | (LOOKUP[text.charCodeAt(i + 1)] << 12) |
      (rest === 3 ? LOOKUP[text.charCodeAt(i + 2)] << 6 : 0)
    bytes[out++] = n >> 16
    if (rest === 3) bytes[out++] = (n >> 8) & 255
  }
  return bytes
}

export function decodePayload(data) {
  if (typeof data === "string") return data
  if (data === undefined || data === null) return null

  let bytes = null
  if (typeof ArrayBuffer !== "undefined" && data instanceof ArrayBuffer) {
    bytes = new Uint8Array(data)
  } else if (data.buffer && typeof data.byteLength === "number") {
    bytes = new Uint8Array(data.buffer, data.byteOffset || 0, data.byteLength)
  } else if (Array.isArray(data)) {
    bytes = data
  } else if (typeof data === "object") {
    if (typeof data.type === "string") return JSON.stringify(data)
    const keys = Object.keys(data).filter((key) => /^\d+$/.test(key))
    if (keys.length > 0) {
      keys.sort((a, b) => Number(a) - Number(b))
      bytes = keys.map((key) => data[key])
    }
  }
  if (bytes) return decodeUtf8(bytes)
  return typeof data === "object" ? JSON.stringify(data) : String(data)
}

function decodeUtf8(bytes) {
  let text = ""
  for (let i = 0; i < bytes.length; i++) {
    const first = bytes[i] & 255
    if (first < 128) {
      text += String.fromCharCode(first)
    } else if (first < 224 && i + 1 < bytes.length) {
      text += String.fromCharCode(((first & 31) << 6) | (bytes[++i] & 63))
    } else if (first < 240 && i + 2 < bytes.length) {
      text += String.fromCharCode(((first & 15) << 12) | ((bytes[++i] & 63) << 6) | (bytes[++i] & 63))
    } else if (i + 3 < bytes.length) {
      let code = ((first & 7) << 18) | ((bytes[++i] & 63) << 12) | ((bytes[++i] & 63) << 6) | (bytes[++i] & 63)
      code -= 65536
      text += String.fromCharCode(55296 + (code >> 10), 56320 + (code & 1023))
    }
  }
  return text
}
