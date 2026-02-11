import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { formatNiceDate, safeParseDate } from "../storage/utils";

const albumBackground = require("../assets/album-bg.png");

const THEME = {
  text: "#1F1F24",
  sub: "rgba(31,31,36,0.60)",
  accent: "#FF2D55",
  accent2: "#FFB6C1",
  border: "rgba(60, 60, 67, 0.14)",
};

export default function AlbumDetailScreen({
  album,
  albums,
  photos,
  onBack,
  onAddPhoto,
  onToggleFavorite,
  onUpdateCaption,
  onUpdatePhotoDate,
  onMovePhotoToAlbum,
  onDeletePhoto,
  onRenameAlbum,
  onDeleteAlbum,
  hideAlbumActions,
}) {
  const [selectedPhotoId, setSelectedPhotoId] = useState(null);
  const [showEdit, setShowEdit] = useState(false);

  const selectedPhoto = useMemo(
    () => photos.find((p) => p.id === selectedPhotoId) || null,
    [photos, selectedPhotoId]
  );

  const scopedPhotos = useMemo(() => {
    if (album.id === "__ALL__") return photos;
    return photos.filter((p) => p.albumId === album.id);
  }, [photos, album.id]);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow photo library access to add pictures.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsMultipleSelection: true,
      selectionLimit: 0,
    });

    if (res.canceled) return;

    const targetAlbumId = album.id === "__ALL__" ? null : album.id;
    const assets = Array.isArray(res.assets) ? res.assets : [];
    if (assets.length === 0) return;

    assets.forEach((asset) => {
      if (!asset?.uri) return;
      onAddPhoto({
        uri: asset.uri,
        albumId: targetAlbumId,
        dateISO: null,
        caption: "",
      });
    });
  };

  const confirmDeletePhoto = (photoId) => {
    Alert.alert("Delete photo?", "This removes the photo from the app (from this device).", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDeletePhoto(photoId) },
    ]);
  };

  return (
    <ImageBackground source={albumBackground} style={styles.container} resizeMode="cover" blurRadius={10}>
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} style={styles.topIcon} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              {album.name}
            </Text>
            <View style={styles.subtitleRow}>
              <View style={styles.subtitlePill}>
                <Ionicons name="images" size={14} color="#fff" />
                <Text style={styles.subTitle}>{scopedPhotos.length} photos</Text>
              </View>
              <View style={styles.subtitlePillSoft}>
                <Ionicons name="heart" size={14} color={THEME.accent} />
                <Text style={styles.subTitleSoft}>love archive</Text>
              </View>
            </View>
          </View>

          {!hideAlbumActions && (
            <>
              <TouchableOpacity onPress={onRenameAlbum} style={styles.topIcon} activeOpacity={0.7}>
                <Ionicons name="pencil" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onDeleteAlbum} style={styles.topIcon} activeOpacity={0.7}>
                <Ionicons name="trash" size={20} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {scopedPhotos.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="images" size={64} color={THEME.accent2} />
            <Text style={styles.emptyTitle}>No photos yet</Text>
            <Text style={styles.emptySub}>Tap the camera to add your first memory 💗</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={pickImage} activeOpacity={0.9}>
              <Ionicons name="camera" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Add Photos</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={scopedPhotos}
            numColumns={3}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ paddingBottom: 160 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.cell}
                activeOpacity={0.88}
                onPress={() => setSelectedPhotoId(item.id)}
              >
                <Image source={{ uri: item.uri }} style={styles.photo} />
                {item.favorite && (
                  <View style={styles.badge}>
                    <Ionicons name="heart" size={14} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        )}

        <TouchableOpacity style={styles.fab} onPress={pickImage} activeOpacity={0.95}>
          <Ionicons name="camera" size={24} color="#fff" />
        </TouchableOpacity>

        <Modal visible={!!selectedPhoto} animationType="slide">
          {selectedPhoto && (
            <View style={styles.modal}>
              <View style={styles.modalTop}>
                <TouchableOpacity onPress={() => setSelectedPhotoId(null)} style={styles.modalIcon}>
                  <Ionicons name="chevron-back" size={26} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={() => setShowEdit(true)} style={styles.modalIcon}>
                  <Ionicons name="create-outline" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmDeletePhoto(selectedPhoto.id)} style={styles.modalIcon}>
                  <Ionicons name="trash" size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.imageWrap}>
                <Image source={{ uri: selectedPhoto.uri }} style={styles.fullImage} />
              </View>

              <View style={styles.modalBottom}>
                <View style={styles.dateChip}>
                  <Ionicons name="calendar" size={14} color="#fff" />
                  <Text style={styles.dateText}>{formatNiceDate(selectedPhoto.dateISO)}</Text>
                </View>

                <View style={styles.captionRow}>
                  <Text style={styles.captionText}>
                    {selectedPhoto.caption || "Tap edit to add a caption"}
                  </Text>
                  <TouchableOpacity onPress={() => onToggleFavorite(selectedPhoto.id)} activeOpacity={0.7}>
                    <Ionicons
                      name={selectedPhoto.favorite ? "heart" : "heart-outline"}
                      size={28}
                      color="hotpink"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <Modal visible={showEdit} transparent animationType="fade">
                <View style={styles.sheetOverlay}>
                  <View style={styles.sheet}>
                    <View style={styles.sheetHeader}>
                      <View style={styles.sheetHeart}>
                        <Ionicons name="heart" size={16} color="#fff" />
                      </View>
                      <Text style={styles.sheetTitle}>Edit</Text>
                    </View>

                    <Text style={styles.sheetLabel}>Caption</Text>
                    <TextInput
                      value={selectedPhoto.caption}
                      onChangeText={(t) => onUpdateCaption(selectedPhoto.id, t)}
                      placeholder="Add a caption..."
                      style={styles.input}
                      placeholderTextColor="rgba(31,31,36,0.35)"
                    />

                    <Text style={styles.sheetLabel}>Date (YYYY-MM-DD)</Text>
                    <TextInput
                      value={selectedPhoto.dateISO}
                      onChangeText={(t) => {
                        if (safeParseDate(t)) onUpdatePhotoDate(selectedPhoto.id, t);
                      }}
                      placeholder="2026-02-14"
                      style={styles.input}
                      placeholderTextColor="rgba(31,31,36,0.35)"
                    />

                    <Text style={styles.sheetLabel}>Move to Album</Text>
                    <View style={styles.albumRow}>
                      <TouchableOpacity
                        style={styles.albumChip}
                        onPress={() => onMovePhotoToAlbum(selectedPhoto.id, null)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="grid" size={16} color="rgba(31,31,36,0.7)" />
                        <Text style={styles.albumChipText}>No Album</Text>
                      </TouchableOpacity>

                      {albums.map((a) => (
                        <TouchableOpacity
                          key={a.id}
                          style={styles.albumChip}
                          onPress={() => onMovePhotoToAlbum(selectedPhoto.id, a.id)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="folder" size={16} color={THEME.accent2} />
                          <Text style={styles.albumChipText}>{a.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity style={styles.primaryBtnSheet} onPress={() => setShowEdit(false)} activeOpacity={0.9}>
                      <Text style={styles.primaryBtnText}>Done</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.ghostBtn} onPress={() => setShowEdit(false)} activeOpacity={0.8}>
                      <Text style={styles.ghostBtnText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </View>
          )}
        </Modal>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { flex: 1, backgroundColor: "rgba(255, 240, 246, 0.86)" },

  topBar: {
    marginTop: 60,
    marginBottom:10,
    marginHorizontal: 14,
    borderRadius: 22,
    backgroundColor: "rgba(255, 45, 85, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.20,
    shadowRadius: 22,
    elevation: 10,
  },
  topIcon: { padding: 10, minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  title: { color: "#fff", fontSize: 18, fontWeight: "900", letterSpacing: -0.4 },
  subtitleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },

  subtitlePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  subTitle: { color: "rgba(255,255,255,0.95)", fontSize: 12, fontWeight: "800" },

  subtitlePillSoft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  subTitleSoft: { color: THEME.accent, fontSize: 12, fontWeight: "900" },

  cell: { width: "33.33%", aspectRatio: 1, padding: 4 },
  photo: { width: "100%", height: "100%", borderRadius: 14, backgroundColor: "#F2F2F7" },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 45, 85, 0.85)",
    borderRadius: 999,
    padding: 7,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 22, fontWeight: "900", marginTop: 12, color: THEME.text },
  emptySub: { color: THEME.sub, textAlign: "center", marginTop: 8, marginBottom: 18, fontSize: 15, lineHeight: 21, fontWeight: "600" },

  primaryBtn: {
    backgroundColor: THEME.accent,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  primaryBtnText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  fab: {
    position: "absolute",
    right: 22,
    bottom: 122,
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: THEME.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.26,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },

  modal: { flex: 1, backgroundColor: "#000" },
  modalTop: { flexDirection: "row", alignItems: "center", paddingTop: 56, paddingHorizontal: 8, paddingBottom: 8 },
  modalIcon: { padding: 10, minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },

  imageWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  fullImage: { width: "100%", height: "100%", resizeMode: "contain" },

  modalBottom: { padding: 16, backgroundColor: "rgba(0,0,0,0.72)", paddingBottom: 34 },
  dateChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255, 45, 85, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  dateText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  captionRow: { marginTop: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  captionText: { flex: 1, color: "#fff", fontSize: 17, fontWeight: "700" },

  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    paddingBottom: 44,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
  },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  sheetHeart: { width: 30, height: 30, borderRadius: 12, backgroundColor: THEME.accent, alignItems: "center", justifyContent: "center" },
  sheetTitle: { fontSize: 20, fontWeight: "900", color: THEME.text, letterSpacing: -0.3 },

  sheetLabel: { marginTop: 12, color: THEME.sub, fontWeight: "900", fontSize: 12, letterSpacing: 0.2, textTransform: "uppercase" },
  input: {
    borderWidth: 1,
    borderColor: "rgba(60, 60, 67, 0.12)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
    fontSize: 16,
    backgroundColor: "rgba(31,31,36,0.05)",
    color: THEME.text,
    fontWeight: "700",
  },

  albumRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  albumChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(31,31,36,0.05)",
    borderWidth: 1,
    borderColor: "rgba(60, 60, 67, 0.12)",
    minHeight: 34,
  },
  albumChipText: { fontWeight: "800", color: THEME.text, fontSize: 14 },

  primaryBtnSheet: { marginTop: 14, backgroundColor: THEME.accent, paddingVertical: 14, borderRadius: 16, alignItems: "center" },
  ghostBtn: { marginTop: 10, paddingVertical: 12, alignItems: "center", minHeight: 44 },
  ghostBtnText: { color: "rgba(31,31,36,0.55)", fontWeight: "900", fontSize: 16 },
});
