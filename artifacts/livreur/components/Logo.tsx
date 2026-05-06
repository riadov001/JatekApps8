import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export function Logo({ size = "md" }: LogoProps) {
  const colors = useColors();
  const fontSize = size === "lg" ? 36 : size === "md" ? 28 : 22;
  const dotSize = size === "lg" ? 14 : size === "md" ? 12 : 10;
  return (
    <View style={styles.row}>
      <Text
        style={{
          color: colors.foreground,
          fontFamily: "Inter_700Bold",
          fontSize,
          letterSpacing: -1,
        }}
      >
        Jatek
      </Text>
      <View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: colors.primary,
          marginLeft: 4,
          marginBottom: 4,
        }}
      />
      <Text
        style={{
          color: colors.mutedForeground,
          fontFamily: "Inter_600SemiBold",
          fontSize: fontSize * 0.55,
          marginLeft: 8,
          letterSpacing: 1.5,
          textTransform: "uppercase",
        }}
      >
        Livreur
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
});
