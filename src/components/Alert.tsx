import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme";

type Props = {
  message: string;
  detail?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function Alert({ message, detail, actionLabel, onAction }: Props) {
  return (
    <View style={styles.box}>
      <View style={styles.text}>
        <Text style={styles.message}>{message}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,90,90,0.35)",
    backgroundColor: "rgba(255,90,90,0.08)",
  },
  text: { flex: 1, gap: 2 },
  message: { color: colors.bad, fontSize: 14, fontWeight: "700" },
  detail: { color: colors.mute, fontSize: 13 },
  action: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.fill,
  },
  actionText: { color: colors.text, fontSize: 13, fontWeight: "600" },
});
