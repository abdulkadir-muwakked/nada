import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import type { DailySummary, HistoryRange } from "../../hooks/useSessionHistory";

type ThemeColors = ReturnType<typeof useTheme>["colors"];

interface ActivityHeatmapProps {
  data: DailySummary[];
  range: HistoryRange;
  selectedDate?: string | null;
  onSelect: (summary: DailySummary) => void;
}

const startOfWeek = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
};

const buildWeekMatrix = (data: DailySummary[]): DailySummary[][] => {
  if (data.length === 0) {
    return [];
  }

  const map = new Map<string, DailySummary>();
  data.forEach((item) => map.set(item.date, item));

  const firstDate = startOfWeek(new Date(data[0].date));
  const lastDate = new Date(data[data.length - 1].date);
  lastDate.setHours(0, 0, 0, 0);

  const matrix: DailySummary[][] = [];
  let week: DailySummary[] = [];
  const cursor = new Date(firstDate);

  while (cursor <= lastDate) {
    const key = cursor.toISOString().slice(0, 10);
    const entry = map.get(key) ?? {
      date: key,
      sessions: 0,
      minutes: 0,
    };
    week.push(entry);

    if (week.length === 7) {
      matrix.push(week);
      week = [];
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  if (week.length > 0) {
    while (week.length < 7) {
      const last = new Date(week[week.length - 1].date);
      last.setDate(last.getDate() + 1);
      const key = last.toISOString().slice(0, 10);
      week.push({ date: key, sessions: 0, minutes: 0 });
    }
    matrix.push(week);
  }

  return matrix;
};

const formatDayLabel = (date: string) => {
  const formatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  });
  return formatter.format(new Date(date));
};

const getIntensityColor = (
  sessions: number,
  minutes: number,
  isDark: boolean,
  colors: ThemeColors
) => {
  if (sessions <= 0) {
    return isDark ? "#3a3a3a" : "#e5e5e5";
  }

  if (sessions === 1) {
    return isDark ? "#58a55c" : "#9be9a8";
  }

  if (sessions <= 3) {
    return isDark ? "#2f7d32" : "#40c463";
  }

  if (sessions >= 4 || minutes >= 90) {
    return isDark ? "#1b5320" : "#0e7a28";
  }

  return colors.primary;
};

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  data,
  range,
  selectedDate,
  onSelect,
}) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const weekRows = useMemo(() => buildWeekMatrix(data), [data]);

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {weekRows.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={styles.weekRow}>
            {week.map((day) => {
              const color = getIntensityColor(
                day.sessions,
                day.minutes,
                isDark,
                colors
              );
              const isSelected = selectedDate === day.date;

              return (
                <TouchableOpacity
                  key={day.date}
                  style={[
                    styles.cell,
                    { backgroundColor: color },
                    isSelected && styles.cellSelected,
                  ]}
                  onPress={() => onSelect(day)}
                  accessibilityRole="button"
                  accessibilityLabel={`${formatDayLabel(
                    day.date
                  )}: ${day.sessions} sessions, ${day.minutes} minutes`}
                />
              );
            })}
          </View>
        ))}
      </View>

      <Text style={styles.rangeLabel}>
        {range === "7d" ? "Last 7 days" : "This month"}
      </Text>
    </View>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      width: "100%",
      marginBottom: 16,
    },
    grid: {
      flexDirection: "column",
      gap: 6,
      paddingVertical: 8,
    },
    weekRow: {
      flexDirection: "row",
      gap: 6,
    },
    cell: {
      width: 22,
      height: 22,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    },
    cellSelected: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    rangeLabel: {
      marginTop: 4,
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: "right",
    },
  });

export default ActivityHeatmap;
