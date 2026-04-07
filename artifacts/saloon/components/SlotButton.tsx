import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/useColors";

type SlotStatus = "available" | "selected" | "booked" | "blocked" | "pending";

interface Props {
  time: string;
  status: SlotStatus;
  onPress?: () => void;
}

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function SlotButton({ time, status, onPress }: Props) {
  const colors = useColors();

  const getStyle = () => {
    switch (status) {
      case "selected":
        return { bg: colors.primary, border: colors.primary, text: "#FFF" };
      case "booked":
        return { bg: colors.redBg, border: colors.red, text: colors.red };
      case "blocked":
        return { bg: colors.muted, border: colors.border, text: colors.mutedForeground };
      case "pending":
        return { bg: colors.yellowBg, border: colors.yellow, text: colors.yellow };
      default:
        return { bg: colors.card, border: colors.border, text: colors.foreground };
    }
  };

  const s = getStyle();
  const disabled = status === "booked" || status === "blocked";

  return (
    <TouchableOpacity
      style={[
        styles.slot,
        { backgroundColor: s.bg, borderColor: s.border },
        disabled && styles.disabled,
      ]}
      onPress={() => {
        if (!disabled && onPress) {
          Haptics.selectionAsync();
          onPress();
        }
      }}
      activeOpacity={disabled ? 1 : 0.8}
    >
      <Text style={[styles.time, { color: s.text }]}>{formatTime(time)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  slot: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
  },
  time: { fontSize: 13, fontWeight: "700" },
  disabled: { opacity: 0.6 },
});
