import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

type Option = { id: string; label: string };

type Props = {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
};

export default function QualityPicker({ options, value, onChange }: Props) {
  if (options.length < 2) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      {options.map((option) => (
        <Pressable
          key={option.id}
          onPress={() => onChange(option.id)}
          style={[styles.item, option.id === value && styles.on]}
        >
          <Text style={[styles.text, option.id === value && styles.textOn]} numberOfLines={1}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    gap: 6,
    padding: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  item: { flex: 1, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  on: { backgroundColor: colors.text },
  text: { color: colors.soft, fontSize: 14, fontWeight: "600" },
  textOn: { color: colors.bg },
});
