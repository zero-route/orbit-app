import { Pressable, StyleSheet, View } from "react-native";
import { colors } from "../theme";
import Icon, { type IconName } from "./Icon";
import PrimaryButton from "./PrimaryButton";

type Props = {
  primaryLabel: string;
  busy?: boolean;
  disabled?: boolean;
  onPrimary: () => void;
  onAudio?: () => void;
  onCopy?: () => void;
  slideshow?: "hidden" | "disabled" | "enabled";
  onSlideshow?: () => void;
};

function IconButton({
  name,
  onPress,
  disabled,
  dashed,
}: {
  name: IconName;
  onPress?: () => void;
  disabled?: boolean;
  dashed?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.icon, dashed && styles.dashed, disabled && { opacity: 0.45 }]}
    >
      <Icon name={name} size={22} color={colors.soft} />
    </Pressable>
  );
}

export default function ActionBar({
  primaryLabel,
  busy,
  disabled,
  onPrimary,
  onAudio,
  onCopy,
  slideshow = "hidden",
  onSlideshow,
}: Props) {
  return (
    <View style={styles.row}>
      <PrimaryButton
        flex
        icon="download"
        label={primaryLabel}
        busy={busy}
        disabled={disabled}
        onPress={onPrimary}
      />
      {onAudio ? <IconButton name="music" onPress={onAudio} /> : null}
      {slideshow !== "hidden" ? (
        <IconButton
          name="slides"
          onPress={onSlideshow}
          disabled={slideshow === "disabled"}
          dashed={slideshow === "disabled"}
        />
      ) : null}
      {onCopy ? <IconButton name="copy" onPress={onCopy} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10, alignItems: "stretch" },
  icon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: colors.fill,
    alignItems: "center",
    justifyContent: "center",
  },
  dashed: { borderStyle: "dashed" },
});
