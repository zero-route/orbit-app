import { StyleSheet, Text } from "react-native";
import * as Updates from "expo-updates";
import { APP_VERSION } from "../config";
import { colors } from "../theme";

export default function BuildInfo() {
  const source = Updates.isEmbeddedLaunch
    ? "bawaan APK"
    : `OTA ${(Updates.updateId ?? "-").slice(0, 8)}`;

  return (
    <Text style={styles.text}>
      {`v${APP_VERSION} · ${source} · ${Updates.channel ?? "-"} · rt ${Updates.runtimeVersion ?? "-"}`}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { color: colors.dim, fontSize: 11, marginTop: -8, marginLeft: 4 },
});
