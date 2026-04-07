import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookingStatusCard } from "@/components/BookingStatusCard";
import { useApp, type Booking } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

type Filter = "all" | "pending" | "accepted" | "rejected";
const FILTERS: Filter[] = ["all", "pending", "accepted", "rejected"];

export default function RequestsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { mySaloon, getSaloonBookings, respondToBooking } = useApp();
  const { t } = useLanguage();
  const [filter, setFilter] = useState<Filter>("pending");
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!mySaloon) return;
    try {
      const data = await getSaloonBookings();
      setAllBookings(data);
    } catch {}
  }, [mySaloon, getSaloonBookings]);

  useEffect(() => { load().finally(() => setLoading(false)); }, [mySaloon?.id]);

  const handleRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleRespond = async (bookingId: number, status: "accepted" | "rejected") => {
    try {
      await respondToBooking(bookingId, status);
      setAllBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status } : b));
    } catch {}
  };

  const myBookings = useMemo(() => {
    return allBookings
      .filter((b) => filter === "all" || b.status === filter)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allBookings, filter]);

  const pendingCount = useMemo(() => allBookings.filter((b) => b.status === "pending").length, [allBookings]);

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

      {!mySaloon ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t("notRegistered")}</Text>
        </View>
      ) : loading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {myBookings.length === 0 ? (
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
                onAccept={b.status === "pending" ? () => handleRespond(b.id, "accepted") : undefined}
                onReject={b.status === "pending" ? () => handleRespond(b.id, "rejected") : undefined}
              />
            ))
          )}
        </ScrollView>
      )}
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
