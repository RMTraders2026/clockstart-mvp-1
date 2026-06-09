export function qrImageUrl(value: string) {
  const url = new URL("https://api.qrserver.com/v1/create-qr-code/");
  url.searchParams.set("size", "220x220");
  url.searchParams.set("data", value);
  return url.toString();
}

export function absoluteAppUrl(path: string) {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}
