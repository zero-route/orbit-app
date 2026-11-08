import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { splitCaption } from "../lib/text";
import { colors, radius } from "../theme";

export default function CaptionBlock({ text }: { text?: string }) {
  const [open, setOpen] = useState(false);
  const parts = splitCaption(text);

  if (!parts.text && parts.tags.length === 0) {
    return null;
  }

  const long = parts.text.length > 110;

  return (
    <View style={styles.wrap}>
      {parts.text ? (
        <>
          <Text style={styles.text} numberOfLines={open ? undefined : 3}>
            {parts.text}
          </Text>
          {long ? (
            <Pressable onPress={() => setOpen((value) => !value)}>
              <Text style={styles.more}>{open ? "Ringkas" : "Selengkapnya"}</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
      {parts.tags.length > 0 ? (
        <View style={styles.tags}>
          {parts.tags.map((tag) => (
            <Text key={tag} style={styles.tag}>
              {tag}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  text: { color: colors.soft, fontSize: 15, lineHeight: 22 },
  more: { color: colors.mute, fontSize: 13, fontWeight: "600" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    color: colors.soft,
    fontSize: 13,
    backgroundColor: colors.chip,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
});
