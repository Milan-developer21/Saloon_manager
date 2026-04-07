import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppointmentCard } from "@/components/AppointmentCard";
import { StatsCard } from "@/components/StatsCard";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { appointments, updateAppointment } = useApp();
  const [refreshing, setRefreshing] = React.useState(false);

  const today = new Date().toISOString().split("T")[0];

  const todaysAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date === today)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, today]);

  const stats = useMemo(() => {
    const todayTotal = todaysAppointments.reduce(
      (sum, a) => (a.status === "completed" ? sum + a.price : sum),
      0
    );
    const scheduled = todaysAppointments.filter((a) => a.status === "scheduled").length;
    const completed = todaysAppointments.filter((a) => a.status === "completed").length;
    return { todayTotal, scheduled, completed, total: todaysAppointments.length };
  }, [todaysAppointments]);

  const formatDate = () => {
    const d = new Date();
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPad + 20,
          paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20,
        },
      ]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Welcome back</Text>
          <Text style={[styles.shopName, { color: colors.primary }]}>The Saloon</Text>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>{formatDate()}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/new-appointment")}
        >
          <Feather name="plus" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <StatsCard
          label="Today's Revenue"
          value={`$${stats.todayTotal}`}
          subtitle="completed"
          accentColor={colors.accent}
        />
        <View style={styles.statsGap} />
        <StatsCard
          label="Appointments"
          value={stats.total}
          subtitle={`${stats.scheduled} pending`}
        />
        <View style={styles.statsGap} />
        <StatsCard
          label="Completed"
          value={stats.completed}
          subtitle="today"
          accentColor="#16A34A"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today's Schedule</Text>
          <TouchableOpacity onPress={() => router.push("/appointments")}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>

        {todaysAppointments.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="calendar" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No appointments today
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/new-appointment")}
            >
              <Text style={styles.emptyBtnText}>Book appointment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          todaysAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onPress={() => router.push({ pathname: "/appointment/[id]", params: { id: appointment.id } })}
              onStatusChange={(status) => updateAppointment(appointment.id, { status })}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    fontWeight: "500",
  },
  shopName: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 13,
    marginTop: 2,
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8B1A1A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 28,
  },
  statsGap: {
    width: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "500",
  },
  emptyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
  emptyBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
});
