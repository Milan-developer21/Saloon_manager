import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SaloonCard } from "@/components/SaloonCard";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

export default function BrowseSaloonsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { saloons } = useApp();
  const { logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [openOnly, setOpenOnly] = useState(false);

  const cities = useMemo(() => {
    const c = new Set(saloons.map((s) => s.city));
    return ["all", ...Array.from(c)];
  }, [saloons]);

  const filtered = useMemo(() => {
    return saloons.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.address.toLowerCase().includes(q);
      const matchCity = cityFilter === "all" || s.city === cityFilter;
      const matchOpen = !openOnly || s.isOpen;
      return matchSearch && matchCity && matchOpen;
    });
  }, [saloons, search, cityFilter, openOnly]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.title, { color: colors.primary }]}>{t("browseSaloons")}</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {filtered.length} saloon{filtered.length !== 1 ? "s" : ""} found
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.langBtn, { backgroundColor: language === "en" ? colors.primary : colors.secondary }]}
              onPress={() => setLanguage("en")}
            >
              <Text style={{ color: language === "en" ? "#FFF" : colors.foreground, fontWeight: "700", fontSize: 11 }}>EN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, { backgroundColor: language === "hi" ? colors.primary : colors.secondary }]}
              onPress={() => setLanguage("hi")}
            >
              <Text style={{ color: language === "hi" ? "#FFF" : colors.foreground, fontWeight: "700", fontSize: 11 }}>हि</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => logout()}
              style={styles.switchBtn}
            >
              <Feather name="log-out" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder={t("searchSaloons")}
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x-circle" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.filtersRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {cities.map((city) => (
              <TouchableOpacity
                key={city}
                style={[
                  styles.chip,
                  { backgroundColor: cityFilter === city ? colors.primary : colors.card, borderColor: cityFilter === city ? colors.primary : colors.border },
                ]}
                onPress={() => setCityFilter(city)}
              >
                <Text style={[styles.chipText, { color: cityFilter === city ? "#FFF" : colors.mutedForeground }]}>
                  {city === "all" ? t("allCities") : city}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[
              styles.openToggle,
              { backgroundColor: openOnly ? colors.greenBg : colors.card, borderColor: openOnly ? colors.green : colors.border },
            ]}
            onPress={() => setOpenOnly(!openOnly)}
          >
            <View style={[styles.dot, { backgroundColor: openOnly ? colors.green : colors.mutedForeground }]} />
            <Text style={[styles.chipText, { color: openOnly ? colors.green : colors.mutedForeground }]}>{t("open")}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="scissors" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t("noSaloons")}</Text>
          </View>
        ) : (
          filtered.map((saloon) => (
            <SaloonCard
              key={saloon.id}
              saloon={saloon}
              onPress={() => router.push({ pathname: "/(customer)/saloon/[id]", params: { id: saloon.id } })}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16 },
  switchBtn: { padding: 6 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 15 },
  filtersRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  chipScroll: { gap: 8, paddingRight: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: "600" },
  openToggle: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 8 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: "500" },
});
