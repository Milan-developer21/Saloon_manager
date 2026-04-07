import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

export default function RoleSelector() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setRole } = useApp();
  const { t, language, setLanguage } = useLanguage();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleRole = async (role: "customer" | "owner") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setRole(role);
    router.replace(role === "customer" ? "/(customer)" : "/(owner)");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: bottomPad }]}>
      <View style={styles.langRow}>
        <TouchableOpacity
          style={[styles.langBtn, { backgroundColor: language === "en" ? colors.primary : colors.secondary }]}
          onPress={() => setLanguage("en")}
        >
          <Text style={{ color: language === "en" ? "#FFF" : colors.foreground, fontWeight: "700", fontSize: 13 }}>EN</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.langBtn, { backgroundColor: language === "hi" ? colors.primary : colors.secondary }]}
          onPress={() => setLanguage("hi")}
        >
          <Text style={{ color: language === "hi" ? "#FFF" : colors.foreground, fontWeight: "700", fontSize: 13 }}>हि</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.center}>
        <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
          <Feather name="scissors" size={36} color="#FFF" />
        </View>
        <Text style={[styles.appName, { color: colors.primary }]}>{t("appName")}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{t("chooseRoleSubtitle")}</Text>

        <Text style={[styles.chooseLabel, { color: colors.foreground }]}>{t("chooseRole")}</Text>

        <TouchableOpacity
          style={[styles.roleCard, { backgroundColor: colors.card, borderColor: colors.primary }]}
          onPress={() => handleRole("customer")}
          activeOpacity={0.85}
        >
          <View style={[styles.roleIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="user" size={28} color={colors.primary} />
          </View>
          <View style={styles.roleText}>
            <Text style={[styles.roleTitle, { color: colors.foreground }]}>{t("customer")}</Text>
            <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>{t("customerDesc")}</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleCard, { backgroundColor: colors.card, borderColor: colors.accent }]}
          onPress={() => handleRole("owner")}
          activeOpacity={0.85}
        >
          <View style={[styles.roleIcon, { backgroundColor: "#FEF0E6" }]}>
            <Feather name="briefcase" size={28} color={colors.accent} />
          </View>
          <View style={styles.roleText}>
            <Text style={[styles.roleTitle, { color: colors.foreground }]}>{t("owner")}</Text>
            <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>{t("ownerDesc")}</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  langRow: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 16 },
  langBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  center: { flex: 1, justifyContent: "center" },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
    shadowColor: "#C0390B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  appName: { fontSize: 32, fontWeight: "900", textAlign: "center", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, textAlign: "center", marginTop: 6, marginBottom: 40 },
  chooseLabel: { fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 20 },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 2,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  roleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  roleText: { flex: 1 },
  roleTitle: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  roleDesc: { fontSize: 13, lineHeight: 18 },
});
