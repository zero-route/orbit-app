import { useEffect, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { fileName } from "../lib/filename";
import type { SaveFile } from "../download/save";
import type { MediaResult } from "../types";

type Options = {
  result: MediaResult | null;
  onSave: (files: SaveFile[]) => void;
  onNotice: (message: string) => void;
};

export function useResultController({ result, onSave, onNotice }: Options) {
  const [qualityId, setQualityId] = useState("");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const key = result?.sourceUrl ?? "";

  useEffect(() => {
    if (!result) {
      return;
    }

    setQualityId(
      result.videos.find((item) => item.id === "720p")?.id ?? result.videos[0]?.id ?? ""
    );
    setPhotoIndex(0);
    setSelected(new Set(result.photos.map((_, index) => index)));
  }, [key]);

  useEffect(() => {
    if (!result || result.photos.length === 0) {
      return;
    }

    setSelected((current) =>
      current.size === 0 && result.photos.length > 0
        ? new Set(result.photos.map((_, index) => index))
        : current
    );
  }, [result?.photos.length]);

  const toggle = (index: number) => {
    setSelected((current) => {
      const next = new Set(current);

      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      return next;
    });
  };

  if (!result) {
    return null;
  }

  const quality =
    result.videos.find((item) => item.id === qualityId) ?? result.videos[0];
  const picked = result.photos.filter((_, index) => selected.has(index));
  const hasClips = result.photos.some((photo) => photo.isVideo);
  const unit = hasClips ? "file" : "foto";

  const primaryLabel =
    result.kind === "photo"
      ? picked.length > 0
        ? `Unduh ${picked.length} ${unit}`
        : `Pilih ${unit}`
      : result.kind === "audio"
        ? "Unduh MP3"
        : "Unduh";

  const primary = () => {
    if (result.kind === "video") {
      if (quality) {
        onSave([
          {
            url: quality.url,
            filename: fileName(
              result,
              quality.ext,
              result.videos.length > 1 ? quality.label : undefined
            ),
          },
        ]);
      }

      return;
    }

    if (result.kind === "audio") {
      if (result.audio) {
        onSave([{ url: result.audio.url, filename: fileName(result, result.audio.ext) }]);
      }

      return;
    }

    onSave(
      result.photos
        .filter((_, index) => selected.has(index))
        .map((photo, position) => ({
          url: photo.url,
          filename: fileName(result, photo.ext, String(position + 1)),
        }))
    );
  };

  const audio = () => {
    if (!result.audio) {
      onNotice("Audio tidak tersedia untuk konten ini.");
      return;
    }

    onSave([{ url: result.audio.url, filename: fileName(result, result.audio.ext) }]);
  };

  const slideshow = () => {
    if (!result.slideshowUrl) {
      onNotice("Slideshow tidak tersedia untuk konten ini.");
      return;
    }

    onSave([{ url: result.slideshowUrl, filename: fileName(result, "mp4", "slideshow") }]);
  };

  const copy = async () => {
    if (!result.caption) {
      return;
    }

    try {
      await Clipboard.setStringAsync(result.caption);
      onNotice("Keterangan disalin.");
    } catch {
      onNotice("Tidak bisa menyalin keterangan.");
    }
  };

  return {
    qualityId: quality?.id ?? "",
    setQualityId,
    photoIndex,
    setPhotoIndex,
    selected,
    toggle,
    videoUrl: quality?.url,
    primaryLabel,
    canPrimary:
      result.kind === "photo" ? picked.length > 0 : true,
    primary,
    audio: result.kind === "video" || (result.kind === "photo" && Boolean(result.audio))
      ? audio
      : undefined,
    slideshow:
      result.kind === "photo" && result.platform === "tiktok"
        ? ((result.audio ? "enabled" : "disabled") as "enabled" | "disabled")
        : ("hidden" as const),
    onSlideshow: slideshow,
    copy: result.caption ? () => void copy() : undefined,
  };
}
