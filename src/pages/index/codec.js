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
