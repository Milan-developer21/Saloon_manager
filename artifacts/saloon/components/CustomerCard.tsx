import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Customer } from "@/context/AppContext";

interface Props {
  customer: Customer;
  onPress: () => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  "#8B1A1A",
  "#C4822A",
  "#1A5C8B",
  "#2D8B3A",
  "#6B1A8B",
  "#8B5A1A",
];

function getAvatarColor(name: string) {
  const sum = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export function CustomerCard({ customer, onPress }: Props) {
  const colors = useColors();
  const avatarColor = getAvatarColor(customer.name);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      activeOpacity={0.85}
    >
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.initials}>{getInitials(customer.name)}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.foreground }]}>{customer.name}</Text>
        <Text style={[styles.phone, { color: colors.mutedForeground }]}>{customer.phone}</Text>
        {customer.notes ? (
          <Text style={[styles.notes, { color: colors.mutedForeground }]} numberOfLines={1}>
            {customer.notes}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>
        <View style={[styles.visitsBadge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.visitsCount, { color: colors.primary }]}>{customer.totalVisits}</Text>
          <Text style={[styles.visitsLabel, { color: colors.mutedForeground }]}>visits</Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  initials: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  phone: {
    fontSize: 13,
    marginBottom: 2,
  },
  notes: {
    fontSize: 12,
    fontStyle: "italic",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  visitsBadge: {
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  visitsCount: {
    fontSize: 16,
    fontWeight: "700",
  },
  visitsLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
});
