export function getCookie(name: string): string | null {
  const needle = `${encodeURIComponent(name)}=`;
  const parts = document.cookie ? document.cookie.split(";") : [];
  for (const raw of parts) {
    const s = raw.trim();
    if (s.startsWith(needle)) return decodeURIComponent(s.slice(needle.length));
  }
  return null;
}

export function setCookie(name: string, value: string, opts?: { days?: number; path?: string; sameSite?: "Lax" | "Strict"; secure?: boolean }) {
  const days = opts?.days ?? 365;
  const path = opts?.path ?? "/";
  const sameSite = opts?.sameSite ?? "Lax";
  const secure = opts?.secure ?? true;

  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Expires=${expires}; Path=${path}; SameSite=${sameSite}`;
  if (secure && location.protocol === "https:") cookie += "; Secure";
  document.cookie = cookie;
}

export function deleteCookie(name: string, path = "/") {
  document.cookie = `${encodeURIComponent(name)}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=${path}; SameSite=Lax`;
}

