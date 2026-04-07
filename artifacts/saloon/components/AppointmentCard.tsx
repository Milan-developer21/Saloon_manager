import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { Appointment } from "@/context/AppContext";

interface Props {
  appointment: Appointment;
  onPress: () => void;
  onStatusChange?: (status: Appointment["status"]) => void;
}

const STATUS_CONFIG = {
  scheduled: { label: "Scheduled", color: "#2563EB", bg: "#EFF6FF" },
  completed: { label: "Completed", color: "#16A34A", bg: "#F0FDF4" },
  cancelled: { label: "Cancelled", color: "#DC2626", bg: "#FEF2F2" },
  "no-show": { label: "No Show", color: "#D97706", bg: "#FFFBEB" },
};

export function AppointmentCard({ appointment, onPress, onStatusChange }: Props) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const statusConfig = STATUS_CONFIG[appointment.status];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.97, { damping: 15 }, () => {
      scale.value = withSpring(1);
    });
    Haptics.selectionAsync();
    onPress();
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayH}:${minutes} ${ampm}`;
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={styles.timeColumn}>
          <Text style={[styles.time, { color: colors.primary }]}>{formatTime(appointment.time)}</Text>
          <Text style={[styles.duration, { color: colors.mutedForeground }]}>{appointment.duration}m</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.primary }]} />
        <View style={styles.content}>
          <Text style={[styles.customerName, { color: colors.foreground }]}>{appointment.customerName}</Text>
          <Text style={[styles.serviceName, { color: colors.mutedForeground }]}>{appointment.serviceName}</Text>
          <View style={styles.footer}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
            </View>
            <Text style={[styles.price, { color: colors.accent }]}>${appointment.price}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          {appointment.status === "scheduled" && onStatusChange && (
            <>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onStatusChange("completed");
                }}
                style={[styles.actionBtn, { backgroundColor: "#F0FDF4" }]}
              >
                <Feather name="check" size={16} color="#16A34A" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onStatusChange("cancelled");
                }}
                style={[styles.actionBtn, { backgroundColor: "#FEF2F2" }]}
              >
                <Feather name="x" size={16} color="#DC2626" />
              </TouchableOpacity>
            </>
          )}
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  timeColumn: {
    width: 60,
    alignItems: "center",
  },
  time: {
    fontSize: 13,
    fontWeight: "700",
  },
  duration: {
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    width: 3,
    height: 44,
    borderRadius: 2,
    marginHorizontal: 12,
  },
  content: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  serviceName: {
    fontSize: 13,
    marginBottom: 6,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
});
