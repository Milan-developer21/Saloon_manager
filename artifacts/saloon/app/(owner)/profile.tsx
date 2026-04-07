import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
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
import { useRouter } from "expo-router";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

const DURATION_OPTIONS = [15, 20, 30, 45, 60];

const TIME_OPTIONS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
  "09:00", "09:30", "10:00", "10:30", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00",
  "17:00", "18:00", "19:00", "20:00", "21:00", "22:00",
];

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { mySaloon, registerSaloon, updateSaloon } = useApp();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const router = useRouter();

  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("20:00");
  const [slotDuration, setSlotDuration] = useState(30);
  const [services, setServices] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mySaloon) {
      setName(mySaloon.name);
      setOwnerName(mySaloon.ownerName);
      setPhone(mySaloon.phone);
      setAddress(mySaloon.address);
      setCity(mySaloon.city);
      setDescription(mySaloon.description || "");
      setOpenTime(mySaloon.openTime);
      setCloseTime(mySaloon.closeTime);
      setSlotDuration(mySaloon.slotDuration);
      setServices(mySaloon.services);
    } else if (user) {
      setOwnerName(user.name);
      setPhone(user.phone);
    }
  }, [mySaloon, user]);

  const addService = () => {
    const s = serviceInput.trim();
    if (s && !services.includes(s)) {
      setServices([...services, s]);
      setServiceInput("");
    }
  };

  const removeService = (s: string) => {
    setServices(services.filter((sv) => sv !== s));
  };

  const handleSave = async () => {
    if (!name.trim() || !ownerName.trim() || !phone.trim() || !city.trim()) {
      Alert.alert("", "Please fill all required fields");
      return;
    }
    if (services.length === 0) {
      Alert.alert("", "Please add at least one service");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        description: description.trim(),
        services,
        openTime,
        closeTime,
        slotDuration,
      };
      if (mySaloon) {
        await updateSaloon(mySaloon.id, payload);
      } else {
        await registerSaloon(payload);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("", mySaloon ? t("update") + " successful" : t("shopRegistered"), [{ text: t("ok") }]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const isRegistered = !!mySaloon;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: bottomPad + 40 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {isRegistered ? t("editShop") : t("registerShop")}
        </Text>
        <TouchableOpacity onPress={handleLogout}>
          <View style={styles.logoutRow}>
            <Feather name="log-out" size={16} color={colors.mutedForeground} />
            <Text style={[styles.logoutText, { color: colors.mutedForeground }]}>Logout</Text>
          </View>
        </TouchableOpacity>
      </View>

      {user && (
        <View style={[styles.userCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="user" size={16} color={colors.accent} />
          <Text style={[styles.userText, { color: colors.foreground }]}>{user.name} · {user.phone}</Text>
        </View>
      )}

      <Field label={`${t("shopName")} *`} value={name} onChange={setName} placeholder="e.g. Sharma Hair Studio" colors={colors} />
      <Field label={`${t("ownerName")} *`} value={ownerName} onChange={setOwnerName} placeholder="e.g. Ramesh Sharma" colors={colors} />
      <Field label={`${t("phone")} *`} value={phone} onChange={setPhone} placeholder="98765-43210" keyboardType="phone-pad" colors={colors} />
      <Field label={`${t("city")} *`} value={city} onChange={setCity} placeholder="e.g. Delhi" colors={colors} />
      <Field label={t("address")} value={address} onChange={setAddress} placeholder="e.g. 12, Main Bazaar Road" colors={colors} />
      <Field label={t("description")} value={description} onChange={setDescription} placeholder="Tell customers about your shop..." multiline colors={colors} />

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t("openTime").toUpperCase()}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeRow}>
        {TIME_OPTIONS.map((t_) => (
          <TouchableOpacity
            key={t_}
            style={[styles.timeChip, { backgroundColor: openTime === t_ ? colors.accent : colors.card, borderColor: openTime === t_ ? colors.accent : colors.border }]}
            onPress={() => setOpenTime(t_)}
          >
            <Text style={{ color: openTime === t_ ? "#FFF" : colors.foreground, fontWeight: "600", fontSize: 12 }}>{formatTime(t_)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t("closeTime").toUpperCase()}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeRow}>
        {TIME_OPTIONS.map((t_) => (
          <TouchableOpacity
            key={t_}
            style={[styles.timeChip, { backgroundColor: closeTime === t_ ? colors.accent : colors.card, borderColor: closeTime === t_ ? colors.accent : colors.border }]}
            onPress={() => setCloseTime(t_)}
          >
            <Text style={{ color: closeTime === t_ ? "#FFF" : colors.foreground, fontWeight: "600", fontSize: 12 }}>{formatTime(t_)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t("slotDuration").toUpperCase()}</Text>
      <View style={styles.durationRow}>
        {DURATION_OPTIONS.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.durationChip, { backgroundColor: slotDuration === d ? colors.accent : colors.card, borderColor: slotDuration === d ? colors.accent : colors.border }]}
            onPress={() => setSlotDuration(d)}
          >
            <Text style={{ color: slotDuration === d ? "#FFF" : colors.foreground, fontWeight: "700", fontSize: 14 }}>{d} {t("min")}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t("servicesOffered").toUpperCase()}</Text>
      <View style={styles.serviceInputRow}>
        <TextInput
          style={[styles.serviceInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, flex: 1 }]}
          value={serviceInput}
          onChangeText={setServiceInput}
          placeholder={t("addService")}
          placeholderTextColor={colors.mutedForeground}
          onSubmitEditing={addService}
          returnKeyType="done"
        />
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.accent }]} onPress={addService}>
          <Feather name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
      <View style={styles.servicesList}>
        {services.map((s) => (
          <View key={s} style={[styles.serviceTag, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Text style={[styles.serviceTagText, { color: colors.primary }]}>{s}</Text>
            <TouchableOpacity onPress={() => removeService(s)}>
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: colors.accent, opacity: saving ? 0.7 : 1 }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Feather name="check" size={18} color="#FFF" />
        <Text style={styles.saveBtnText}>{saving ? t("loading") : (isRegistered ? t("update") : t("register"))}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, value, onChange, placeholder, keyboardType, multiline, colors }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  keyboardType?: any;
  multiline?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={fieldStyles.container}>
      <Text style={[fieldStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[fieldStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }, multiline && fieldStyles.multiline]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  container: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  multiline: { minHeight: 80, paddingTop: 12 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "900" },
  logoutRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  logoutText: { fontSize: 13 },
  userCard: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16 },
  userText: { fontSize: 13, fontWeight: "600" },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 10, marginTop: 6 },
  timeRow: { gap: 8, paddingBottom: 16 },
  timeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  durationRow: { flexDirection: "row", gap: 10, marginBottom: 16, flexWrap: "wrap" },
  durationChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  serviceInputRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  serviceInput: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  addBtn: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  servicesList: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  serviceTag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  serviceTagText: { fontSize: 13, fontWeight: "600" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, paddingVertical: 16, marginTop: 8, shadowColor: "#E67E22", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  saveBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
});
