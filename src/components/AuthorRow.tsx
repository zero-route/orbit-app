import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { absolute } from "../config";
import { formatCount } from "../lib/text";
import { profileUrlFor } from "../lib/profile";
import { colors, radius } from "../theme";
import type { Author, PlatformId } from "../types";
import Icon from "./Icon";

type Props = {
  author?: Author;
  platform: PlatformId;
};

export default function AuthorRow({ author, platform }: Props) {
  if (!author || (!author.name && !author.username)) {
    return null;
  }

  const href = author.profileUrl ?? profileUrlFor(platform, author.username);

  const meta = [
    author.username ? `@${author.username.replace(/^@/, "")}` : null,
    typeof author.followers === "number"
      ? `${formatCount(author.followers)} ${platform === "youtube" ? "pelanggan" : "pengikut"}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.row}>
      <View style={styles.author}>
        {author.avatarUrl || platform !== "spotify" ? (
          author.avatarUrl ? (
            <Image source={{ uri: absolute(author.avatarUrl) }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar} />
          )
        ) : null}
        <View style={styles.text}>
          {author.name ? (
            <Text style={styles.name} numberOfLines={1}>
              {author.name}
            </Text>
          ) : null}
          {meta ? (
            <Text style={styles.meta} numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
        </View>
      </View>
      {href ? (
        <Pressable onPress={() => void Linking.openURL(href)} style={styles.visit}>
          <Icon name="external" size={16} color={colors.soft} />
          <Text style={styles.visitText}>Kunjungi</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 16,
  },
  author: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.chip },
  text: { flex: 1 },
  name: { color: colors.text, fontSize: 16, fontWeight: "700" },
  meta: { color: colors.mute, fontSize: 13, marginTop: 2 },
  visit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 42,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: radius.md,
  },
  visitText: { color: colors.soft, fontSize: 14, fontWeight: "600" },
});
