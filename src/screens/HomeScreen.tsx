import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { ApiError, loadDetails, resolveBase } from "../api/client";
import { getToken } from "../api/device";
import Alert from "../components/Alert";
import ActionBar from "../components/ActionBar";
import GradientBox from "../components/GradientBox";
import Icon from "../components/Icon";
import Logo from "../components/Logo";
import PlatformRow from "../components/PlatformRow";
import ResultCard from "../components/ResultCard";
import Skeleton from "../components/Skeleton";
import { saveOne, type SaveFile } from "../download/save";
import { useResultController } from "../hooks/useResultController";
import { colors, platformAccent, radius } from "../theme";
import type { MediaResult } from "../types";

const HOSTS: Array<[RegExp, string]> = [
  [/tiktok\.com/i, "tiktok"],
  [/instagram\.com/i, "instagram"],
  [/youtu(\.be|be\.com)/i, "youtube"],
  [/(^|\/\/|\.)(x|twitter)\.com/i, "x"],
  [/threads\.(net|com)/i, "threads"],
  [/pinterest\.|pin\.it/i, "pinterest"],
  [/spotify\.com|spotify\.link/i, "spotify"],
];

function hasText(value: string) {
  return value.trim().length > 0;
}

function extractLink(value: string) {
  const match = value.match(/https?:\/\/[^\s]+/i);

  if (match) {
    return match[0].replace(/[)\]}>.,;!?'"]+$/, "");
  }

  const bare = value.match(/(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?/i);

  return bare ? `https://${bare[0].replace(/[)\]}>.,;!?'"]+$/, "")}` : null;
}

function detect(value: string) {
  for (const [pattern, id] of HOSTS) {
    if (pattern.test(value)) {
      return id;
    }
  }

  return null;
}

export default function HomeScreen() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<MediaResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const last = useRef("");
  const run = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void getToken();

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  const show = (text: string | null, error = false, hold = false) => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    setMessage(text);
    setIsError(error);

    if (text && !error && !hold) {
      timer.current = setTimeout(() => setMessage(null), 4000);
    }
  };

  const paste = async () => {
    const text = await Clipboard.getStringAsync();

    if (text.trim()) {
      setInput(text.trim());
    }
  };

  const fetchResult = async (link: string) => {
    const id = (run.current += 1);
    const base = await resolveBase(link);

    if (id !== run.current) {
      return base;
    }

    setResult(base);

    if (base.detailsPending) {
      void loadDetails(link, base).then((full) => {
        if (id === run.current) {
          setResult(full);
        }
      });
    }

    return base;
  };

  const submit = async (link: string) => {
    if (!link) {
      return;
    }

    Keyboard.dismiss();
    last.current = link;
    setLoading(true);
    setResult(null);
    setFailure(null);
    show(null);

    try {
      await fetchResult(link);
    } catch (error) {
      setFailure(error instanceof ApiError ? error.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const active = detect(input);
  const link = extractLink(input);
  const looksLikeLink = /https?:\/\/|\.[a-z]{2,}(\/|$)/i.test(input.trim());
  const unsupported = hasText(input) && !active && looksLikeLink;

  useEffect(() => {
    if (!input.trim()) {
      last.current = "";
      run.current += 1;
      setResult(null);
      setFailure(null);
      setLoading(false);
      return;
    }

    if (!active || !link || last.current === link) {
      return;
    }

    const wait = setTimeout(() => void submit(link), 350);

    return () => clearTimeout(wait);
  }, [input]);

  const retry = () => {
    if (link) {
      void submit(link);
    }
  };

  const clear = () => {
    last.current = "";
    setInput("");
  };

  const save = async (files: SaveFile[]) => {
    if (!result || saving || files.length === 0) {
      return;
    }

    setSaving(true);

    let done = 0;

    for (let index = 0; index < files.length; index += 1) {
      show(
        files.length > 1
          ? `Mengunduh ${index + 1} dari ${files.length}...`
          : "Mengunduh, mohon tunggu...",
        false,
        true
      );

      const outcome = await saveOne(files[index]);

      if (!outcome.ok && outcome.expired) {
        try {
          await fetchResult(result.sourceUrl);
          show("Link kedaluwarsa, sudah diperbarui. Tekan unduh sekali lagi.", true);
        } catch {
          show(outcome.message, true);
        }

        setSaving(false);
        return;
      }

      if (!outcome.ok) {
        show(outcome.message, true);
        setSaving(false);
        return;
      }

      done += 1;
    }

    show(`${done} file tersimpan di album Orbit.`);
    setSaving(false);
  };

  const ctrl = useResultController({
    result,
    onSave: (files) => void save(files),
    onNotice: (text) => show(text),
  });

  const accent = active ? platformAccent[active] : undefined;
  const hasInput = input.trim().length > 0;
  const compact = Boolean(result) || loading || Boolean(failure);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: result ? 150 : 48 }]}
        keyboardShouldPersistTaps="handled"
      >
        {compact ? (
          <View style={styles.heroCompact}>
            <Logo size={34} />
            <Text style={styles.titleCompact}>Orbit</Text>
          </View>
        ) : (
          <View style={styles.hero}>
            <Logo size={64} />
            <Text style={styles.title}>Orbit Media</Text>
            <Text style={styles.sub}>Download media dari berbagai platform</Text>
          </View>
        )}

        <View style={styles.row}>
          <View style={styles.flex}>
            <GradientBox radius={22} solid={accent}>
              <View style={styles.urlInner}>
                <Icon name="link" size={20} color={accent ?? colors.mute} />
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Tempel link di sini"
                  placeholderTextColor={colors.dim}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="go"
                  onSubmitEditing={retry}
                  style={styles.input}
                />
                {hasInput ? (
                  <Pressable onPress={clear} hitSlop={10}>
                    <Icon name="close" size={18} color={colors.mute} />
                  </Pressable>
                ) : null}
              </View>
            </GradientBox>
          </View>
          <Pressable onPress={paste} style={styles.paste}>
            <Text style={styles.pasteText}>Tempel</Text>
          </Pressable>
        </View>

        <Text style={styles.reminder}>
          Pengingat: Hormati karya dan hak kekayaan intelektual kreator.
        </Text>

        <PlatformRow active={active} />

        {unsupported ? <Alert message="Link ini belum didukung." /> : null}

        {failure ? (
          <Alert message={failure} actionLabel="Coba lagi" onAction={retry} />
        ) : null}

        {message && !result ? (
          <Text style={[styles.message, isError && styles.error]}>{message}</Text>
        ) : null}

        {loading ? <Skeleton /> : null}

        {result && ctrl ? (
          <ResultCard result={result} ctrl={ctrl} onNotice={(text) => show(text)} />
        ) : null}

      </ScrollView>

      {result && ctrl ? (
        <View style={styles.bar}>
          {message ? (
            <Text style={[styles.notice, isError && styles.noticeError]}>{message}</Text>
          ) : null}
          <ActionBar
            primaryLabel={saving ? "Mengunduh..." : ctrl.primaryLabel}
            busy={saving}
            disabled={!ctrl.canPrimary}
            onPrimary={ctrl.primary}
            onAudio={ctrl.audio}
            onCopy={ctrl.copy}
            slideshow={ctrl.slideshow}
            onSlideshow={ctrl.onSlideshow}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: RNStatusBar.currentHeight ?? 40,
  },
  scroll: { padding: 20, gap: 16 },
  hero: { alignItems: "center", gap: 8, marginTop: 24, marginBottom: 18 },
  heroCompact: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 2 },
  title: { color: colors.text, fontSize: 32, fontWeight: "800" },
  titleCompact: { color: colors.text, fontSize: 20, fontWeight: "800" },
  sub: { color: colors.mute, fontSize: 14, textAlign: "center" },
  row: { flexDirection: "row", gap: 10, alignItems: "stretch" },
  flex: { flex: 1 },
  urlInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 20.5,
    paddingHorizontal: 16,
    minHeight: 54,
    gap: 10,
  },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 12 },
  paste: {
    borderWidth: 1,
    borderColor: "rgba(235,238,245,0.24)",
    borderRadius: radius.md,
    paddingHorizontal: 16,
    justifyContent: "center",
    backgroundColor: colors.fill,
  },
  pasteText: { color: colors.text, fontWeight: "600", fontSize: 14 },
  reminder: { color: colors.mute, fontSize: 13, lineHeight: 19, marginTop: -6 },
  message: { color: colors.ok, fontSize: 14 },
  error: { color: colors.bad },
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    gap: 10,
    padding: 16,
    paddingBottom: 20,
    backgroundColor: "rgba(11,13,18,0.96)",
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  notice: {
    color: colors.soft,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.fill,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  noticeError: { color: colors.bad },
});
