import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLocationTracking } from "@/contexts/LocationTrackingContext";
import { useColors } from "@/hooks/useColors";

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { coords, online } = useLocationTracking();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 67,
        },
      ]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <Feather name="map" size={48} color={colors.primary} />
        <Text style={[styles.title, { color: colors.foreground }]}>
          Carte indisponible sur le web
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Ouvrez l'application Jatek Livreur sur votre téléphone (Expo Go) pour
          voir la carte en temps réel.
        </Text>

        <View style={[styles.statusRow, { borderTopColor: colors.border }]}>
          <View
            style={[
              styles.dot,
              { backgroundColor: online ? colors.success : colors.mutedForeground },
            ]}
          />
          <Text style={[styles.statusText, { color: colors.foreground }]}>
            {online ? "En ligne" : "Hors ligne"}
          </Text>
        </View>

        {coords ? (
          <Text style={[styles.coords, { color: colors.mutedForeground }]}>
            Position actuelle :{" "}
            {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    padding: 28,
    borderWidth: 1,
    alignItems: "center",
    gap: 12,
    marginTop: 40,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    textAlign: "center",
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  statusRow: {
    marginTop: 12,
    paddingTop: 16,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderTopWidth: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  coords: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginTop: 4,
  },
});
