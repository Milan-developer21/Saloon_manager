import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();
  const { role } = useLocalSearchParams<{ role: "customer" | "owner" }>();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const isOwner = role === "owner";
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleLogin = async () => {
    setError("");
    if (!phone.trim() || !password.trim()) {
      setError("Please enter phone and password");
      return;
    }
    setLoading(true);
    try {
      const user = await login(phone.trim(), password.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (user.role === "owner") {
        router.replace("/(owner)");
      } else {
        router.replace("/(customer)");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: topPad + 20, paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => router.replace("/")}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>

        <View style={[styles.iconContainer, { backgroundColor: isOwner ? "#FEF0E6" : colors.secondary }]}>
          <Feather name={isOwner ? "briefcase" : "user"} size={32} color={isOwner ? colors.accent : colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {isOwner ? t("owner") : t("customer")} — Login
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Enter your phone and password
        </Text>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.redBg }]}>
            <Feather name="alert-circle" size={15} color={colors.primary} />
            <Text style={[styles.errorText, { color: colors.primary }]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>{t("phone")}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={phone}
            onChangeText={setPhone}
            placeholder="98765-43210"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="phone-pad"
            autoCapitalize="none"
            testID="phone-input"
            accessibilityLabel="Phone Number"
          />

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Password</Text>
          <View style={[styles.passRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.passInput, { color: colors.foreground }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPass}
              autoCapitalize="none"
              testID="password-input"
              accessibilityLabel="Password"
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Feather name={showPass ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: isOwner ? colors.accent : colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleLogin}
            disabled={loading}
            testID="login-btn"
            accessibilityRole="button"
            accessibilityLabel="Login"
          >
            <Text style={styles.btnText}>{loading ? t("loading") : "Login"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchLink}
            onPress={() => router.replace({ pathname: "/auth/register", params: { role } })}
          >
            <Text style={[styles.switchText, { color: colors.mutedForeground }]}>
              Don't have an account?{" "}
              <Text style={{ color: isOwner ? colors.accent : colors.primary, fontWeight: "700" }}>
                {t("register")}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24 },
  back: { marginBottom: 24 },
  iconContainer: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 16 },
  title: { fontSize: 26, fontWeight: "900", textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center", marginTop: 6, marginBottom: 16 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, padding: 14, marginBottom: 8 },
  errorText: { fontSize: 13, fontWeight: "600", flex: 1 },
  form: { gap: 4 },
  label: { fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 12 },
  input: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16 },
  passRow: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14 },
  passInput: { flex: 1, fontSize: 16 },
  btn: { borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  btnText: { color: "#FFF", fontSize: 17, fontWeight: "800" },
  switchLink: { alignItems: "center", marginTop: 16 },
  switchText: { fontSize: 14 },
});
