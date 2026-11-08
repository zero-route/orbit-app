import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";

type Props = {
  uri: string;
  onFail: () => void;
};

export default function VideoPreview({ uri, onFail }: Props) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
    instance.play();
  });

  useEffect(() => {
    const subscription = player.addListener("statusChange", ({ status }) => {
      if (status === "error") {
        onFail();
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
