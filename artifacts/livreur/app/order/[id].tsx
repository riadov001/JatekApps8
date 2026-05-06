import { Feather } from "@expo/vector-icons";
import {
  getListOrdersQueryKey,
  useListOrders,
  useUpdateOrderStatus,
  type Order,
  type UpdateOrderStatusBodyStatus,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  accepted: "Acceptée",
  preparing: "En préparation",
  ready: "Prête",
  picked_up: "Récupérée",
  en_route: "En route",
  delivered: "Livrée",
  cancelled: "Annulée",
};

interface ActionDef {
  status: UpdateOrderStatusBodyStatus;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}

function nextActions(status: string): ActionDef[] {
  switch (status) {
    case "ready":
    case "accepted":
    case "preparing":
      return [{ status: "picked_up", label: "Marquer récupérée", icon: "shopping-bag" }];
    case "picked_up":
      return [{ status: "en_route", label: "Démarrer la course", icon: "navigation" }];
    case "en_route":
      return [{ status: "delivered", label: "Marquer livrée", icon: "check-circle" }];
    default:
      return [];
  }
}

export default function OrderDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = Number(id);
  const { driverId } = useAuth();

  const ordersQuery = useListOrders(
    { driverId: driverId ?? undefined },
    {
      query: {
        queryKey: getListOrdersQueryKey({ driverId: driverId ?? undefined }),
        enabled: !!driverId,
      },
    },
  );

  const order: Order | undefined = useMemo(
    () => (ordersQuery.data ?? []).find((o) => o.id === orderId),
    [ordersQuery.data, orderId],
  );

  const updateStatus = useUpdateOrderStatus({
    mutation: {
      onSuccess: () => {
        ordersQuery.refetch();
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
      },
      onError: () => {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        }
      },
    },
  });

  const isUpdating = updateStatus.isPending;

  if (ordersQuery.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, padding: 24 }]}>
        <Feather name="alert-circle" size={36} color={colors.mutedForeground} />
        <Text style={[styles.notFoundText, { color: colors.foreground }]}>
          Commande introuvable
        </Text>
      </View>
    );
  }

  const actions = nextActions(order.status);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: 20,
        paddingBottom: insets.bottom + 32,
        gap: 16,
      }}
    >
      <View style={styles.headerBlock}>
        <Text style={[styles.reference, { color: colors.mutedForeground }]}>
          #{order.reference ?? order.id}
        </Text>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {order.restaurantName}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: colors.primary + "22" }]}>
          <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.statusText, { color: colors.primary }]}>
            {STATUS_LABELS[order.status] ?? order.status}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>Client</Text>
        <View style={styles.row}>
          <Feather name="user" size={16} color={colors.foreground} />
          <Text style={[styles.rowText, { color: colors.foreground }]}>{order.userName}</Text>
        </View>
        <View style={styles.row}>
          <Feather name="map-pin" size={16} color={colors.primary} />
          <Text style={[styles.rowText, { color: colors.foreground, flex: 1 }]}>
            {order.deliveryAddress}
          </Text>
        </View>
        {order.notes ? (
          <View style={styles.row}>
            <Feather name="message-circle" size={16} color={colors.mutedForeground} />
            <Text style={[styles.rowText, { color: colors.mutedForeground, flex: 1 }]}>
              {order.notes}
            </Text>
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>Articles</Text>
        {(order.items ?? []).map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text
              style={[
                styles.itemQty,
                {
                  color: colors.primaryForeground,
                  backgroundColor: colors.primary,
                  borderRadius: 6,
                },
              ]}
            >
              {item.quantity}×
            </Text>
            <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={2}>
              {item.menuItemName}
            </Text>
            <Text style={[styles.itemPrice, { color: colors.foreground }]}>
              {item.totalPrice.toFixed(2)} MAD
            </Text>
          </View>
        ))}
      </View>

      <View
        style={[
          styles.totalCard,
          { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border },
        ]}
      >
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Sous-total</Text>
          <Text style={[styles.totalValue, { color: colors.foreground }]}>
            {order.subtotal.toFixed(2)} MAD
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Livraison</Text>
          <Text style={[styles.totalValue, { color: colors.foreground }]}>
            {order.deliveryFee.toFixed(2)} MAD
          </Text>
        </View>
        <View style={[styles.totalRow, { borderTopColor: colors.border, borderTopWidth: 1, paddingTop: 10 }]}>
          <Text style={[styles.totalLabelStrong, { color: colors.foreground }]}>Total</Text>
          <Text style={[styles.totalValueStrong, { color: colors.foreground }]}>
            {order.total.toFixed(2)} MAD
          </Text>
        </View>
      </View>

      {actions.length > 0 ? (
        <View style={{ gap: 10 }}>
          {actions.map((a) => (
            <Pressable
              key={a.status}
              disabled={isUpdating}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                }
                updateStatus.mutate({ id: order.id, data: { status: a.status } });
              }}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: colors.radius,
                  opacity: pressed || isUpdating ? 0.85 : 1,
                },
              ]}
            >
              {isUpdating ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <>
                  <Feather name={a.icon} size={18} color={colors.primaryForeground} />
                  <Text style={[styles.actionText, { color: colors.primaryForeground }]}>
                    {a.label}
                  </Text>
                </>
              )}
            </Pressable>
          ))}
        </View>
      ) : null}

      {order.status === "delivered" ? (
        <View style={[styles.successBox, { backgroundColor: colors.success + "22", borderRadius: colors.radius }]}>
          <Feather name="check-circle" size={20} color={colors.success} />
          <Text style={[styles.successText, { color: colors.success }]}>
            Livraison terminée
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  headerBlock: { gap: 6 },
  reference: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    letterSpacing: 1,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 24, letterSpacing: -0.5 },
  statusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: { padding: 16, borderWidth: 1, gap: 10 },
  cardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowText: { fontFamily: "Inter_500Medium", fontSize: 14 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  itemQty: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: "hidden",
  },
  itemName: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14 },
  itemPrice: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  totalCard: { padding: 16, borderWidth: 1, gap: 8 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  totalValue: { fontFamily: "Inter_500Medium", fontSize: 14 },
  totalLabelStrong: { fontFamily: "Inter_700Bold", fontSize: 15 },
  totalValueStrong: { fontFamily: "Inter_700Bold", fontSize: 18 },
  actionBtn: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  actionText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
  },
  successText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
