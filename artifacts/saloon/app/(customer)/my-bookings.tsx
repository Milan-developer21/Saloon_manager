import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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

export default function MyBookingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getMyBookings, cancelBooking } = useApp();
  const { t } = useLanguage();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const load = useCallback(async () => {
    try {
      const data = await getMyBookings();
      setBookings(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch {}
  }, [getMyBookings]);

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const handleRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleCancel = async (id: number) => {
    try {
      await cancelBooking(id);
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "cancelled" } : b));
    } catch {}
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, { color: colors.primary }]}>{t("myBookings")}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {bookings.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="calendar" size={44} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t("noDataYet")}</Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                Browse saloons to book a slot
              </Text>
              <TouchableOpacity
                style={[styles.browseBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/(customer)")}
              >
                <Text style={styles.browseBtnText}>{t("browseSaloons")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            bookings.map((booking) => (
              <BookingStatusCard
                key={booking.id}
                booking={booking}
                showActions={false}
                onCancel={booking.status === "pending" ? () => handleCancel(booking.id) : undefined}
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
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  loadingBox: { flex: 1, alignItems: "center", paddingTop: 80 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 8 },
  empty: { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginTop: 8 },
  emptySubtitle: { fontSize: 14 },
  browseBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, marginTop: 12 },
  browseBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
});
