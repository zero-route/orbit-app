import { isHttps } from "./url";

export type DirectSource = {
  url: string;
  headers: Record<string, string>;
};

const QUERY_U = /[?&]u=([^&]+)/;

const AGENT =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";

function referrerFor(url: string) {
  const host = /^https:\/\/([^/?#:]+)/i.exec(url)?.[1]?.toLowerCase() ?? "";

  if (host.endsWith("twimg.com")) {
    return "https://x.com/";
  }

  if (host.endsWith("pinimg.com")) {
    return "https://www.pinterest.com/";
  }

  if (/(cdninstagram\.com|fbcdn\.net|instagram\.com)$/.test(host)) {
    return "https://www.instagram.com/";
  }

  return "https://www.tiktok.com/";
}

export function directSource(path: string): DirectSource | null {
  if (!path.startsWith("/api/download")) {
    return null;
  }

  const match = QUERY_U.exec(path);

  if (!match) {
    return null;
  }

  let url: string;

  try {
    url = decodeURIComponent(match[1]);
  } catch {
    return null;
  }

  if (!isHttps(url)) {
    return null;
  }

  return {
    url,
    headers: { Referer: referrerFor(url), "User-Agent": AGENT },
  };
}
