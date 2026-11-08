import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { formatDuration } from "../lib/text";
import { colors } from "../theme";
import Icon from "./Icon";

type Props = {
  uri: string;
  fallbackDuration?: number;
};

export default function AudioPreview({ uri, fallbackDuration }: Props) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const [width, setWidth] = useState(1);

  const total = status.duration > 0 ? status.duration : (fallbackDuration ?? 0);
  const progress = total > 0 ? Math.min(1, status.currentTime / total) : 0;

  const toggle = () => {
    if (status.playing) {
      player.pause();
    } else {
      if (total > 0 && status.currentTime >= total - 0.2) {
        void player.seekTo(0);
      }

      player.play();
    }
  };

  return (
    <View style={styles.row}>
      <Pressable onPress={toggle} style={styles.button}>
        <Icon name={status.playing ? "pause" : "play"} size={20} color={colors.bg} />
      </Pressable>
      <Text style={styles.time}>{formatDuration(status.currentTime)}</Text>
      <Pressable
        style={styles.track}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width || 1)}
        onPress={(event) => {
          if (total > 0) {
            void player.seekTo((event.nativeEvent.locationX / width) * total);
          }
        }}
      >
        <View style={styles.rail}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        </View>
      </Pressable>
      <Text style={styles.time}>{formatDuration(total)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    backgroundColor: colors.fill,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  time: { color: colors.mute, fontSize: 12, minWidth: 34, textAlign: "center" },
  track: { flex: 1, height: 28, justifyContent: "center" },
  rail: { height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.14)", overflow: "hidden" },
  fill: { height: 4, backgroundColor: colors.text },
});
