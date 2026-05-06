import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLocationTracking } from "@/contexts/LocationTrackingContext";
import { useColors } from "@/hooks/useColors";

const DEFAULT_REGION = {
  latitude: 33.5731,
  longitude: -7.5898,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { coords, online, permissionDenied, refreshOnce, requestPermission } =
    useLocationTracking();
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<MapView | null>(null);
  const initialCenteredRef = useRef(false);

  useEffect(() => {
    if (!coords) {
      (async () => {
        setLoading(true);
        await refreshOnce();
        setLoading(false);
      })();
    }
  }, [coords, refreshOnce]);

  useEffect(() => {
    if (coords && mapRef.current && !initialCenteredRef.current) {
      initialCenteredRef.current = true;
      mapRef.current.animateToRegion(
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        500,
      );
    }
  }, [coords]);

  const recenter = async () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    setLoading(true);
    const c = await refreshOnce();
    setLoading(false);
    if (c && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: c.latitude,
          longitude: c.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500,
      );
    }
  };

  const region = coords
    ? {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
    : DEFAULT_REGION;

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        showsUserLocation={Platform.OS !== "web"}
        showsMyLocationButton={false}
      >
        {coords ? (
          <Marker
            coordinate={{
              latitude: coords.latitude,
              longitude: coords.longitude,
            }}
            title="Vous"
            pinColor={colors.primary}
          />
        ) : null}
      </MapView>

      <View
        style={[
          styles.statusBar,
          {
            top: insets.top + webTopInset + 12,
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <View
          style={[
            styles.dot,
            { backgroundColor: online ? colors.success : colors.mutedForeground },
          ]}
        />
        <Text style={[styles.statusText, { color: colors.foreground }]}>
          {online ? "En ligne — partage GPS actif" : "Hors ligne"}
        </Text>
      </View>

      {permissionDenied ? (
        <View
          style={[
            styles.permWarn,
            {
              top: insets.top + webTopInset + 64,
              backgroundColor: colors.destructive,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Feather name="alert-circle" size={16} color={colors.destructiveForeground} />
          <Text style={[styles.permText, { color: colors.destructiveForeground }]}>
            Autorisation GPS requise
          </Text>
          <Pressable onPress={requestPermission} hitSlop={10}>
            <Text style={[styles.permLink, { color: colors.destructiveForeground }]}>
              Activer
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View
        style={[
          styles.fabCol,
          { bottom: insets.bottom + (Platform.OS === "web" ? 100 : 100) + 16 },
        ]}
      >
        <Pressable
          onPress={recenter}
          style={[
            styles.fab,
            { backgroundColor: colors.primary },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Feather name="navigation" size={20} color={colors.primaryForeground} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statusBar: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
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
  permWarn: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  permText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  permLink: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    textDecorationLine: "underline",
  },
  fabCol: {
    position: "absolute",
    right: 16,
    gap: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
