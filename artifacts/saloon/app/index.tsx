// Role selector screen for the Saloon Manager mobile app
// Allows users to choose between customer and owner roles, with language switching

import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

export default function RoleSelector() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  // Calculate safe area padding for different platforms
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Auto-redirect authenticated users to their role-specific screens
  useEffect(() => {
    if (!loading && user) {
      if (user.role === "owner") {
        router.replace("/(owner)");
      } else {
        router.replace("/(customer)");
      }
    }
  }, [user, loading]);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
          <Feather name="scissors" size={32} color="#FFF" />
        </View>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  // Don't render if user is already authenticated
  if (user) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: bottomPad }]}>
      {/* Language selector buttons */}
      <View style={styles.langRow}>
        <TouchableOpacity style={[styles.langBtn, { backgroundColor: language === "en" ? colors.primary : colors.secondary }]} onPress={() => setLanguage("en")}>
          <Text style={{ color: language === "en" ? "#FFF" : colors.foreground, fontWeight: "700", fontSize: 13 }}>EN</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.langBtn, { backgroundColor: language === "hi" ? colors.primary : colors.secondary }]} onPress={() => setLanguage("hi")}>
          <Text style={{ color: language === "hi" ? "#FFF" : colors.foreground, fontWeight: "700", fontSize: 13 }}>हि</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.center}>
        {/* App logo and branding */}
        <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
          <Feather name="scissors" size={36} color="#FFF" />
        </View>
        <Text style={[styles.appName, { color: colors.primary }]}>{t("appName")}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{t("chooseRoleSubtitle")}</Text>

        <Text style={[styles.chooseLabel, { color: colors.foreground }]}>{t("chooseRole")}</Text>

        {/* Customer role card */}
        <View style={[styles.roleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.roleIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="user" size={26} color={colors.primary} />
          </View>
          <View style={styles.roleText}>
            <Text style={[styles.roleTitle, { color: colors.foreground }]}>{t("customer")}</Text>
            <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>{t("customerDesc")}</Text>
          </View>
          <View style={styles.authBtns}>
            <TouchableOpacity
              style={[styles.authBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push({ pathname: "/auth/login", params: { role: "customer" } })}
            >
              <Text style={styles.authBtnText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.authBtnOutline, { borderColor: colors.primary }]}
              onPress={() => router.push({ pathname: "/auth/register", params: { role: "customer" } })}
            >
              <Text style={[styles.authBtnOutlineText, { color: colors.primary }]}>{t("register")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Owner role card */}
        <View style={[styles.roleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.roleIcon, { backgroundColor: "#FEF0E6" }]}>
            <Feather name="briefcase" size={26} color={colors.accent} />
          </View>
          <View style={styles.roleText}>
            <Text style={[styles.roleTitle, { color: colors.foreground }]}>{t("owner")}</Text>
            <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>{t("ownerDesc")}</Text>
          </View>
          <View style={styles.authBtns}>
            <TouchableOpacity
              style={[styles.authBtn, { backgroundColor: colors.accent }]}
              onPress={() => router.push({ pathname: "/auth/login", params: { role: "owner" } })}
            >
              <Text style={styles.authBtnText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.authBtnOutline, { borderColor: colors.accent }]}
              onPress={() => router.push({ pathname: "/auth/register", params: { role: "owner" } })}
            >
              <Text style={[styles.authBtnOutlineText, { color: colors.accent }]}>{t("register")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// Styles for the role selector screen
const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { flex: 1, paddingHorizontal: 24 },
  langRow: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 16 },
  langBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  center: { flex: 1, justifyContent: "center" },
  logoContainer: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 16, shadowColor: "#C0390B", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  appName: { fontSize: 32, fontWeight: "900", textAlign: "center", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, textAlign: "center", marginTop: 6, marginBottom: 36 },
  chooseLabel: { fontSize: 17, fontWeight: "700", textAlign: "center", marginBottom: 18 },
  roleCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  roleIcon: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  roleText: { marginBottom: 14 },
  roleTitle: { fontSize: 17, fontWeight: "800", marginBottom: 3 },
  roleDesc: { fontSize: 13 },
  authBtns: { flexDirection: "row", gap: 10 },
  authBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center" },
  authBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  authBtnOutline: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center", borderWidth: 1.5 },
  authBtnOutlineText: { fontWeight: "700", fontSize: 14 },
});
