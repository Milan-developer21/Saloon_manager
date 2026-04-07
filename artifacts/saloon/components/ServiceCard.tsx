import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Service } from "@/context/AppContext";

interface Props {
  service: Service;
  onPress: () => void;
  onDelete?: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Hair: "scissors",
  Grooming: "wind",
  Color: "droplet",
  Treatment: "activity",
  Other: "star",
};

export function ServiceCard({ service, onPress, onDelete }: Props) {
  const colors = useColors();
  const iconName = CATEGORY_ICONS[service.category] || "star";

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      activeOpacity={0.85}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
        <Feather name={iconName as any} size={20} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.foreground }]}>{service.name}</Text>
        <Text style={[styles.category, { color: colors.mutedForeground }]}>{service.category}</Text>
      </View>
      <View style={styles.right}>
        <View>
          <Text style={[styles.price, { color: colors.primary }]}>${service.price}</Text>
          <Text style={[styles.duration, { color: colors.mutedForeground }]}>{service.duration} min</Text>
        </View>
        {onDelete && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onDelete();
            }}
            style={styles.deleteBtn}
          >
            <Feather name="trash-2" size={16} color={colors.destructive} />
          </TouchableOpacity>
        )}
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
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  category: {
    fontSize: 13,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "right",
  },
  duration: {
    fontSize: 11,
    textAlign: "right",
  },
  deleteBtn: {
    padding: 4,
  },
});
