import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
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
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function getDateStr(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

function formatDateLabel(dateStr: string) {
  const today = getDateStr(0);
  const tomorrow = getDateStr(1);
  if (dateStr === today) return "Today";
  if (dateStr === tomorrow) return "Tomorrow";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export default function SlotsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { mySaloon, getSaloonSlots, toggleSlotBlock, generateSlots, isSlotBooked, getBookingsForSlot } = useApp();
  const { t } = useLanguage();

  const [selectedDate, setSelectedDate] = useState(getDateStr(0));

  const dateOptions = Array.from({ length: 7 }, (_, i) => getDateStr(i));
  const slots = useMemo(() => {
    if (!mySaloon) return [];
    return getSaloonSlots(mySaloon.id, selectedDate);
  }, [mySaloon, selectedDate, getSaloonSlots]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleGenerate = () => {
    if (!mySaloon) return;
    Alert.alert(t("generateSlots"), t("slotsGenerated"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("ok"),
        onPress: () => {
          generateSlots(mySaloon.id, mySaloon.openTime, mySaloon.closeTime, mySaloon.slotDuration);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const getSlotStatus = (slot: any) => {
    if (isSlotBooked(slot.id)) return "booked";
    const bookingsForSlot = getBookingsForSlot(slot.id);
    if (bookingsForSlot.some((b: any) => b.status === "pending")) return "pending";
    if (slot.isBlocked) return "blocked";
    return "available";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "booked": return { bg: colors.redBg, text: colors.red };
      case "pending": return { bg: colors.yellowBg, text: colors.yellow };
      case "blocked": return { bg: colors.muted, text: colors.mutedForeground };
      default: return { bg: colors.greenBg, text: colors.green };
    }
  };

  if (!mySaloon) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad + 20 }]}>
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t("notRegistered")}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t("manageSlots")}</Text>
        <TouchableOpacity
          style={[styles.genBtn, { backgroundColor: colors.accent }]}
          onPress={handleGenerate}
        >
          <Feather name="refresh-cw" size={14} color="#FFF" />
          <Text style={styles.genBtnText}>{t("generateSlots")}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll} contentContainerStyle={styles.dateContent}>
        {dateOptions.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.dateBtn, { backgroundColor: selectedDate === d ? colors.accent : colors.card, borderColor: selectedDate === d ? colors.accent : colors.border }]}
            onPress={() => setSelectedDate(d)}
          >
            <Text style={[styles.dateBtnText, { color: selectedDate === d ? "#FFF" : colors.foreground }]}>
              {formatDateLabel(d)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomPad + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {slots.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="calendar" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t("noSlotsAvailable")}</Text>
            <TouchableOpacity
              style={[styles.genBtnLarge, { backgroundColor: colors.accent }]}
              onPress={handleGenerate}
            >
              <Text style={styles.genBtnText}>{t("generateSlots")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.legend}>
              {[
                { color: colors.greenBg, textColor: colors.green, label: "Available" },
                { color: colors.yellowBg, textColor: colors.yellow, label: "Pending" },
                { color: colors.redBg, textColor: colors.red, label: "Booked" },
                { color: colors.muted, textColor: colors.mutedForeground, label: "Blocked" },
              ].map((item) => (
                <View key={item.label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendText, { color: colors.mutedForeground }]}>{item.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.slotGrid}>
              {slots.map((slot) => {
                const status = getSlotStatus(slot);
                const sc = getStatusColor(status);
                const canToggle = status === "available" || status === "blocked";

                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={[styles.slotBtn, { backgroundColor: sc.bg, borderColor: sc.text }]}
                    onPress={() => {
                      if (canToggle) {
                        Haptics.selectionAsync();
                        toggleSlotBlock(slot.id);
                      }
                    }}
                    activeOpacity={canToggle ? 0.8 : 1}
                  >
                    <Text style={[styles.slotTime, { color: sc.text }]}>{formatTime(slot.time)}</Text>
                    {status === "blocked" && <Feather name="lock" size={10} color={sc.text} />}
                    {status === "booked" && <Feather name="check-circle" size={10} color={sc.text} />}
                    {status === "pending" && <Feather name="clock" size={10} color={sc.text} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              Tap available slots to block/unblock them
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: "900" },
  genBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  genBtnText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
  genBtnLarge: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  dateScroll: { flexGrow: 0 },
  dateContent: { gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
  dateBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  dateBtnText: { fontSize: 13, fontWeight: "700" },
  list: { flex: 1 },
  legend: { flexDirection: "row", gap: 12, marginBottom: 16, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11 },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  slotBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5, flexDirection: "row", alignItems: "center", gap: 4 },
  slotTime: { fontSize: 13, fontWeight: "700" },
  hint: { fontSize: 12, textAlign: "center", marginTop: 8 },
  empty: { alignItems: "center", paddingTop: 60, gap: 14 },
  emptyText: { fontSize: 15 },
});
