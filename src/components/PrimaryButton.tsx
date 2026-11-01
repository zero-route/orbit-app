import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import GradientBox from "./GradientBox";

type Props = {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
};

export default function PrimaryButton({ label, onPress, busy, disabled }: Props) {
  const off = disabled || busy;

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [{ opacity: disabled ? 0.45 : pressed ? 0.85 : 1 }]}
    >
      <GradientBox radius={16} border={1.2}>
        <View style={styles.inner}>
          {busy ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.text}>{label}</Text>
          )}
        </View>
      </GradientBox>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inner: {
    height: 52,
    borderRadius: 15,
    backgroundColor: "#12141a",
    alignItems: "center",
    justifyContent: "center",
  },
  text: { color: colors.text, fontSize: 16, fontWeight: "700" },
});
