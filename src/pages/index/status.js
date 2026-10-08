export function isApkConnected(status) {
  const value = String(status).toUpperCase()
  return value === "CONNECTED" || status === 0 || status === 1
}

export function describeApkStatus(status, t) {
  if (status == null) return t("status.unknown")
  const value = String(status).toUpperCase()
  if (value === "CONNECTED" || status === 0 || status === 1) return t("status.connected")
  if (value === "CONNECTING") return t("status.connecting")
  if (value === "DISCONNECTED" || status === 2) return t("status.disconnected")
  if (value === "UNINSTALLED" || status === 1001) return t("status.appNotInstalled")
  if (status === 204) return t("status.timedOut")
  if (status === 1000) return t("status.other")
  return t("status.code", { status: status })
}

export function describeDiagnosis(status, t) {
  if (status === 0) return t("status.connected")
  if (status === 204) return t("error.connectionTimedOut")
  if (status === 1001) return t("error.phoneAppNotInstalled")
  if (status === 1000) return t("error.other")
  return t("status.unknown")
}

export function describeCode(code, t) {
  if (code === 1000) return t("error.unknown")
  if (code === 1001) return t("error.phoneAppNotInstalled")
  if (code === 1006) return t("status.closed")
  if (code === 204) return t("error.connectionTimedOut")
  if (code === 202) return t("error.invalidParameters")
  return t("status.unknown")
}
