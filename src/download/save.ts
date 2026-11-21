import { File, FileMode, Paths } from "expo-file-system";
import { Album, Asset, requestPermissionsAsync } from "expo-media-library";
import { PermissionsAndroid, Platform } from "react-native";
import { media } from "react-native-blob-util";

import { authHeaders } from "../api/device";
import { absolute, ALBUM_NAME } from "../config";
import { isHttps } from "../lib/url";

export type SaveFile = {
  url: string;
  filename: string;
};

export type SaveResult =
  | { ok: true }
  | { ok: false; expired?: boolean; message: string };

const LINK_PREFIX = "/api/ytlink";

function isProxy(url: string) {
  return url.startsWith("/api/");
}

async function resolveTarget(file: SaveFile) {
  if (!isProxy(file.url)) {
    if (!isHttps(file.url)) {
      throw new Error("Alamat unduhan tidak aman.");
    }

    return {
      url: file.url,
      headers: {} as Record<string, string>,
      warm: false,
    };
  }

  const headers = await authHeaders();

  if (!file.url.startsWith(LINK_PREFIX)) {
    return {
      url: absolute(file.url),
      headers,
      warm: false,
    };
  }

  const response = await fetch(absolute(file.url), { headers });

  if (response.status === 410 || response.status === 403) {
    throw Object.assign(new Error("expired"), { expired: true });
  }

  const body = (await response.json()) as {
    ok?: boolean;
    url?: string;
    error?: string;
  };

  if (!response.ok || !body.url) {
    throw new Error(body.error ?? "Link unduhan tidak tersedia.");
  }

  if (!isHttps(body.url)) {
    throw new Error("Alamat unduhan tidak aman.");
  }

  return {
    url: body.url,
    headers: {} as Record<string, string>,
    warm: true,
  };
}

const SLOW_ROUTES = ["/api/ytmp3", "/api/mp3", "/api/slideshow"];

function isSlow(url: string) {
  return SLOW_ROUTES.some((prefix) => url.startsWith(prefix));
}

async function warmUp(url: string) {
  const controller = new AbortController();

  try {
    await fetch(url, {
      headers: { Range: "bytes=0-0" },
      signal: controller.signal,
    });
  } catch {
    return;
  } finally {
    controller.abort();
  }
}

async function downloadWithRetry(
  url: string,
  destination: File,
  headers: Record<string, string>
) {
  try {
    return await File.downloadFileAsync(url, destination, { headers });
  } catch (error) {
    if (!(error instanceof Error) || !/timeout/i.test(error.message)) {
      throw error;
    }

    if (destination.exists) {
      destination.delete();
    }

    return File.downloadFileAsync(url, destination, { headers });
  }
}

async function fetchToFile(
  url: string,
  headers: Record<string, string>,
  destination: File
) {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    if (response.status === 410 || response.status === 403) {
      throw Object.assign(new Error("expired"), { expired: true });
    }

    let message = `Server membalas HTTP ${response.status}.`;

    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
    }

    throw new Error(message);
  }

  const buffer = await response.arrayBuffer();

  if (!destination.exists) {
    destination.create();
  }

  await destination.write(new Uint8Array(buffer));

  return destination;
}

function albumFor(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  if (["mp3", "m4a", "aac", "wav", "ogg", "opus", "flac"].includes(ext)) {
    return `${ALBUM_NAME} Audio`;
  }

  if (["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"].includes(ext)) {
    return `${ALBUM_NAME} Foto`;
  }

  return `${ALBUM_NAME} Video`;
}

function mimeTypeFor(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  const types: Record<string, string> = {
    mp4: "video/mp4",
    m4v: "video/x-m4v",
    mov: "video/quicktime",
    webm: "video/webm",
    mkv: "video/x-matroska",
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    aac: "audio/aac",
    wav: "audio/wav",
    ogg: "audio/ogg",
    opus: "audio/ogg",
    flac: "audio/flac",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    heic: "image/heic",
    heif: "image/heif",
  };

  return types[ext] ?? "application/octet-stream";
}

async function ensureLegacyPermission() {
  if (Platform.OS !== "android" || Number(Platform.Version) >= 29) {
    return;
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
  );

  if (result !== PermissionsAndroid.RESULTS.GRANTED) {
    throw new Error("Izin penyimpanan ditolak. Aktifkan di pengaturan aplikasi.");
  }
}

async function saveToDownloads(file: File, filename: string) {
  await ensureLegacyPermission();

  const path = file.uri.replace(/^file:\/\//, "");

  await media.copyToMediaStore(
    { name: filename, parentFolder: "", mime: mimeTypeFor(filename) },
    "Download",
    path
  );
}

async function toGallery(uri: string, albumName: string) {
  if (Platform.OS === "android") {
    throw new Error(
      "Android tidak boleh menggunakan Album.create(). Gunakan saveToDownloads()."
    );
  }

  const permission = await requestPermissionsAsync(true);

  if (!permission.granted) {
    throw new Error("Izin galeri ditolak.");
  }

  const album = await Album.get(albumName);

  if (album) {
    await Asset.create(uri, album);
  } else {
    await Album.create(albumName, [uri], false);
  }
}

type Sniffed = { ext?: string; text?: string };

function sniff(bytes: Uint8Array): Sniffed {
  const at = (index: number) => bytes[index] ?? 0;

  const ascii = (from: number, to: number) =>
    String.fromCharCode(...Array.from(bytes.slice(from, to)));

  if (ascii(4, 8) === "ftyp") {
    const brand = ascii(8, 12);

    if (/^(heic|heix|hevc|hevx|mif1|msf1)/.test(brand)) {
      return { ext: "heic" };
    }

    return { ext: brand.startsWith("M4A") ? "m4a" : "mp4" };
  }

  if (at(0) === 0xff && at(1) === 0xd8) return { ext: "jpg" };
  if (at(0) === 0x89 && ascii(1, 4) === "PNG") return { ext: "png" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    return { ext: "webp" };
  }
  if (ascii(0, 3) === "GIF") return { ext: "gif" };

  if (
    ascii(0, 3) === "ID3" ||
    (at(0) === 0xff && (at(1) & 0xe0) === 0xe0)
  ) {
    return { ext: "mp3" };
  }

  const head = ascii(0, Math.min(bytes.length, 200)).trimStart();

  if (head.startsWith("{") || head.startsWith("<")) {
    return { text: head };
  }

  return {};
}

function readHead(file: File): Uint8Array | null {
  try {
    const handle = file.open(FileMode.ReadOnly);

    try {
      return handle.readBytesSync(256);
    } finally {
      handle.close();
    }
  } catch {
    return null;
  }
}

function withExt(filename: string, ext: string) {
  const dot = filename.lastIndexOf(".");

  return `${dot > 0 ? filename.slice(0, dot) : filename}.${ext}`;
}

function sameFamily(a: string, b: string) {
  const group = (ext: string) =>
    ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"].includes(ext)
      ? "image"
      : ["mp3", "m4a", "aac", "wav", "ogg", "opus", "flac"].includes(ext)
        ? "audio"
        : "video";

  return group(a) === group(b);
}

function stagedExt(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  return /^[a-z0-9]{1,5}$/.test(ext) ? ext : "bin";
}

function discard(file: File | null) {
  try {
    if (file && file.exists) {
      file.delete();
    }
  } catch {
    return;
  }
}

export async function saveOne(file: SaveFile): Promise<SaveResult> {
  const stamp = `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
  const staged: File[] = [];

  try {
    const target = await resolveTarget(file);
    const destination = new File(Paths.cache, `${stamp}.${stagedExt(file.filename)}`);
    staged.push(destination);

    discard(destination);

    if (target.warm) {
      await warmUp(target.url);
    }

    const downloaded = isSlow(file.url)
      ? await fetchToFile(target.url, target.headers, destination)
      : await downloadWithRetry(target.url, destination, target.headers);

    let current = downloaded;
    let finalName = file.filename;
    const head = readHead(downloaded);

    if (head) {
      const found = sniff(head);

      if (found.text !== undefined) {
        const size = downloaded.size;

        if (size < 2048 || /expired|kedaluwarsa/i.test(found.text)) {
          return {
            ok: false,
            expired: true,
            message: "Link kedaluwarsa, ambil ulang.",
          };
        }

        return {
          ok: false,
          message: "Server mengirim galat, bukan file media. Coba lagi.",
        };
      }

      const extension = file.filename.split(".").pop()?.toLowerCase() ?? "";

      if (found.ext && found.ext !== extension && sameFamily(found.ext, extension)) {
        const renamedName = withExt(file.filename, found.ext);
        const renamed = new File(Paths.cache, `${stamp}.${found.ext}`);
        staged.push(renamed);

        try {
          discard(renamed);
          downloaded.moveSync(renamed);
          current = renamed;
          finalName = renamedName;
        } catch {
          current = downloaded;
          finalName = file.filename;
        }
      } else if (found.ext && !sameFamily(found.ext, extension)) {
        return {
          ok: false,
          message: "Format file dari server tidak sesuai. Coba lagi.",
        };
      }
    } else if (downloaded.size < 2048) {
      const text = downloaded.textSync().trimStart();

      if (text.startsWith("{") || text.startsWith("<")) {
        return {
          ok: false,
          expired: true,
          message: "Link kedaluwarsa, ambil ulang.",
        };
      }
    }

    if (Platform.OS === "android") {
      await saveToDownloads(current, finalName);
    } else {
      await toGallery(current.uri, albumFor(finalName));
    }

    return { ok: true };
  } catch (error) {
    if (error && typeof error === "object" && "expired" in error) {
      return {
        ok: false,
        expired: true,
        message: "Link kedaluwarsa, ambil ulang.",
      };
    }

    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal mengunduh.",
    };
  } finally {
    for (const item of staged) {
      discard(item);
    }
  }
}
