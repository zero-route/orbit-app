import { useEffect, useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { WebView } from "react-native-webview";
import { directSource } from "../lib/direct";
import { isTrustedEmbed } from "../lib/url";
import { absolute, API_URL } from "../config";
import { formatDuration } from "../lib/text";
import { colors, radius } from "../theme";
import type { MediaResult } from "../types";
import AudioPreview from "./AudioPreview";
import Icon from "./Icon";
import RemoteImage from "./RemoteImage";
import VideoPreview from "./VideoPreview";

type Props = {
  result: MediaResult;
  videoUrl?: string;
  photoIndex: number;
  selected: Set<number>;
  onPhotoIndex: (index: number) => void;
  onToggle: (index: number) => void;
  onNotice: (message: string) => void;
};

function useRatio(uri: string | undefined, fallback: number) {
  const [ratio, setRatio] = useState(fallback);

  useEffect(() => {
    if (!uri) {
      return;
    }

    let live = true;

    Image.getSize(
      uri,
      (width, height) => {
        if (live && width > 0 && height > 0) {
          setRatio(width / height);
        }
      },
      () => undefined
    );

    return () => {
      live = false;
    };
  }, [uri]);

  return ratio;
}

type StageProps = Props & { boxWidth: number; maxHeight: number };

function audioSource(result: MediaResult) {
  const path = result.audio?.previewUrl ?? result.audio?.url;

  return path ? absolute(path) : undefined;
}

function PhotoStage({ result, photoIndex, selected, onPhotoIndex, onToggle, boxWidth, maxHeight }: StageProps) {
  const total = result.photos.length;
  const music = audioSource(result);
  const current = result.photos[photoIndex];
  const shown = current?.isVideo ? current.thumbnailUrl : (current?.previewUrl ?? current?.url);
  const [ratio, setRatio] = useState(1);
  const height = Math.min(boxWidth / ratio, maxHeight);

  const step = (delta: number) => onPhotoIndex((photoIndex + delta + total) % total);

  return (
    <View style={styles.gap}>
      <View style={[styles.box, { width: boxWidth, height }]}>
        <RemoteImage
          key={shown}
          uri={shown}
          style={styles.fill}
          resizeMode="contain"
          onSize={(width, height) => setRatio(width / height)}
          showError
        />
        {total > 1 ? (
          <>
            <Text style={[styles.badge, styles.badgeTop]}>
              {photoIndex + 1} / {total}
              {current?.isVideo ? " · Video" : ""}
            </Text>
            <Pressable style={[styles.nav, { left: 10 }]} onPress={() => step(-1)}>
              <Icon name="chevronleft" size={18} />
            </Pressable>
            <Pressable style={[styles.nav, { right: 10 }]} onPress={() => step(1)}>
              <Icon name="chevronright" size={18} />
            </Pressable>
          </>
        ) : null}
      </View>
      {total > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
          {result.photos.map((photo, index) => {
            const on = selected.has(index);

            return (
              <Pressable
                key={photo.id}
                onPress={() => onPhotoIndex(index)}
                style={[styles.thumb, index === photoIndex && styles.thumbCurrent]}
              >
                <RemoteImage
                  uri={photo.thumbnailUrl ?? photo.url}
                  style={styles.fill}
                  resizeMode="cover"
                />
                <Pressable
                  hitSlop={8}
                  onPress={() => onToggle(index)}
                  style={[styles.check, on && styles.checkOn]}
                >
                  {on ? <Icon name="check" size={12} color={colors.bg} /> : null}
                </Pressable>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
      {music ? <AudioPreview uri={music} fallbackDuration={result.durationSeconds} /> : null}
    </View>
  );
}

function AudioStage({ result, boxWidth, maxHeight }: StageProps) {
  const size = Math.min(boxWidth, maxHeight);
  const music = audioSource(result);

  return (
    <View style={styles.gap}>
      <View style={[styles.box, { width: boxWidth, height: size }]}>
        <RemoteImage uri={result.coverUrl} style={styles.fill} resizeMode="cover" showError />
      </View>
      {music ? <AudioPreview uri={music} fallbackDuration={result.durationSeconds} /> : null}
    </View>
  );
}

function VideoStage({ result, videoUrl, onNotice, boxWidth, maxHeight }: StageProps) {
  const [playing, setPlaying] = useState(false);
  const cover = result.coverUrl ? absolute(result.coverUrl) : undefined;
  const ratio = useRatio(cover, 9 / 16);
  const embed = result.embedUrl && isTrustedEmbed(result.embedUrl) ? result.embedUrl : undefined;
  const height = Math.min(boxWidth / (embed ? 16 / 9 : ratio), maxHeight);
  const embedId = embed ? /\/embed\/([\w-]{11})/.exec(embed)?.[1] : undefined;
  const embedHtml = embedId
    ? `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin"><style>html,body{margin:0;height:100%;background:#000}iframe{border:0;width:100%;height:100%}</style></head><body><iframe src="https://www.youtube-nocookie.com/embed/${embedId}?autoplay=1&playsinline=1&rel=0&origin=${encodeURIComponent(API_URL)}" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></body></html>`
    : undefined;
  const canPlay = Boolean(embedHtml) || Boolean(videoUrl);

  return (
    <View style={[styles.box, { width: boxWidth, height }]}>
      {playing && embedHtml ? (
        <WebView
          source={{ html: embedHtml, baseUrl: API_URL }}
          style={styles.fill}
          originWhitelist={["https://*"]}
          onShouldStartLoadWithRequest={(request) =>
            isTrustedEmbed(request.url) ||
            request.url.startsWith(API_URL) ||
            request.url === "about:blank"
          }
          setSupportMultipleWindows={false}
          javaScriptCanOpenWindowsAutomatically={false}
          allowFileAccess={false}
          allowFileAccessFromFileURLs={false}
          allowUniversalAccessFromFileURLs={false}
          mixedContentMode="never"
          geolocationEnabled={false}
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
        />
      ) : playing && videoUrl ? (
        <VideoPreview
          uri={absolute(videoUrl)}
          direct={directSource(videoUrl)}
          onFail={(reason) => {
            setPlaying(false);
            onNotice(
              `Pratinjau tidak bisa diputar${reason ? ` (${reason})` : ""}. Tombol unduh tetap bisa dipakai.`
            );
          }}
        />
      ) : (
        <>
          <RemoteImage uri={result.coverUrl} style={styles.fill} resizeMode="contain" showError />
          {canPlay ? (
            <Pressable style={styles.play} onPress={() => setPlaying(true)}>
              <Icon name="play" size={26} color={colors.text} />
            </Pressable>
          ) : null}
          {embedId ? (
            <Pressable
              style={styles.external}
              onPress={() => void Linking.openURL(`https://www.youtube.com/watch?v=${embedId}`)}
            >
              <Text style={styles.externalText}>Buka di YouTube</Text>
            </Pressable>
          ) : null}
          {result.durationSeconds ? (
            <Text style={styles.badge}>{formatDuration(result.durationSeconds)}</Text>
          ) : null}
        </>
      )}
    </View>
  );
}

export default function MediaStage(props: Props) {
  const window = useWindowDimensions();
  const shared = { ...props, boxWidth: window.width - 40, maxHeight: window.height * 0.6 };

  if (props.result.kind === "photo") {
    return <PhotoStage key={props.result.sourceUrl} {...shared} />;
  }

  if (props.result.kind === "audio") {
    return <AudioStage key={props.result.sourceUrl} {...shared} />;
  }

  return <VideoStage key={props.result.sourceUrl} {...shared} />;
}

const styles = StyleSheet.create({
  gap: { gap: 12 },
  box: {
    alignSelf: "center",
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#06080c",
    borderWidth: 1,
    borderColor: colors.line,
  },
  fill: { width: "100%", height: "100%" },
  play: {
    position: "absolute",
    alignSelf: "center",
    top: "50%",
    marginTop: -32,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    right: 12,
    bottom: 12,
    backgroundColor: "rgba(0,0,0,0.65)",
    color: colors.text,
    fontSize: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  external: {
    position: "absolute",
    left: 12,
    bottom: 12,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.sm,
  },
  externalText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  badgeTop: { top: 12, bottom: undefined, right: undefined, left: 12 },
  nav: {
    position: "absolute",
    top: "50%",
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbs: { gap: 8, paddingHorizontal: 2 },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: colors.chip,
  },
  thumbCurrent: { borderColor: colors.text },
  check: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.8)",
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { backgroundColor: colors.text, borderColor: colors.text },
});
