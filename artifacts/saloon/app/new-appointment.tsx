import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00",
];

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function getDateString(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

function formatDateLabel(dateStr: string) {
  const today = getDateString(0);
  const tomorrow = getDateString(1);
  if (dateStr === today) return "Today";
  if (dateStr === tomorrow) return "Tomorrow";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function NewAppointmentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customers, services, addAppointment } = useApp();

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedDate, setSelectedDate] = useState(getDateString(0));
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"customer" | "service" | "datetime" | "review">("customer");

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const selectedService = services.find((s) => s.id === selectedServiceId);

  const DATE_OPTIONS = Array.from({ length: 14 }, (_, i) => getDateString(i));

  const handleSave = () => {
    if (!selectedCustomerId || !selectedServiceId) {
      Alert.alert("Missing Info", "Please select a customer and service.");
      return;
    }
    addAppointment({
      customerId: selectedCustomerId,
      customerName: selectedCustomer!.name,
      serviceId: selectedServiceId,
      serviceName: selectedService!.name,
      date: selectedDate,
      time: selectedTime,
      duration: selectedService!.duration,
      price: selectedService!.price,
      status: "scheduled",
      notes,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>New Appointment</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.steps}>
        {(["customer", "service", "datetime", "review"] as const).map((s, i) => (
          <View key={s} style={styles.stepRow}>
            <View
              style={[
                styles.stepDot,
                {
                  backgroundColor:
                    step === s ? colors.primary : ["customer", "service", "datetime", "review"].indexOf(step) > i ? colors.accent : colors.border,
                },
              ]}
            />
            {i < 3 && <View style={[styles.stepLine, { backgroundColor: colors.border }]} />}
          </View>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === "customer" && (
          <View>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Select Customer</Text>
            {customers.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.selectItem,
                  {
                    backgroundColor: selectedCustomerId === c.id ? colors.primary : colors.card,
                    borderColor: selectedCustomerId === c.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedCustomerId(c.id);
                  Haptics.selectionAsync();
                  setTimeout(() => setStep("service"), 200);
                }}
              >
                <Text
                  style={[
                    styles.selectItemText,
                    { color: selectedCustomerId === c.id ? "#FFF" : colors.foreground },
                  ]}
                >
                  {c.name}
                </Text>
                <Text
                  style={[
                    styles.selectItemSub,
                    { color: selectedCustomerId === c.id ? "rgba(255,255,255,0.7)" : colors.mutedForeground },
                  ]}
                >
                  {c.phone}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.linkBtn, { borderColor: colors.border }]}
              onPress={() => router.push("/new-customer")}
            >
              <Feather name="user-plus" size={16} color={colors.primary} />
              <Text style={[styles.linkBtnText, { color: colors.primary }]}>Add new customer</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === "service" && (
          <View>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Select Service</Text>
            {services.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.selectItem,
                  {
                    backgroundColor: selectedServiceId === s.id ? colors.primary : colors.card,
                    borderColor: selectedServiceId === s.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedServiceId(s.id);
                  Haptics.selectionAsync();
                  setTimeout(() => setStep("datetime"), 200);
                }}
              >
                <Text
                  style={[
                    styles.selectItemText,
                    { color: selectedServiceId === s.id ? "#FFF" : colors.foreground },
                  ]}
                >
                  {s.name}
                </Text>
                <Text
                  style={[
                    styles.selectItemSub,
                    { color: selectedServiceId === s.id ? "rgba(255,255,255,0.7)" : colors.mutedForeground },
                  ]}
                >
                  {s.duration} min · ${s.price}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === "datetime" && (
          <View>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Choose Date & Time</Text>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {DATE_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.dateChip,
                    {
                      backgroundColor: selectedDate === d ? colors.primary : colors.card,
                      borderColor: selectedDate === d ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    setSelectedDate(d);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text
                    style={[
                      styles.dateChipText,
                      { color: selectedDate === d ? "#FFF" : colors.foreground },
                    ]}
                  >
                    {formatDateLabel(d)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 16 }]}>Time</Text>
            <View style={styles.timeGrid}>
              {TIME_SLOTS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.timeChip,
                    {
                      backgroundColor: selectedTime === t ? colors.primary : colors.card,
                      borderColor: selectedTime === t ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    setSelectedTime(t);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text
                    style={[
                      styles.timeChipText,
                      { color: selectedTime === t ? "#FFF" : colors.foreground },
                    ]}
                  >
                    {formatTime(t)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                Haptics.selectionAsync();
                setStep("review");
              }}
            >
              <Text style={styles.nextBtnText}>Continue</Text>
              <Feather name="arrow-right" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        {step === "review" && (
          <View>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Review & Confirm</Text>
            <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ReviewRow label="Customer" value={selectedCustomer?.name ?? ""} colors={colors} />
              <ReviewRow label="Service" value={selectedService?.name ?? ""} colors={colors} />
              <ReviewRow label="Date" value={formatDateLabel(selectedDate)} colors={colors} />
              <ReviewRow label="Time" value={formatTime(selectedTime)} colors={colors} />
              <ReviewRow label="Duration" value={`${selectedService?.duration ?? 0} min`} colors={colors} />
              <ReviewRow label="Price" value={`$${selectedService?.price ?? 0}`} colors={colors} accent />
            </View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Notes (optional)</Text>
            <TextInput
              style={[
                styles.notesInput,
                { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
              ]}
              placeholder="Any special requests..."
              placeholderTextColor={colors.mutedForeground}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Feather name="check" size={18} color="#FFF" />
              <Text style={styles.nextBtnText}>Book Appointment</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {step !== "customer" && (
        <View style={[styles.backBar, { paddingBottom: bottomPad + 8, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              const steps = ["customer", "service", "datetime", "review"] as const;
              const idx = steps.indexOf(step);
              if (idx > 0) setStep(steps[idx - 1]);
            }}
          >
            <Feather name="arrow-left" size={18} color={colors.primary} />
            <Text style={[styles.backBtnText, { color: colors.primary }]}>Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function ReviewRow({
  label,
  value,
  colors,
  accent,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
  accent?: boolean;
}) {
  return (
    <View style={reviewStyles.row}>
      <Text style={[reviewStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[reviewStyles.value, { color: accent ? colors.accent : colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

const reviewStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E8D5BE",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  value: {
    fontSize: 14,
    fontWeight: "700",
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 18, fontWeight: "700" },
  steps: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    marginBottom: 12,
  },
  stepRow: { flexDirection: "row", alignItems: "center" },
  stepDot: { width: 10, height: 10, borderRadius: 5 },
  stepLine: { width: 40, height: 2, marginHorizontal: 4 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  stepTitle: { fontSize: 20, fontWeight: "800", marginBottom: 16 },
  selectItem: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  selectItemText: { fontSize: 15, fontWeight: "700" },
  selectItemSub: { fontSize: 13, marginTop: 2 },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
  },
  linkBtnText: { fontSize: 14, fontWeight: "600" },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  dateScroll: { flexGrow: 0, marginBottom: 4 },
  dateChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  dateChipText: { fontSize: 13, fontWeight: "600" },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  timeChipText: { fontSize: 13, fontWeight: "500" },
  reviewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  notesInput: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: "#8B1A1A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  backBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  backBtnText: { fontSize: 15, fontWeight: "600" },
});
