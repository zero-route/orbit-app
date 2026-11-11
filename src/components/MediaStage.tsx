import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { WebView } from "react-native-webview";
import { absolute } from "../config";
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

function PhotoStage({ result, photoIndex, selected, onPhotoIndex, onToggle, boxWidth, maxHeight }: StageProps) {
  const total = result.photos.length;
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
    </View>
  );
}

function AudioStage({ result, boxWidth, maxHeight }: StageProps) {
  const cover = result.coverUrl ? absolute(result.coverUrl) : undefined;
  const size = Math.min(boxWidth, maxHeight);

  return (
    <View style={styles.gap}>
      <View style={[styles.box, { width: boxWidth, height: size }]}>
        {cover ? <Image source={{ uri: cover }} style={styles.fill} resizeMode="cover" /> : null}
      </View>
      {result.audio?.previewUrl ? (
        <AudioPreview uri={absolute(result.audio.previewUrl)} fallbackDuration={result.durationSeconds} />
      ) : null}
    </View>
  );
}

function VideoStage({ result, videoUrl, onNotice, boxWidth, maxHeight }: StageProps) {
  const [playing, setPlaying] = useState(false);
  const cover = result.coverUrl ? absolute(result.coverUrl) : undefined;
  const ratio = useRatio(cover, 9 / 16);
  const height = Math.min(boxWidth / (result.embedUrl ? 16 / 9 : ratio), maxHeight);
  const canPlay = Boolean(result.embedUrl) || Boolean(videoUrl);

  return (
    <View style={[styles.box, { width: boxWidth, height }]}>
      {playing && result.embedUrl ? (
        <WebView
          source={{ uri: result.embedUrl }}
          style={styles.fill}
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
        />
      ) : playing && videoUrl ? (
        <VideoPreview
          uri={absolute(videoUrl)}
          onFail={() => {
            setPlaying(false);
            onNotice("Pratinjau tidak bisa diputar. Tombol unduh tetap bisa dipakai.");
          }}
        />
      ) : (
        <>
          {cover ? <Image source={{ uri: cover }} style={styles.fill} resizeMode="contain" /> : null}
          {canPlay ? (
            <Pressable style={styles.play} onPress={() => setPlaying(true)}>
              <Icon name="play" size={26} color={colors.text} />
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
