import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useAuth();
  const { t } = useLanguage();
  const { role } = useLocalSearchParams<{ role: "customer" | "owner" }>();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const isOwner = role === "owner";
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleRegister = async () => {
    if (!name.trim() || !phone.trim() || !password.trim()) {
      Alert.alert("", "All fields are required");
      return;
    }
    if (password !== confirm) {
      Alert.alert("", "Passwords do not match");
      return;
    }
    if (password.length < 4) {
      Alert.alert("", "Password must be at least 4 characters");
      return;
    }
    setLoading(true);
    try {
      const user = await register(name.trim(), phone.trim(), password, isOwner ? "owner" : "customer");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (user.role === "owner") {
        router.replace("/(owner)");
      } else {
        router.replace("/(customer)");
      }
    } catch (err: any) {
      Alert.alert("Registration Failed", err.message || "Could not register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: topPad + 20, paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>

        <View style={[styles.iconContainer, { backgroundColor: isOwner ? "#FEF0E6" : colors.secondary }]}>
          <Feather name={isOwner ? "briefcase" : "user-plus"} size={32} color={isOwner ? colors.accent : colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {isOwner ? t("owner") : t("customer")} — {t("register")}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {isOwner ? "Create your saloon owner account" : "Create your account to book slots"}
        </Text>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>{isOwner ? t("ownerName") : t("yourName")} *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={name}
            onChangeText={setName}
            placeholder={isOwner ? "Ramesh Sharma" : "Your full name"}
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={[styles.label, { color: colors.mutedForeground }]}>{t("phone")} *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={phone}
            onChangeText={setPhone}
            placeholder="98765-43210"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Password *</Text>
          <View style={[styles.passRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.passInput, { color: colors.foreground }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPass}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Feather name={showPass ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Confirm Password *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={confirm}
            onChangeText={setConfirm}
            placeholder="••••••••"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry={!showPass}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: isOwner ? colors.accent : colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? t("loading") : t("register")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchLink}
            onPress={() => router.replace({ pathname: "/auth/login", params: { role } })}
          >
            <Text style={[styles.switchText, { color: colors.mutedForeground }]}>
              Already have an account?{" "}
              <Text style={{ color: isOwner ? colors.accent : colors.primary, fontWeight: "700" }}>Login</Text>
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
  subtitle: { fontSize: 14, textAlign: "center", marginTop: 6, marginBottom: 32 },
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
