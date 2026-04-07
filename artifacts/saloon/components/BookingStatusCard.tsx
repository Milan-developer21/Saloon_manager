import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";
import { Booking } from "@/context/AppContext";

interface Props {
  booking: Booking;
  showActions?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
}

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function BookingStatusCard({ booking, showActions, onAccept, onReject, onCancel }: Props) {
  const colors = useColors();
  const { t } = useLanguage();

  const getStatusStyle = () => {
    switch (booking.status) {
      case "accepted": return { bg: colors.greenBg, text: colors.green, label: t("accepted") };
      case "rejected": return { bg: colors.redBg, text: colors.red, label: t("rejected") };
      case "pending": return { bg: colors.yellowBg, text: colors.yellow, label: t("pending") };
      case "completed": return { bg: colors.secondary, text: colors.primary, label: t("completedStatus") };
      case "cancelled": return { bg: colors.muted, text: colors.mutedForeground, label: t("cancelled") };
    }
  };

  const ss = getStatusStyle();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={[styles.customerName, { color: colors.foreground }]}>{booking.customerName}</Text>
          <Text style={[styles.detail, { color: colors.mutedForeground }]}>
            {booking.service} · {formatTime(booking.time)} · {booking.date}
          </Text>
          {booking.customerPhone ? (
            <Text style={[styles.phone, { color: colors.mutedForeground }]}>{booking.customerPhone}</Text>
          ) : null}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: ss.bg }]}>
          <Text style={[styles.statusText, { color: ss.text }]}>{ss.label}</Text>
        </View>
      </View>

      {showActions && booking.status === "pending" && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.greenBg, borderColor: colors.green }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onAccept?.(); }}
          >
            <Feather name="check" size={16} color={colors.green} />
            <Text style={[styles.btnText, { color: colors.green }]}>{t("accept")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.redBg, borderColor: colors.red }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onReject?.(); }}
          >
            <Feather name="x" size={16} color={colors.red} />
            <Text style={[styles.btnText, { color: colors.red }]}>{t("reject")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {!showActions && booking.status === "pending" && onCancel && (
        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: colors.border }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onCancel(); }}
        >
          <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>{t("cancel")}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  left: { flex: 1, marginRight: 12 },
  customerName: { fontSize: 15, fontWeight: "700", marginBottom: 3 },
  detail: { fontSize: 13, marginBottom: 2 },
  phone: { fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
  },
  btnText: { fontSize: 14, fontWeight: "700" },
  cancelBtn: {
    marginTop: 10,
    borderTopWidth: 1,
    paddingTop: 10,
    alignItems: "center",
  },
  cancelText: { fontSize: 13, fontWeight: "600" },
});
