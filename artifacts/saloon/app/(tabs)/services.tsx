import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ServiceCard } from "@/components/ServiceCard";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function ServicesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { services, deleteService } = useApp();

  const grouped = useMemo(() => {
    const groups: Record<string, typeof services> = {};
    for (const s of services) {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [services]);

  const totalRevenue = useMemo(() => {
    return services.reduce((sum, s) => sum + s.price, 0);
  }, [services]);

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Delete Service", `Remove "${name}" from your services?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          deleteService(id);
        },
      },
    ]);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Services</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {services.length} services · avg ${(totalRevenue / Math.max(services.length, 1)).toFixed(0)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/new-service")}
        >
          <Feather name="plus" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {grouped.map(([category, categoryServices]) => (
          <View key={category} style={styles.group}>
            <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>
              {category.toUpperCase()}
            </Text>
            {categoryServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onPress={() => router.push({ pathname: "/service/[id]", params: { id: service.id } })}
                onDelete={() => handleDelete(service.id, service.name)}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8B1A1A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  group: {
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
});
