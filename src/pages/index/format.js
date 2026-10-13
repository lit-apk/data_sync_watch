export function currentTime(now) {
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  return `${hours}:${minutes}`
}

export function truncateName(name, max = 8) {
  if (name.length <= max) return name
  return name.slice(0, max) + "..."
}

export function toDisplayName(name, max = 8) {
  const idx = name.lastIndexOf('.');
  const res = (idx > 0) ?  // if idx == 0 (name is '.xxx', we use `name` AS-IS
		name.slice(0, idx) : name;
  return truncateName(res, max);
}

