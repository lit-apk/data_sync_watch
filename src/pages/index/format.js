export function currentTime(now) {
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  return `${hours}:${minutes}`
}

export function truncateName(name, max = 8) {
  if (name.length <= max) return name
  return `${name.slice(0, max - 3)}...`
}
