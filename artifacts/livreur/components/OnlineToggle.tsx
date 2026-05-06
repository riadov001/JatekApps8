import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

interface OnlineToggleProps {
  online: boolean;
  toggling: boolean;
  permissionDenied: boolean;
  onToggle: (next: boolean) => void;
}

export function OnlineToggle({
  online,
  toggling,
  permissionDenied,
  onToggle,
}: OnlineToggleProps) {
  const colors = useColors();

  const handleChange = (next: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onToggle(next);
  };

  return (
    <Pressable
      onPress={() => !toggling && handleChange(!online)}
      style={[
        styles.card,
        {
          backgroundColor: online ? colors.primary : colors.card,
          borderColor: online ? colors.primary : colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <View style={styles.leftCol}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: online
                ? "rgba(255,255,255,0.18)"
                : colors.muted,
            },
          ]}
        >
          <Feather
            name={online ? "radio" : "power"}
            size={22}
            color={online ? colors.primaryForeground : colors.mutedForeground}
          />
        </View>
        <View>
          <Text
            style={[
              styles.title,
              { color: online ? colors.primaryForeground : colors.foreground },
            ]}
          >
            {online ? "En ligne" : "Hors ligne"}
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                color: online
                  ? "rgba(255,255,255,0.85)"
                  : colors.mutedForeground,
              },
            ]}
          >
            {permissionDenied
              ? "Autorisation GPS requise"
              : online
                ? "Vous recevez des courses"
                : "Activez pour recevoir des courses"}
          </Text>
        </View>
      </View>
      {toggling ? (
        <ActivityIndicator
          color={online ? colors.primaryForeground : colors.primary}
        />
      ) : (
        <Switch
          value={online}
          onValueChange={handleChange}
          trackColor={{ false: colors.muted, true: colors.primaryForeground }}
          thumbColor={online ? colors.primary : colors.foreground}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderWidth: 1,
    minHeight: 88,
  },
  leftCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
});
