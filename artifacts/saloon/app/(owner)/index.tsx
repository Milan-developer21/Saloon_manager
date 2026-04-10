import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookingStatusCard } from "@/components/BookingStatusCard";
import { useApp, type Booking } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { getLocalDateString } from "@/lib/date";

export default function OwnerDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mySaloon, loadMySaloon, getSaloonBookings, respondToBooking, toggleSaloonOpen } = useApp();
  const { logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);

  const today = getLocalDateString();

  const loadBookings = useCallback(async () => {
    if (!mySaloon) return;
    try {
      const data = await getSaloonBookings();
      setBookings(data);
    } catch {}
  }, [mySaloon?.id, getSaloonBookings]);

  useEffect(() => {
    loadMySaloon();
  }, []);

  useEffect(() => {
    if (mySaloon) {
      setLoadingBookings(true);
      loadBookings().finally(() => setLoadingBookings(false));
    }
  }, [mySaloon?.id]);

  // Poll every 10 s for live booking updates
  useEffect(() => {
    const id = setInterval(() => { loadBookings(); }, 10_000);
    return () => clearInterval(id);
  }, [loadBookings]);

  // Refresh when app returns to foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") { loadMySaloon(); loadBookings(); }
    });
    return () => sub.remove();
  }, [loadMySaloon, loadBookings]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMySaloon();
    await loadBookings();
    setRefreshing(false);
  };

  const pending = useMemo(() => bookings.filter((b) => b.status === "pending"), [bookings]);
  const todayAccepted = useMemo(() => bookings.filter((b) => b.slot?.date === today && b.status === "accepted"), [bookings, today]);
  const totalAccepted = useMemo(() => bookings.filter((b) => b.status === "accepted").length, [bookings]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleRespond = async (bookingId: number, status: "accepted" | "rejected") => {
    try {
      await respondToBooking(bookingId, status);
      setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status } : b));
    } catch {}
  };

  const handleToggleOpen = async () => {
    if (!mySaloon || toggling) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setToggling(true);
    try {
      await toggleSaloonOpen(mySaloon.id);
    } finally {
      setToggling(false);
    }
  };

  if (!mySaloon) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad + 20, paddingBottom: bottomPad }]}>
        <View style={styles.notRegistered}>
          <View style={[styles.notRegIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="briefcase" size={40} color={colors.accent} />
          </View>
          <Text style={[styles.notRegTitle, { color: colors.foreground }]}>{t("notRegistered")}</Text>
          <TouchableOpacity
            style={[styles.regBtn, { backgroundColor: colors.accent }]}
            onPress={() => router.push("/(owner)/profile")}
          >
            <Text style={styles.regBtnText}>{t("registerNow")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.switchRoleBtn} onPress={() => logout()}>
            <Text style={[styles.switchRoleText, { color: colors.mutedForeground }]}>{t("logout")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: bottomPad + 80 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.shopName, { color: colors.foreground }]}>{mySaloon.name}</Text>
          <Text style={[styles.ownerName, { color: colors.mutedForeground }]}>{mySaloon.ownerName}</Text>
        </View>
        <View style={styles.topRight}>
          <View style={styles.langRow}>
            <TouchableOpacity
              style={[styles.langBtn, { backgroundColor: language === "en" ? colors.accent : colors.secondary }]}
              onPress={() => setLanguage("en")}
            >
              <Text style={{ color: language === "en" ? "#FFF" : colors.foreground, fontWeight: "700", fontSize: 11 }}>EN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, { backgroundColor: language === "hi" ? colors.accent : colors.secondary }]}
              onPress={() => setLanguage("hi")}
            >
              <Text style={{ color: language === "hi" ? "#FFF" : colors.foreground, fontWeight: "700", fontSize: 11 }}>हि</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => logout()}>
            <Feather name="log-out" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.openCard, { backgroundColor: mySaloon.isOpen ? colors.greenBg : colors.secondary, borderColor: mySaloon.isOpen ? colors.green : colors.border }]}>
        <View>
          <Text style={[styles.openLabel, { color: mySaloon.isOpen ? colors.green : colors.mutedForeground }]}>
            {mySaloon.isOpen ? t("shopCurrentlyOpen") : t("shopCurrentlyClosed")}
          </Text>
          <Text style={[styles.openSub, { color: colors.mutedForeground }]}>{mySaloon.openTime} – {mySaloon.closeTime}</Text>
        </View>
        <Switch
          value={mySaloon.isOpen}
          onValueChange={handleToggleOpen}
          disabled={toggling}
          trackColor={{ false: colors.border, true: colors.green }}
          thumbColor="#FFF"
        />
      </View>

      <View style={styles.statsRow}>
        {[
          { value: pending.length, label: t("pendingRequests"), color: colors.yellow },
          { value: todayAccepted.length, label: t("todayBookings"), color: colors.accent },
          { value: totalAccepted, label: t("totalBookings"), color: colors.primary },
        ].map((s, i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {loadingBookings ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
      ) : (
        <>
          {pending.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("pendingRequests")}</Text>
                <View style={[styles.badge, { backgroundColor: colors.yellowBg }]}>
                  <Text style={[styles.badgeText, { color: colors.yellow }]}>{pending.length}</Text>
                </View>
              </View>
              {pending.slice(0, 3).map((b) => (
                <BookingStatusCard
                  key={b.id}
                  booking={b}
                  showActions
                  onAccept={() => handleRespond(b.id, "accepted")}
                  onReject={() => handleRespond(b.id, "rejected")}
                />
              ))}
              {pending.length > 3 && (
                <TouchableOpacity onPress={() => router.push("/(owner)/requests")}>
                  <Text style={[styles.seeAll, { color: colors.accent }]}>See all {pending.length} requests</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {todayAccepted.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("todayBookings")}</Text>
              {todayAccepted.map((b) => (
                <BookingStatusCard key={b.id} booking={b} showActions={false} />
              ))}
            </View>
          )}

          {pending.length === 0 && todayAccepted.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="inbox" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t("noTodayBookings")}</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  shopName: { fontSize: 22, fontWeight: "900" },
  ownerName: { fontSize: 13, marginTop: 2 },
  topRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  langRow: { flexDirection: "row", gap: 6 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16 },
  openCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 18, borderWidth: 1.5, padding: 18, marginBottom: 20 },
  openLabel: { fontSize: 15, fontWeight: "700" },
  openSub: { fontSize: 12, marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 14, alignItems: "center" },
  statValue: { fontSize: 26, fontWeight: "800" },
  statLabel: { fontSize: 10, fontWeight: "600", textAlign: "center", marginTop: 2 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "800" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  seeAll: { fontSize: 14, fontWeight: "600", textAlign: "center", marginTop: 4 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
  notRegistered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 16 },
  notRegIcon: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  notRegTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  regBtn: { paddingHorizontal: 30, paddingVertical: 14, borderRadius: 20 },
  regBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  switchRoleBtn: { marginTop: 8 },
  switchRoleText: { fontSize: 13 },
});
