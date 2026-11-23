import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import type { DirectSource } from "../lib/direct";

type Props = {
  uri: string;
  direct?: DirectSource | null;
  onFail: (reason?: string) => void;
};

type PlayerProps = {
  source: { uri: string; headers?: Record<string, string> };
  onFail: (reason?: string) => void;
};

function Player({ source, onFail }: PlayerProps) {
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = false;
    instance.play();
  });

  useEffect(() => {
    const subscription = player.addListener("statusChange", (event) => {
      if (event.status === "error") {
        onFail(event.error?.message);
      }
    });

    return () => subscription.remove();
  }, [player, onFail]);

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      nativeControls
      contentFit="contain"
    />
  );
}

export default function VideoPreview({ uri, direct, onFail }: Props) {
  const [useDirect, setUseDirect] = useState(false);

  const source = useDirect && direct ? { uri: direct.url, headers: direct.headers } : { uri };

  return (
    <Player
      key={useDirect ? "direct" : "proxy"}
      source={source}
      onFail={(reason) => {
        if (direct && !useDirect) {
          setUseDirect(true);
          return;
        }

        onFail(reason);
      }}
    />
  );
}
