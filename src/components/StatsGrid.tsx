import { StyleSheet, Text, View } from "react-native";
import { formatCount } from "../lib/text";
import { colors } from "../theme";
import type { Stats } from "../types";
import Icon, { type IconName } from "./Icon";

const ITEMS: Array<[keyof Stats, string, IconName]> = [
  ["views", "Tayangan", "eye"],
  ["likes", "Suka", "heart"],
  ["comments", "Komentar", "comment"],
  ["shares", "Bagikan", "share"],
  ["saves", "Simpan", "bookmark"],
  ["reposts", "Posting ulang", "repost"],
];

function columnsFor(count: number) {
  if (count >= 5) return 3;
  if (count === 4) return 2;

  return Math.max(count, 1);
}

export default function StatsGrid({ stats }: { stats?: Stats }) {
  const cells = ITEMS.filter(([key]) => typeof stats?.[key] === "number");

  if (cells.length === 0) {
    return null;
  }

  const columns = columnsFor(cells.length);
  const rows: Array<Array<(typeof cells)[number] | null>> = [];

  for (let index = 0; index < cells.length; index += columns) {
    const row: Array<(typeof cells)[number] | null> = cells.slice(index, index + columns);

    while (row.length < columns) {
      row.push(null);
    }

    rows.push(row);
  }

  return (
    <View style={styles.wrap}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={[styles.row, rowIndex < rows.length - 1 && styles.rowLine]}>
          {row.map((cell, cellIndex) => (
            <View
              key={cell ? cell[0] : `f${cellIndex}`}
              style={[styles.cell, cellIndex < columns - 1 && styles.cellLine]}
            >
              {cell ? (
                <>
                  <View style={styles.top}>
                    <Icon name={cell[2]} size={18} color={colors.soft} />
                    <Text style={styles.value}>{formatCount(stats?.[cell[0]])}</Text>
                  </View>
                  <Text style={styles.label}>{cell[1]}</Text>
                </>
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  row: { flexDirection: "row" },
  rowLine: { borderBottomWidth: 1, borderBottomColor: colors.line },
  cell: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, gap: 6 },
  cellLine: { borderRightWidth: 1, borderRightColor: colors.line },
  top: { flexDirection: "row", alignItems: "center", gap: 8 },
  value: { color: colors.text, fontSize: 16, fontWeight: "700" },
  label: { color: colors.mute, fontSize: 12 },
});
