import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { Appointment } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const STATUS_CONFIG = {
  scheduled: { label: "Scheduled", color: "#2563EB", bg: "#EFF6FF" },
  completed: { label: "Completed", color: "#16A34A", bg: "#F0FDF4" },
  cancelled: { label: "Cancelled", color: "#DC2626", bg: "#FEF2F2" },
  "no-show": { label: "No Show", color: "#D97706", bg: "#FFFBEB" },
};

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AppointmentDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appointments, updateAppointment, deleteAppointment } = useApp();

  const appointment = appointments.find((a) => a.id === id);

  if (!appointment) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground, padding: 20 }}>Appointment not found</Text>
      </View>
    );
  }

  const statusConfig = STATUS_CONFIG[appointment.status];
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleStatusChange = (status: Appointment["status"]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateAppointment(id, { status });
  };

  const handleDelete = () => {
    Alert.alert("Delete Appointment", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteAppointment(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: bottomPad + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <Feather name="trash-2" size={22} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.customerName, { color: colors.foreground }]}>
              {appointment.customerName}
            </Text>
            <Text style={[styles.serviceName, { color: colors.mutedForeground }]}>
              {appointment.serviceName}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.details}>
          <DetailRow icon="calendar" label="Date" value={formatDate(appointment.date)} colors={colors} />
          <DetailRow icon="clock" label="Time" value={formatTime(appointment.time)} colors={colors} />
          <DetailRow icon="watch" label="Duration" value={`${appointment.duration} minutes`} colors={colors} />
          <DetailRow icon="dollar-sign" label="Price" value={`$${appointment.price}`} colors={colors} accent />
          {appointment.notes ? (
            <DetailRow icon="message-circle" label="Notes" value={appointment.notes} colors={colors} />
          ) : null}
        </View>
      </View>

      {appointment.status === "scheduled" && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#F0FDF4", borderColor: "#16A34A" }]}
            onPress={() => handleStatusChange("completed")}
          >
            <Feather name="check-circle" size={20} color="#16A34A" />
            <Text style={[styles.actionText, { color: "#16A34A" }]}>Mark Complete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#FFFBEB", borderColor: "#D97706" }]}
            onPress={() => handleStatusChange("no-show")}
          >
            <Feather name="user-x" size={20} color="#D97706" />
            <Text style={[styles.actionText, { color: "#D97706" }]}>No Show</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#FEF2F2", borderColor: "#DC2626" }]}
            onPress={() => handleStatusChange("cancelled")}
          >
            <Feather name="x-circle" size={20} color="#DC2626" />
            <Text style={[styles.actionText, { color: "#DC2626" }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function DetailRow({
  icon,
  label,
  value,
  colors,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
  accent?: boolean;
}) {
  return (
    <View style={detailStyles.row}>
      <Feather name={icon as any} size={16} color={colors.mutedForeground} />
      <Text style={[detailStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[detailStyles.value, { color: accent ? colors.accent : colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: "700",
    maxWidth: "60%",
    textAlign: "right",
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  customerName: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 15,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  details: {},
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
});
