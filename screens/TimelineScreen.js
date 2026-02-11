import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatNiceDate } from "../storage/utils";

const THEME = {
  text: "#1F1F24",
  sub: "rgba(31,31,36,0.60)",
  card: "rgba(255,255,255,0.86)",
  border: "rgba(60, 60, 67, 0.14)",
  accent: "#FF2D55",
  accent2: "#FFB6C1",
};

export default function TimelineScreen({ photos, albumIndex, onToggleFavorite }) {
  const sections = useMemo(() => {
    const getDisplayDateISO = (p) => (p.albumId ? albumIndex.get(p.albumId)?.dateISO || p.dateISO : p.dateISO);

    const sorted = [...photos].sort((a, b) => {
      const da = getDisplayDateISO(a);
      const db = getDisplayDateISO(b);
      if (da === db) return (a.createdAt || "") < (b.createdAt || "") ? 1 : -1;
      return da < db ? 1 : -1;
    });

    const map = new Map();
    for (const p of sorted) {
      const dateISO = getDisplayDateISO(p);
      const d = new Date(dateISO + "T00:00:00");
      const key = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({ ...p, _displayDateISO: dateISO });
    }

    return Array.from(map.entries()).map(([title, items]) => ({ title, items }));
  }, [photos, albumIndex]);

  if (photos.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Ionicons name="heart" size={34} color="#fff" />
        </View>
        <Text style={styles.emptyTitle}>No timeline yet</Text>
        <Text style={styles.emptySub}>Add date photos to see your love story unfold 💘</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sections}
      keyExtractor={(s) => s.title}
      contentContainerStyle={{ padding: 18, paddingBottom: 160 }}
      renderItem={({ item: section }) => (
        <View style={{ marginBottom: 22 }}>
          <View style={styles.monthHeader}>
            <Ionicons name="sparkles" size={16} color={THEME.accent} />
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>

          {section.items.map((p) => {
            const albumName = p.albumId ? albumIndex.get(p.albumId)?.name || "Album" : "No Album";
            return (
              <View key={p.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.datePill}>
                    <Ionicons name="calendar" size={14} color="#fff" />
                    <Text style={styles.cardDate}>{formatNiceDate(p._displayDateISO || p.dateISO)}</Text>
                  </View>

                  <TouchableOpacity onPress={() => onToggleFavorite(p.id)} activeOpacity={0.7}>
                    <Ionicons
                      name={p.favorite ? "heart" : "heart-outline"}
                      size={24}
                      color="hotpink"
                    />
                  </TouchableOpacity>
                </View>

                <Image source={{ uri: p.uri }} style={styles.cardImage} />

                <View style={styles.cardBottom}>
                  <Text style={styles.caption}>{p.caption || " "}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="folder" size={14} color="rgba(31,31,36,0.55)" />
                    <Text style={styles.metaText}>{albumName}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "transparent",
  },
  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: THEME.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  emptyTitle: { fontSize: 22, fontWeight: "900", marginTop: 12, color: THEME.text },
  emptySub: { color: THEME.sub, textAlign: "center", marginTop: 8, fontSize: 15, lineHeight: 21, fontWeight: "600" },

  monthHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, marginTop: 40 },
  sectionTitle: { fontSize: 20, fontWeight: "950", color: THEME.accent, letterSpacing: -0.4 },

  card: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 3,
  },
  cardTop: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  datePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255, 45, 85, 0.80)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  cardDate: { fontWeight: "900", color: "#fff", fontSize: 12, letterSpacing: -0.1 },

  cardImage: { width: "100%", height: 260, backgroundColor: "#F2F2F7" },

  cardBottom: { padding: 14 },
  caption: { fontSize: 15, fontWeight: "700", color: THEME.text, lineHeight: 21 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  metaText: { color: THEME.sub, fontWeight: "700", fontSize: 13 },
});
