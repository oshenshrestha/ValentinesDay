import React from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, Alert, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { diffDays, safeParseDate } from "../storage/utils";

const THEME = {
  text: "#1F1F24",
  sub: "rgba(31,31,36,0.60)",
  card: "rgba(255,255,255,0.86)",
  border: "rgba(60, 60, 67, 0.14)",
  accent: "#FF2D55",
  accent2: "#FFB6C1",
};

export default function SettingsScreen({ settings, setSettings, albumCount, photoCount, onResetAll }) {
  const daysTogether = diffDays(settings.anniversary);

  const confirmReset = () => {
    if (Platform.OS === "web") {
      if (confirm("Reset all data?")) onResetAll();
      return;
    }
    Alert.alert("Reset everything?", "This deletes albums, photos, and settings on this device.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: onResetAll },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 160 }}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="heart" size={18} color="#fff" />
        </View>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subTitle}>make it cute, make it us 💘</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Names</Text>
        <TextInput
          value={settings.coupleName}
          onChangeText={(v) => setSettings({ ...settings, coupleName: v })}
          style={styles.input}
          placeholder="You & Partner"
          placeholderTextColor="rgba(31,31,36,0.35)"
        />

        <Text style={styles.label}>Anniversary (YYYY-MM-DD)</Text>
        <TextInput
          value={settings.anniversary}
          onChangeText={(v) => setSettings({ ...settings, anniversary: v })}
          onBlur={() => {
            if (!safeParseDate(settings.anniversary))
              setSettings((s) => ({ ...s, anniversary: "2024-02-14" }));
          }}
          style={styles.input}
          placeholder="2024-02-14"
          placeholderTextColor="rgba(31,31,36,0.35)"
        />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Days Together</Text>
          <View style={styles.daysPill}>
            <Ionicons name="sparkles" size={14} color={THEME.accent} />
            <Text style={styles.rowValue}>{daysTogether} days</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionHeader}>Stats</Text>
      <View style={styles.card}>
        <View style={styles.rowThin}>
          <Text style={styles.rowLabel}>Albums</Text>
          <Text style={styles.rowValuePlain}>{albumCount}</Text>
        </View>
        <View style={[styles.rowThin, { borderBottomWidth: 0 }]}>
          <Text style={styles.rowLabel}>Photos</Text>
          <Text style={styles.rowValuePlain}>{photoCount}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.resetBtn} onPress={confirmReset} activeOpacity={0.9}>
        <Ionicons name="trash" size={18} color="#fff" />
        <Text style={styles.resetText}>Reset All Data</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>Everything is stored locally on your phone.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },

  header: {
    marginTop: 60,
    marginHorizontal: 14,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 8,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: THEME.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  title: { fontSize: 22, fontWeight: "950", color: THEME.text, letterSpacing: -0.4 },
  subTitle: { marginTop: 6, color: THEME.sub, fontWeight: "700" },

  sectionHeader: {
    fontSize: 12,
    fontWeight: "900",
    color: THEME.sub,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 18,
    marginBottom: 10,
    marginLeft: 18,
  },

  card: {
    backgroundColor: THEME.card,
    borderRadius: 20,
    marginHorizontal: 14,
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },

  label: { marginTop: 10, fontSize: 12, color: THEME.sub, fontWeight: "900", letterSpacing: 0.2, textTransform: "uppercase" },
  input: {
    backgroundColor: "rgba(31,31,36,0.05)",
    borderWidth: 1,
    borderColor: "rgba(60, 60, 67, 0.12)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 8,
    fontSize: 16,
    fontWeight: "700",
    color: THEME.text,
  },

  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, marginTop: 6 },
  rowThin: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(60, 60, 67, 0.10)",
  },
  rowLabel: { color: THEME.text, fontWeight: "800", fontSize: 16 },

  daysPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255, 45, 85, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 45, 85, 0.16)",
  },
  rowValue: { color: THEME.accent, fontWeight: "950", fontSize: 14 },
  rowValuePlain: { color: THEME.accent, fontWeight: "950", fontSize: 16 },

  resetBtn: {
    marginTop: 16,
    marginHorizontal: 14,
    backgroundColor: THEME.accent,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
    minHeight: 46,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  resetText: { color: "#fff", fontWeight: "950", fontSize: 16 },

  footer: {
    textAlign: "center",
    color: THEME.sub,
    fontSize: 13,
    marginTop: 14,
    marginHorizontal: 32,
    lineHeight: 18,
    fontWeight: "600",
  },
});
