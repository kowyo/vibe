export const toAbsolutePreviewUrl = async (
  raw: string,
  backendOrigin: string
): Promise<string> => {
  if (!raw) {
    return ""
  }
  try {
    let url: URL
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      url = new URL(raw)
    } else {
      if (!backendOrigin) {
        return raw
      }
      url = new URL(raw, backendOrigin)
    }

    return url.toString()
  } catch {
    return raw
  }
}

export const refreshPreviewUrl = (previewUrl: string): string => {
  if (!previewUrl) {
    return previewUrl
  }
  try {
    const url = new URL(previewUrl)
    url.searchParams.set("t", Date.now().toString())
    return url.toString()
  } catch {
    return `${previewUrl}?t=${Date.now()}`
  }
}
