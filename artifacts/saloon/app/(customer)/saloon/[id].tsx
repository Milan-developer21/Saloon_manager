import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SlotButton } from "@/components/SlotButton";
import { useApp, type SlotWithStatus } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
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

function formatDateLabel(dateStr: string, t: (k: any) => string) {
  const today = getDateStr(0);
  const tomorrow = getDateStr(1);
  if (dateStr === today) return t("today");
  if (dateStr === tomorrow) return t("tomorrow");
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export default function SaloonDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { saloons, getSaloonSlots, createBooking } = useApp();
  const { user } = useAuth();
  const { t } = useLanguage();

  const saloonId = parseInt(id ?? "0");
  const saloon = saloons.find((s) => s.id === saloonId);

  const [selectedDate, setSelectedDate] = useState(getDateStr(0));
  const [slots, setSlots] = useState<SlotWithStatus[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState("");
  const [customerName, setCustomerName] = useState(user?.name ?? "");
  const [customerPhone, setCustomerPhone] = useState(user?.phone ?? "");
  const [step, setStep] = useState<"browse" | "book">("browse");
  const [submitting, setSubmitting] = useState(false);

  const dateOptions = Array.from({ length: 7 }, (_, i) => getDateStr(i));
  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  const loadSlots = useCallback(async () => {
    if (!saloonId) return;
    setSlotsLoading(true);
    try {
      const data = await getSaloonSlots(saloonId, selectedDate);
      setSlots(data);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [saloonId, selectedDate]);

  useEffect(() => { loadSlots(); }, [selectedDate, saloonId]);

  const getSlotStatus = (slot: SlotWithStatus) => {
    if (slot.id === selectedSlotId) return "selected";
    return slot.status;
  };

  const handleBook = async () => {
    if (!customerName.trim()) { Alert.alert("", t("nameRequired")); return; }
    if (!customerPhone.trim()) { Alert.alert("", t("phoneRequired")); return; }
    if (!selectedService) { Alert.alert("", t("serviceRequired")); return; }
    if (!selectedSlotId || !selectedSlot) { Alert.alert("", t("slotRequired")); return; }

    setSubmitting(true);
    try {
      await createBooking({
        saloonId,
        slotId: selectedSlotId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        service: selectedService,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        t("bookingRequestSent"),
        t("awaitingConfirmation"),
        [{ text: t("ok"), onPress: () => { setStep("browse"); setSelectedSlotId(null); loadSlots(); } }]
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!saloon) {
    return (
      <View style={[{ flex: 1, backgroundColor: colors.background, padding: 20, paddingTop: topPad + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 20 }}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => { if (step === "book") setStep("browse"); else router.back(); }}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={[styles.openBadge, { backgroundColor: saloon.isOpen ? colors.greenBg : colors.redBg }]}>
          <View style={[styles.openDot, { backgroundColor: saloon.isOpen ? colors.green : colors.red }]} />
          <Text style={[styles.openText, { color: saloon.isOpen ? colors.green : colors.red }]}>
            {saloon.isOpen ? t("open") : t("closed")}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomPad + 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={step === "browse" ? <RefreshControl refreshing={slotsLoading} onRefresh={loadSlots} /> : undefined}
      >
        <View style={styles.saloonInfo}>
          <Text style={[styles.saloonName, { color: colors.foreground }]}>{saloon.name}</Text>
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={14} color={colors.mutedForeground} />
            <Text style={[styles.location, { color: colors.mutedForeground }]}>{saloon.address}, {saloon.city}</Text>
          </View>
          <View style={styles.locationRow}>
            <Feather name="clock" size={14} color={colors.mutedForeground} />
            <Text style={[styles.location, { color: colors.mutedForeground }]}>{saloon.openTime} – {saloon.closeTime}</Text>
          </View>
          <View style={styles.locationRow}>
            <Feather name="phone" size={14} color={colors.mutedForeground} />
            <Text style={[styles.location, { color: colors.mutedForeground }]}>{saloon.phone}</Text>
          </View>
          {saloon.description ? (
            <Text style={[styles.desc, { color: colors.mutedForeground }]}>{saloon.description}</Text>
          ) : null}

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t("services").toUpperCase()}</Text>
          <View style={styles.tags}>
            {saloon.services.map((s) => (
              <View key={s} style={[styles.tag, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {step === "browse" && (
          <View style={styles.slotsSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("availableSlots")}</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll} contentContainerStyle={styles.dateContent}>
              {dateOptions.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dateBtn, { backgroundColor: selectedDate === d ? colors.primary : colors.card, borderColor: selectedDate === d ? colors.primary : colors.border }]}
                  onPress={() => { setSelectedDate(d); setSelectedSlotId(null); }}
                >
                  <Text style={[styles.dateBtnText, { color: selectedDate === d ? "#FFF" : colors.foreground }]}>
                    {formatDateLabel(d, t)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {slotsLoading ? (
              <View style={styles.emptySlots}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : slots.length === 0 ? (
              <View style={styles.emptySlots}>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t("noSlotsAvailable")}</Text>
              </View>
            ) : (
              <>
                <View style={styles.slotGrid}>
                  {slots.map((slot) => (
                    <SlotButton
                      key={slot.id}
                      time={slot.time}
                      status={getSlotStatus(slot)}
                      onPress={() => {
                        if (slot.status === "available") {
                          setSelectedSlotId(slot.id === selectedSlotId ? null : slot.id);
                        }
                      }}
                    />
                  ))}
                </View>

                <View style={styles.legend}>
                  {[
                    { color: colors.card, label: "Available" },
                    { color: colors.primary, label: "Selected" },
                    { color: colors.yellowBg, label: "Pending" },
                    { color: colors.redBg, label: "Booked" },
                  ].map((item) => (
                    <View key={item.label} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: item.color, borderColor: colors.border, borderWidth: 1 }]} />
                      <Text style={[styles.legendText, { color: colors.mutedForeground }]}>{item.label}</Text>
                    </View>
                  ))}
                </View>

                {selectedSlotId && (
                  <TouchableOpacity
                    style={[styles.bookBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setStep("book")}
                  >
                    <Text style={styles.bookBtnText}>{t("bookSlot")} – {formatTime(selectedSlot?.time ?? "")}</Text>
                    <Feather name="arrow-right" size={18} color="#FFF" />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}

        {step === "book" && (
          <View style={[styles.bookForm, { paddingHorizontal: 20 }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("enterDetails")}</Text>

            <View style={[styles.summaryCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[styles.summaryTitle, { color: colors.primary }]}>{saloon.name}</Text>
              <Text style={[styles.summaryDetail, { color: colors.foreground }]}>
                {formatDateLabel(selectedDate, t)} · {formatTime(selectedSlot?.time ?? "")}
              </Text>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{t("selectService")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.serviceScroll}>
              {saloon.services.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.serviceChip, { backgroundColor: selectedService === s ? colors.primary : colors.card, borderColor: selectedService === s ? colors.primary : colors.border }]}
                  onPress={() => setSelectedService(s)}
                >
                  <Text style={[styles.serviceChipText, { color: selectedService === s ? "#FFF" : colors.foreground }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{t("yourName")} *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor={colors.mutedForeground}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{t("yourPhone")} *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="e.g. 98765-43210"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={[styles.bookBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
              onPress={handleBook}
              disabled={submitting}
            >
              <Feather name="check-circle" size={18} color="#FFF" />
              <Text style={styles.bookBtnText}>{submitting ? t("loading") : t("confirm")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12 },
  openBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  openDot: { width: 7, height: 7, borderRadius: 4 },
  openText: { fontSize: 12, fontWeight: "700" },
  scroll: { flex: 1 },
  saloonInfo: { paddingHorizontal: 20, paddingBottom: 4 },
  saloonName: { fontSize: 24, fontWeight: "900", marginBottom: 8 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  location: { fontSize: 13, flex: 1 },
  desc: { fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginTop: 12, marginBottom: 8 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  tagText: { fontSize: 12, fontWeight: "600" },
  slotsSection: { paddingHorizontal: 20, paddingTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 14 },
  dateScroll: { flexGrow: 0, marginBottom: 16 },
  dateContent: { gap: 8, paddingRight: 8 },
  dateBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  dateBtnText: { fontSize: 13, fontWeight: "700" },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  legend: { flexDirection: "row", gap: 12, marginBottom: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 10 },
  emptySlots: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 15 },
  bookBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, paddingVertical: 16, marginTop: 8, shadowColor: "#C0390B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  bookBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
  bookForm: { paddingTop: 16 },
  summaryCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 20 },
  summaryTitle: { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  summaryDetail: { fontSize: 13 },
  fieldLabel: { fontSize: 13, fontWeight: "600", marginBottom: 8, marginTop: 4 },
  serviceScroll: { gap: 8, paddingBottom: 16 },
  serviceChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  serviceChipText: { fontSize: 13, fontWeight: "600" },
  input: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 16 },
});
