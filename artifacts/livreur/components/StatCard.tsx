import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface StatCardProps {
  label: string;
  value: string;
  icon?: keyof typeof Feather.glyphMap;
  accentColor?: string;
  subtitle?: string;
}

export function StatCard({ label, value, icon, accentColor, subtitle }: StatCardProps) {
  const colors = useColors();
  const tint = accentColor ?? colors.primary;
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border },
      ]}
    >
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
        {icon ? (
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: tint + "22" },
            ]}
          >
            <Feather name={icon} size={16} color={tint} />
          </View>
        ) : null}
      </View>
      <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    minHeight: 100,
    justifyContent: "space-between",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  value: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    marginTop: 8,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
