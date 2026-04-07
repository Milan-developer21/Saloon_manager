import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  value: string | number;
  subtitle?: string;
  accentColor?: string;
}

export function StatsCard({ label, value, subtitle, accentColor }: Props) {
  const colors = useColors();
  const accent = accentColor ?? colors.primary;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  value: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
    textAlign: "center",
  },
});
