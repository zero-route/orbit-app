import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import type { MediaResult } from "../types";
import AuthorRow from "./AuthorRow";
import CaptionBlock from "./CaptionBlock";
import MediaStage from "./MediaStage";
import QualityPicker from "./QualityPicker";
import StatsGrid from "./StatsGrid";
import type { useResultController } from "../hooks/useResultController";

type Controller = NonNullable<ReturnType<typeof useResultController>>;

type Props = {
  result: MediaResult;
  ctrl: Controller;
  onNotice: (message: string) => void;
};

export default function ResultCard({ result, ctrl, onNotice }: Props) {
  return (
    <View style={styles.wrap}>
      <MediaStage
        result={result}
        videoUrl={ctrl.videoUrl}
        photoIndex={ctrl.photoIndex}
        selected={ctrl.selected}
        onPhotoIndex={ctrl.setPhotoIndex}
        onToggle={ctrl.toggle}
        onNotice={onNotice}
      />

      {result.kind === "audio" && result.audio ? (
        <View style={styles.track}>
          <Text style={styles.title}>{result.audio.title}</Text>
          {result.audio.artist ? <Text style={styles.artist}>{result.audio.artist}</Text> : null}
        </View>
      ) : null}

      <View style={styles.profile}>
        <AuthorRow author={result.author} platform={result.platform} />
        <StatsGrid stats={result.stats} />
        <CaptionBlock text={result.caption} />
      </View>

      {result.kind === "video" ? (
        <QualityPicker
          options={result.videos.map((item) => ({ id: item.id, label: item.label }))}
          value={ctrl.qualityId}
          onChange={ctrl.setQualityId}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  track: { gap: 4 },
  title: { color: colors.text, fontSize: 22, fontWeight: "600" },
  artist: { color: colors.mute, fontSize: 15 },
  profile: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.025)",
    overflow: "hidden",
  },
});
