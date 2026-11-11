import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, type ImageStyle, type StyleProp } from "react-native";
import { authHeaders } from "../api/device";
import { absolute } from "../config";
import { colors } from "../theme";

type Props = {
  uri?: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: "cover" | "contain";
  onSize?: (width: number, height: number) => void;
  showError?: boolean;
};

async function explain(uri: string, headers: Record<string, string>) {
  try {
    const response = await fetch(uri, { headers });
    const type = response.headers.get("content-type") ?? "";

    if (response.ok && type.startsWith("image/")) {
      return `Gambar tidak bisa ditampilkan (${type}).`;
    }

    let detail = "";

    if (type.includes("json")) {
      const body = (await response.json()) as { error?: string };
      detail = body.error ?? "";
    }

    return `Gambar gagal dimuat (${response.status})${detail ? `: ${detail}` : ""}`;
  } catch {
    return "Gambar gagal dimuat. Periksa koneksi.";
  }
}

export default function RemoteImage({ uri, style, resizeMode = "cover", onSize, showError }: Props) {
  const [headers, setHeaders] = useState<Record<string, string> | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [failure, setFailure] = useState<string | null>(null);
  const full = uri ? absolute(uri) : undefined;
  const proxied = Boolean(uri && uri.startsWith("/api/"));

  useEffect(() => {
    let live = true;

    setFailure(null);

    if (!proxied) {
      setHeaders({});
      return;
    }

    authHeaders()
      .then((value) => live && setHeaders(value))
      .catch(() => live && setHeaders({}));

    return () => {
      live = false;
    };
  }, [uri, proxied, attempt]);

  if (!full || !headers) {
    return null;
  }

  if (failure) {
    return showError ? (
      <Pressable
        style={styles.error}
        onPress={() => {
          setFailure(null);
          setAttempt((value) => value + 1);
        }}
      >
        <Text style={styles.errorText}>{failure}</Text>
        <Text style={styles.retry}>Ketuk untuk coba lagi</Text>
      </Pressable>
    ) : null;
  }

  const source = attempt > 0 && proxied ? `${full}&r=${attempt}` : full;

  return (
    <Image
      source={{ uri: source, headers }}
      style={style}
      resizeMode={resizeMode}
      onLoad={(event) => {
        const { width, height } = event.nativeEvent.source;

        if (onSize && width > 0 && height > 0) {
          onSize(width, height);
        }
      }}
      onError={() => {
        void explain(source, headers).then(setFailure);
      }}
    />
  );
}

const styles = StyleSheet.create({
  error: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 6,
  },
  errorText: { color: colors.soft, fontSize: 13, textAlign: "center" },
  retry: { color: colors.mute, fontSize: 12 },
});
