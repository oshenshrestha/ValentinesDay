import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Platform,
  Alert,
  TouchableOpacity,
  Text,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import AlbumsScreen from "./screens/AlbumsScreen";
import TimelineScreen from "./screens/TimelineScreen";
import SettingsScreen from "./screens/SettingsScreen";
import { loadData, saveData } from "./storage/storage";
import { makeId, todayISO, safeParseDate } from "./storage/utils";
import CalendarScreen from "./screens/CalendarScreen";
import { useFonts } from "expo-font";
import { PlayfairDisplay_700Bold } from "@expo-google-fonts/playfair-display";
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";

const BG = require("./assets/flowers.jpg");

const DEFAULT_SETTINGS = {
  coupleName: "Oshen and Vivian forever <3",
  anniversary: "2025-06-29",
};

const THEME = {
  accent: "#FF2D55",
};

function AppInner() {
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState("albums");
  const [albums, setAlbums] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    (async () => {
      const loadedAlbums = await loadData("albums", []);
      const loadedPhotos = await loadData("photos", []);
      const loadedSettings = await loadData("settings", DEFAULT_SETTINGS);
      setAlbums(Array.isArray(loadedAlbums) ? loadedAlbums : []);
      setPhotos(Array.isArray(loadedPhotos) ? loadedPhotos : []);
      setSettings({ ...DEFAULT_SETTINGS, ...(loadedSettings || {}) });
    })();
  }, []);

  useEffect(() => {
    saveData("albums", albums).catch(() => {});
  }, [albums]);
  useEffect(() => {
    saveData("photos", photos).catch(() => {});
  }, [photos]);
  useEffect(() => {
    saveData("settings", settings).catch(() => {});
  }, [settings]);

  const albumIndex = useMemo(() => {
    const map = new Map();
    albums.forEach((a) => map.set(a.id, a));
    return map;
  }, [albums]);

  const handlers = useMemo(() => {
    return {
      createAlbum: (name, dateISO) => {
        const trimmed = (name || "").trim();
        if (!trimmed) return;
        const albumDate =
          dateISO && safeParseDate(dateISO) ? dateISO : todayISO();
        const newAlbum = {
          id: makeId(),
          name: trimmed,
          dateISO: albumDate,
          createdAt: new Date().toISOString(),
        };
        setAlbums((prev) => [newAlbum, ...prev]);
      },
      renameAlbum: (albumId, newName) => {
        const trimmed = (newName || "").trim();
        if (!trimmed) return;
        setAlbums((prev) =>
          prev.map((a) => (a.id === albumId ? { ...a, name: trimmed } : a)),
        );
      },
      deleteAlbum: (albumId) => {
        setAlbums((prev) => prev.filter((a) => a.id !== albumId));
        setPhotos((prev) => prev.filter((p) => p.albumId !== albumId));
      },
      addPhoto: ({ uri, albumId, dateISO, caption }) => {
        const albumDate = albumId
          ? albums.find((a) => a.id === albumId)?.dateISO || null
          : null;
        const newPhoto = {
          id: makeId(),
          uri,
          albumId: albumId ?? null,
          dateISO: dateISO || albumDate || todayISO(),
          caption: caption ?? "",
          favorite: false,
          createdAt: new Date().toISOString(),
        };
        setPhotos((prev) => [newPhoto, ...prev]);
      },
      toggleFavorite: (photoId) => {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId ? { ...p, favorite: !p.favorite } : p,
          ),
        );
      },
      updateCaption: (photoId, caption) => {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId ? { ...p, caption: caption ?? "" } : p,
          ),
        );
      },
      updatePhotoDate: (photoId, dateISO) => {
        const d = safeParseDate(dateISO);
        if (!d) return;
        setPhotos((prev) =>
          prev.map((p) => (p.id === photoId ? { ...p, dateISO } : p)),
        );
      },
      movePhotoToAlbum: (photoId, albumIdOrNull) => {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId ? { ...p, albumId: albumIdOrNull } : p,
          ),
        );
      },
      deletePhoto: (photoId) => {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      },
      resetAll: () => {
        const doIt = () => {
          setAlbums([]);
          setPhotos([]);
          setSettings(DEFAULT_SETTINGS);
        };
        if (Platform.OS === "web") {
          if (confirm("Reset all data? This cannot be undone.")) doIt();
        } else {
          Alert.alert(
            "Reset everything?",
            "This will delete albums, photos, and settings on this device.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Reset", style: "destructive", onPress: doIt },
            ],
          );
        }
      },
    };
  }, [albums]);

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      {/* light overlay so UI is readable while keeping the floral aesthetic */}
      <View style={styles.overlay}>
        {tab === "albums" && (
          <AlbumsScreen
            albums={albums}
            photos={photos}
            albumIndex={albumIndex}
            onCreateAlbum={handlers.createAlbum}
            onRenameAlbum={handlers.renameAlbum}
            onDeleteAlbum={handlers.deleteAlbum}
            onAddPhoto={handlers.addPhoto}
            onToggleFavorite={handlers.toggleFavorite}
            onUpdateCaption={handlers.updateCaption}
            onUpdatePhotoDate={handlers.updatePhotoDate}
            onMovePhotoToAlbum={handlers.movePhotoToAlbum}
            onDeletePhoto={handlers.deletePhoto}
          />
        )}

        {tab === "timeline" && (
          <TimelineScreen
            photos={photos}
            albumIndex={albumIndex}
            onToggleFavorite={handlers.toggleFavorite}
          />
        )}
        {tab === "calendar" && <CalendarScreen />}

        {tab === "settings" && (
          <SettingsScreen
            settings={settings}
            setSettings={setSettings}
            photoCount={photos.length}
            albumCount={albums.length}
            onResetAll={handlers.resetAll}
          />
        )}

        <View
          style={[
            styles.tabBar,
            { paddingBottom: Math.max(12, insets.bottom) },
          ]}
        >
          <View style={styles.tabBarContent}>
            <TabButton
              icon="heart"
              label="Albums"
              active={tab === "albums"}
              onPress={() => setTab("albums")}
            />
            <TabButton
              icon="time"
              label="Timeline"
              active={tab === "timeline"}
              onPress={() => setTab("timeline")}
            />
            <TabButton
              icon="calendar"
              label="Calendar"
              active={tab === "calendar"}
              onPress={() => setTab("calendar")}
            />

            <TabButton
              icon="settings"
              label="Settings"
              active={tab === "settings"}
              onPress={() => setTab("settings")}
            />
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AppInner />
    </SafeAreaProvider>
  );
}

function TabButton({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity
      style={styles.tabButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>
        <Ionicons
          name={active ? icon : `${icon}-outline`}
          size={22}
          color={active ? "#fff" : "rgba(31,31,36,0.55)"}
        />
      </View>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },

  // This is the key: keeps the floral corners visible but makes content readable.
  overlay: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.82)", // raise to 0.82 for more clean white space
  },

  tabBar: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 10,
    height: 100,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderColor: "rgba(60, 60, 67, 0.14)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 10,
    overflow: "hidden",
  },
  tabBarContent: {
    flexDirection: "row",
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  tabButton: { flex: 1, alignItems: "center", paddingVertical: 8 },
  tabIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31,31,36,0.06)",
  },
  tabIconWrapActive: {
    backgroundColor: THEME.accent,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
 tabLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    marginTop: 6,
    color: "rgba(31,31,36,0.55)",
    letterSpacing: -0.2,
  },
  tabLabelActive: { color: THEME.accent },
});
