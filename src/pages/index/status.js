export function isApkConnected(status) {
  const value = String(status).toUpperCase()
  return value === "CONNECTED" || status === 0 || status === 1
}

export function describeApkStatus(status) {
  if (status == null) return "未知"
  const value = String(status).toUpperCase()
  if (value === "CONNECTED" || status === 0 || status === 1) return "已连接"
  if (value === "CONNECTING") return "连接中"
  if (value === "DISCONNECTED" || status === 2) return "未连接"
  if (value === "UNINSTALLED" || status === 1001) return "未连接(APP未安装)"
  if (status === 204) return "未连接(超时)"
  if (status === 1000) return "未连接(其他)"
  return `状态${status}`
}

export function describeDiagnosis(status) {
  if (status === 0) return "已连接"
  if (status === 204) return "连接超时"
  if (status === 1001) return "手机APP未安装"
  if (status === 1000) return "其他错误"
  return "未知"
}

export function describeCode(code) {
  if (code === 1000) return "未知错误"
  if (code === 1001) return "手机APP未安装"
  if (code === 1006) return "连接断开"
  if (code === 204) return "连接超时"
  if (code === 202) return "参数错误"
  return "未知"
}
