import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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

const AVATAR_COLORS = [
  "#8B1A1A", "#C4822A", "#1A5C8B", "#2D8B3A", "#6B1A8B", "#8B5A1A",
];

function getAvatarColor(name: string) {
  const sum = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export default function CustomerDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { customers, appointments, updateCustomer, deleteCustomer } = useApp();

  const customer = customers.find((c) => c.id === id);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [notesVal, setNotesVal] = useState(customer?.notes ?? "");

  const customerAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.customerId === id)
      .sort((a, b) => b.date.localeCompare(a.date) || a.time.localeCompare(b.time));
  }, [appointments, id]);

  const totalSpent = useMemo(() => {
    return customerAppointments
      .filter((a) => a.status === "completed")
      .reduce((sum, a) => sum + a.price, 0);
  }, [customerAppointments]);

  if (!customer) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground, padding: 20 }}>Customer not found</Text>
      </View>
    );
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const avatarColor = getAvatarColor(customer.name);

  const handleSave = () => {
    updateCustomer(id, { name, phone, email, notes: notesVal });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditing(false);
  };

  const handleDelete = () => {
    Alert.alert("Delete Customer", `Remove ${customer.name}? This won't delete their appointments.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteCustomer(id);
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
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          {editing ? (
            <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity onPress={() => setEditing(true)} style={styles.iconBtn}>
                <Feather name="edit-2" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
                <Feather name="trash-2" size={20} color={colors.destructive} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <View style={styles.profileSection}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.initials}>{getInitials(customer.name)}</Text>
        </View>
        {editing ? (
          <TextInput
            style={[styles.nameInput, { color: colors.foreground, borderBottomColor: colors.primary }]}
            value={name}
            onChangeText={setName}
            fontSize={22}
            fontWeight="800"
          />
        ) : (
          <Text style={[styles.customerName, { color: colors.foreground }]}>{customer.name}</Text>
        )}
        <Text style={[styles.memberSince, { color: colors.mutedForeground }]}>
          Member since {formatDate(customer.createdAt)}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{customer.totalVisits}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Visits</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.accent }]}>${totalSpent}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Spent</Text>
        </View>
      </View>

      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <InfoField
          icon="phone"
          label="Phone"
          value={phone}
          editing={editing}
          onChange={setPhone}
          colors={colors}
          keyboardType="phone-pad"
        />
        <InfoField
          icon="mail"
          label="Email"
          value={email}
          editing={editing}
          onChange={setEmail}
          colors={colors}
          keyboardType="email-address"
        />
        <InfoField
          icon="message-circle"
          label="Notes"
          value={notesVal}
          editing={editing}
          onChange={setNotesVal}
          colors={colors}
          multiline
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Visit History</Text>
          <TouchableOpacity
            onPress={() => router.push({ pathname: "/new-appointment", params: { customerId: id } })}
          >
            <Text style={[styles.bookBtn, { color: colors.primary }]}>+ Book</Text>
          </TouchableOpacity>
        </View>
        {customerAppointments.length === 0 ? (
          <Text style={[styles.emptyHistory, { color: colors.mutedForeground }]}>
            No appointments yet
          </Text>
        ) : (
          customerAppointments.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={[styles.historyItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: "/appointment/[id]", params: { id: a.id } })}
            >
              <View>
                <Text style={[styles.historyService, { color: colors.foreground }]}>{a.serviceName}</Text>
                <Text style={[styles.historyDate, { color: colors.mutedForeground }]}>
                  {formatDate(a.date)} at {formatTime(a.time)}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.historyPrice, { color: colors.accent }]}>${a.price}</Text>
                <Text style={[styles.historyStatus, {
                  color: a.status === "completed" ? "#16A34A" : a.status === "cancelled" ? "#DC2626" : "#2563EB"
                }]}>{a.status}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function InfoField({
  icon, label, value, editing, onChange, colors, keyboardType, multiline,
}: {
  icon: string;
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  colors: ReturnType<typeof useColors>;
  keyboardType?: any;
  multiline?: boolean;
}) {
  return (
    <View style={infoStyles.row}>
      <Feather name={icon as any} size={16} color={colors.mutedForeground} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={[infoStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
        {editing ? (
          <TextInput
            style={[infoStyles.input, { color: colors.foreground, borderBottomColor: colors.border }]}
            value={value}
            onChangeText={onChange}
            keyboardType={keyboardType}
            multiline={multiline}
          />
        ) : (
          <Text style={[infoStyles.value, { color: value ? colors.foreground : colors.mutedForeground }]}>
            {value || "—"}
          </Text>
        )}
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 10 },
  label: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  value: { fontSize: 14 },
  input: { fontSize: 14, borderBottomWidth: 1, paddingBottom: 4 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  iconBtn: { padding: 4 },
  profileSection: { alignItems: "center", marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  initials: { color: "#FFF", fontSize: 28, fontWeight: "800" },
  customerName: { fontSize: 24, fontWeight: "800", marginBottom: 4 },
  nameInput: { borderBottomWidth: 2, paddingBottom: 4, marginBottom: 4 },
  memberSince: { fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  statBox: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 16, alignItems: "center" },
  statValue: { fontSize: 28, fontWeight: "800" },
  statLabel: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  infoCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  bookBtn: { fontSize: 14, fontWeight: "700" },
  emptyHistory: { fontSize: 14, textAlign: "center", paddingVertical: 20 },
  historyItem: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8, flexDirection: "row", justifyContent: "space-between" },
  historyService: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  historyDate: { fontSize: 12 },
  historyPrice: { fontSize: 16, fontWeight: "700" },
  historyStatus: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
});
