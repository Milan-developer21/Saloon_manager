import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
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

const CATEGORIES = ["Hair", "Grooming", "Color", "Treatment", "Other"];

export default function ServiceDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { services, updateService, deleteService } = useApp();

  const service = services.find((s) => s.id === id);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(service?.name ?? "");
  const [price, setPrice] = useState(String(service?.price ?? ""));
  const [duration, setDuration] = useState(String(service?.duration ?? ""));
  const [category, setCategory] = useState(service?.category ?? "Hair");

  if (!service) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground, padding: 20 }}>Service not found</Text>
      </View>
    );
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSave = () => {
    updateService(id, { name, price: Number(price), duration: Number(duration), category });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditing(false);
  };

  const handleDelete = () => {
    Alert.alert("Delete Service", `Remove "${service.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteService(id);
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
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Feather name="edit-2" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <Feather name="trash-2" size={20} color={colors.destructive} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {editing ? (
          <>
            <TextInput
              style={[styles.nameInput, { color: colors.foreground, borderBottomColor: colors.primary }]}
              value={name}
              onChangeText={setName}
            />
            <View style={styles.priceRow}>
              <View style={styles.priceField}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Price ($)</Text>
                <TextInput
                  style={[styles.fieldInput, { borderColor: colors.border, color: colors.foreground }]}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.priceField}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Duration (min)</Text>
                <TextInput
                  style={[styles.fieldInput, { borderColor: colors.border, color: colors.foreground }]}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 12, marginBottom: 8 }]}>
              Category
            </Text>
            <View style={styles.chips}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: category === cat ? colors.primary : colors.secondary,
                      borderColor: category === cat ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={{ color: category === cat ? "#FFF" : colors.foreground, fontWeight: "600", fontSize: 13 }}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.serviceName, { color: colors.foreground }]}>{service.name}</Text>
            <Text style={[styles.categoryLabel, { color: colors.mutedForeground }]}>{service.category}</Text>
            <View style={styles.priceRow}>
              <View style={styles.priceBox}>
                <Text style={[styles.priceValue, { color: colors.primary }]}>${service.price}</Text>
                <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Price</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.priceBox}>
                <Text style={[styles.priceValue, { color: colors.accent }]}>{service.duration}</Text>
                <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Minutes</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerRight: { flexDirection: "row", gap: 16 },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20 },
  serviceName: { fontSize: 26, fontWeight: "800", marginBottom: 4 },
  categoryLabel: { fontSize: 14, marginBottom: 20 },
  nameInput: { fontSize: 22, fontWeight: "800", borderBottomWidth: 2, paddingBottom: 8, marginBottom: 16 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 0 },
  priceBox: { flex: 1, alignItems: "center", paddingVertical: 16 },
  priceValue: { fontSize: 32, fontWeight: "800" },
  priceLabel: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  divider: { width: 1, height: 60 },
  priceField: { flex: 1 },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  fieldInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 16 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
});
