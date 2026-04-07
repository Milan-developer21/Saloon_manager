import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookingStatusCard } from "@/components/BookingStatusCard";
import { useApp } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

type Filter = "all" | "pending" | "accepted" | "rejected";

const FILTERS: Filter[] = ["all", "pending", "accepted", "rejected"];

export default function RequestsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { mySaloon, bookings, respondToBooking } = useApp();
  const { t } = useLanguage();
  const [filter, setFilter] = useState<Filter>("pending");

  const myBookings = useMemo(() => {
    if (!mySaloon) return [];
    return bookings
      .filter((b) => b.saloonId === mySaloon.id && (filter === "all" || b.status === filter))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bookings, mySaloon, filter]);

  const pendingCount = useMemo(() => {
    if (!mySaloon) return 0;
    return bookings.filter((b) => b.saloonId === mySaloon.id && b.status === "pending").length;
  }, [bookings, mySaloon]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const getFilterLabel = (f: Filter) => {
    if (f === "all") return "All";
    if (f === "pending") return t("pending");
    if (f === "accepted") return t("accepted");
    if (f === "rejected") return t("rejected");
    return f;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>{t("bookingRequests")}</Text>
          {pendingCount > 0 && (
            <View style={[styles.pendingBadge, { backgroundColor: colors.yellowBg }]}>
              <Text style={[styles.pendingBadgeText, { color: colors.yellow }]}>{pendingCount}</Text>
            </View>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, { backgroundColor: filter === f ? colors.accent : colors.card, borderColor: filter === f ? colors.accent : colors.border }]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.chipText, { color: filter === f ? "#FFF" : colors.mutedForeground }]}>{getFilterLabel(f)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!mySaloon ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t("notRegistered")}</Text>
          </View>
        ) : myBookings.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="inbox" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t("noRequests")}</Text>
          </View>
        ) : (
          myBookings.map((b) => (
            <BookingStatusCard
              key={b.id}
              booking={b}
              showActions
              onAccept={b.status === "pending" ? () => respondToBooking(b.id, "accepted") : undefined}
              onReject={b.status === "pending" ? () => respondToBooking(b.id, "rejected") : undefined}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "900" },
  pendingBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  pendingBadgeText: { fontSize: 13, fontWeight: "700" },
  filters: { gap: 8, paddingBottom: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: "600" },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 4 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
});
