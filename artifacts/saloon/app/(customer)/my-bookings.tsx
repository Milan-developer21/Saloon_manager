import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
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

export default function MyBookingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bookings, deviceId, cancelBooking } = useApp();
  const { t } = useLanguage();

  const myBookings = useMemo(() => {
    return bookings
      .filter((b) => b.deviceId === deviceId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bookings, deviceId]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, { color: colors.primary }]}>{t("myBookings")}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {myBookings.length} booking{myBookings.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {myBookings.length === 0 ? (
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
          myBookings.map((booking) => (
            <View key={booking.id}>
              <Text style={[styles.saloonLabel, { color: colors.mutedForeground }]}>{booking.saloonName}</Text>
              <BookingStatusCard
                booking={booking}
                showActions={false}
                onCancel={booking.status === "pending" ? () => cancelBooking(booking.id) : undefined}
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 8 },
  saloonLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 4, marginTop: 8, textTransform: "uppercase" },
  empty: { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginTop: 8 },
  emptySubtitle: { fontSize: 14 },
  browseBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, marginTop: 12 },
  browseBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
});
