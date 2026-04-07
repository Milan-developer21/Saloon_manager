import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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

export default function NewServiceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addService } = useApp();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [category, setCategory] = useState("Hair");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!price || isNaN(Number(price))) errs.price = "Valid price required";
    if (!duration || isNaN(Number(duration))) errs.duration = "Valid duration required";
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    addService({
      name: name.trim(),
      price: Number(price),
      duration: Number(duration),
      category,
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
        <Text style={[styles.title, { color: colors.foreground }]}>New Service</Text>
        <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Service Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: errors.name ? colors.destructive : colors.border, color: colors.foreground }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Haircut & Shave"
            placeholderTextColor={colors.mutedForeground}
          />
          {errors.name && <Text style={[styles.error, { color: colors.destructive }]}>{errors.name}</Text>}
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Price ($) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: errors.price ? colors.destructive : colors.border, color: colors.foreground }]}
              value={price}
              onChangeText={setPrice}
              placeholder="25"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
            />
            {errors.price && <Text style={[styles.error, { color: colors.destructive }]}>{errors.price}</Text>}
          </View>
          <View style={{ width: 12 }} />
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Duration (min) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: errors.duration ? colors.destructive : colors.border, color: colors.foreground }]}
              value={duration}
              onChangeText={setDuration}
              placeholder="30"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
            />
            {errors.duration && <Text style={[styles.error, { color: colors.destructive }]}>{errors.duration}</Text>}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Category</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.chip,
                  {
                    backgroundColor: category === cat ? colors.primary : colors.card,
                    borderColor: category === cat ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  setCategory(cat);
                  Haptics.selectionAsync();
                }}
              >
                <Text style={[styles.chipText, { color: category === cat ? "#FFF" : colors.foreground }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 18, fontWeight: "700" },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  field: { marginBottom: 16 },
  row: { flexDirection: "row", marginBottom: 0 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  error: { fontSize: 12, marginTop: 4, fontWeight: "500" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 14, fontWeight: "600" },
});
