import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import GradientBox from "./GradientBox";
import Icon, { type IconName } from "./Icon";

type Props = {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  icon?: IconName;
  flex?: boolean;
};

export default function PrimaryButton({ label, onPress, busy, disabled, icon, flex }: Props) {
  const off = disabled || busy;

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        flex && { flex: 1 },
        { opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
      ]}
    >
      <GradientBox radius={16} border={1.2}>
        <View style={styles.inner}>
          {busy ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <>
              {icon ? <Icon name={icon} size={20} /> : null}
              <Text style={styles.text} numberOfLines={1}>
                {label}
              </Text>
            </>
          )}
        </View>
      </GradientBox>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inner: {
    height: 54,
    borderRadius: 15,
    backgroundColor: "#12141a",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
  },
  text: { color: colors.text, fontSize: 16, fontWeight: "700" },
});
