export function backendBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!base?.length) {
    return "http://localhost:8787";
  }
  return base.replace(/\/+$/, "");
}
