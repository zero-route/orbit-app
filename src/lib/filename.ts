import type { MediaResult } from "../types";

const LEGACY_PLATFORMS = new Set(["spotify", "youtube"]);

function clean(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[_.]+|[_.]+$/g, "")
    .slice(0, 60);
}

export function baseName(result: MediaResult) {
  const owner = result.author?.username ? clean(result.author.username) : "";
  const id = result.postId ? clean(result.postId) : "";

  if (LEGACY_PLATFORMS.has(result.platform)) {
    const parts = [result.platform, owner, id].filter(Boolean);

    return parts.length > 1 ? parts.join("_") : `${result.platform}_media`;
  }

  const unique = id || String(Date.now()).slice(-8);

  return ["Orbit", owner || result.platform, unique].join("_");
}

function titleName(value: string) {
  return value
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[.\s]+|[.\s]+$/g, "")
    .slice(0, 150);
}

export function fileName(result: MediaResult, ext: string, suffix?: string) {
  const titled = result.platform === "spotify" || result.platform === "youtube";

  if (titled && result.audio?.title) {
    const title = titleName(result.audio.title);

    if (title) {
      const quality = suffix && ext !== "mp3" ? ` (${titleName(suffix)})` : "";

      return `${title}${quality}.${ext}`;
    }
  }

  const base = baseName(result);
  const tail = suffix ? clean(suffix) : "";

  return `${base}${tail ? `_${tail}` : ""}.${ext}`;
}
