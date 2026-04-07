import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";
import { Saloon } from "@/context/AppContext";

interface Props {
  saloon: Saloon;
  onPress: () => void;
}

export function SaloonCard({ saloon, onPress }: Props) {
  const colors = useColors();
  const { t } = useLanguage();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      activeOpacity={0.88}
    >
      <View style={styles.top}>
        <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
          <Feather name="scissors" size={22} color={colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{saloon.name}</Text>
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={12} color={colors.mutedForeground} />
            <Text style={[styles.address, { color: colors.mutedForeground }]} numberOfLines={1}>
              {saloon.city} · {saloon.address}
            </Text>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: saloon.isOpen ? colors.greenBg : colors.redBg }]}>
          <View style={[styles.dot, { backgroundColor: saloon.isOpen ? colors.green : colors.red }]} />
          <Text style={[styles.badgeText, { color: saloon.isOpen ? colors.green : colors.red }]}>
            {saloon.isOpen ? t("open") : t("closed")}
          </Text>
        </View>
      </View>

      {saloon.description ? (
        <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
          {saloon.description}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.tagsRow}>
          {saloon.services.slice(0, 3).map((s) => (
            <View key={s} style={[styles.tag, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.tagText, { color: colors.primary }]}>{s}</Text>
            </View>
          ))}
          {saloon.services.length > 3 && (
            <Text style={[styles.more, { color: colors.mutedForeground }]}>+{saloon.services.length - 3}</Text>
          )}
        </View>
        <View style={styles.hours}>
          <Feather name="clock" size={12} color={colors.mutedForeground} />
          <Text style={[styles.hoursText, { color: colors.mutedForeground }]}>
            {saloon.openTime} – {saloon.closeTime}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#C0390B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  top: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "800", marginBottom: 3 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  address: { fontSize: 12, flex: 1 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  description: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tagsRow: { flexDirection: "row", gap: 6, flex: 1 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  tagText: { fontSize: 11, fontWeight: "600" },
  more: { fontSize: 11, marginTop: 3 },
  hours: { flexDirection: "row", alignItems: "center", gap: 4 },
  hoursText: { fontSize: 11 },
});
