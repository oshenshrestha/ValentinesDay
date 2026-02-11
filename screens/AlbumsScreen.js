import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import AlbumDetailScreen from "./AlbumDetailScreen";
import { formatNiceDate } from "../storage/utils";
import { Fonts } from "../theme/typography";

const THEME = {
  card: "rgba(255,255,255,0.86)",
  text: "#1F1F24",
  sub: "rgba(31,31,36,0.60)",
  border: "rgba(60, 60, 67, 0.14)",
  accent: "#FF2D55",
  accent2: "#FFB6C1",
};

export default function AlbumsScreen({
  albums,
  photos,
  albumIndex,
  onCreateAlbum,
  onRenameAlbum,
  onDeleteAlbum,
  onAddPhoto,
  onToggleFavorite,
  onUpdateCaption,
  onUpdatePhotoDate,
  onMovePhotoToAlbum,
  onDeletePhoto,
}) {
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);

  const [showNameModal, setShowNameModal] = useState(false);
  const [nameModalMode, setNameModalMode] = useState("create");
  const [nameValue, setNameValue] = useState("");
  const [descValue, setDescValue] = useState("");
  const [renameTargetId, setRenameTargetId] = useState(null);

  const [dateISO, setDateISO] = useState("");
  const [dateObj, setDateObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const toISODateOnly = (d) => (d instanceof Date && !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : "");

  const selectedAlbum =
    selectedAlbumId && selectedAlbumId !== "__ALL__"
      ? albumIndex.get(selectedAlbumId)
      : null;

  const albumStats = useMemo(() => {
    const counts = new Map();
    for (const p of photos) {
      if (!p.albumId) continue;
      counts.set(p.albumId, (counts.get(p.albumId) || 0) + 1);
    }
    return { counts };
  }, [photos]);

  const openCreateAlbum = () => {
    setNameModalMode("create");
    setNameValue("");
    setDescValue("");
    const today = new Date();
    setDateObj(today);
    setDateISO(toISODateOnly(today));
    setShowDatePicker(false);
    setShowNameModal(true);
  };

  const openRenameAlbum = (albumId, currentName) => {
    if (Platform.OS === "ios") {
      Alert.prompt(
        "Rename Album",
        "New name",
        (name) => name?.trim() && onRenameAlbum(albumId, name),
        "plain-text",
        currentName
      );
      return;
    }
    setNameModalMode("rename");
    setRenameTargetId(albumId);
    setNameValue(currentName || "");
    setShowNameModal(true);
  };

  const confirmDeleteAlbum = (albumId) => {
    onDeleteAlbum(albumId);
    setSelectedAlbumId(null);
  };

  const closeModal = () => {
    setShowNameModal(false);
    setNameValue("");
    setDescValue("");
    setRenameTargetId(null);
    setShowDatePicker(false);
  };

  const handlePickerChange = (event, selected) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (event?.type === "dismissed") return;
    const next = selected || dateObj;
    setDateObj(next);
    setDateISO(toISODateOnly(next));
  };

  if (selectedAlbum) {
    return (
      <AlbumDetailScreen
        album={selectedAlbum}
        albums={albums}
        photos={photos}
        onBack={() => setSelectedAlbumId(null)}
        onAddPhoto={onAddPhoto}
        onToggleFavorite={onToggleFavorite}
        onUpdateCaption={onUpdateCaption}
        onUpdatePhotoDate={onUpdatePhotoDate}
        onMovePhotoToAlbum={onMovePhotoToAlbum}
        onDeletePhoto={onDeletePhoto}
        onRenameAlbum={() => openRenameAlbum(selectedAlbum.id, selectedAlbum.name)}
        onDeleteAlbum={() => confirmDeleteAlbum(selectedAlbum.id)}
      />
    );
  }

  if (selectedAlbumId === "__ALL__") {
    return (
      <AlbumDetailScreen
        album={{ id: "__ALL__", name: "All Photos" }}
        albums={albums}
        photos={photos}
        onBack={() => setSelectedAlbumId(null)}
        onAddPhoto={onAddPhoto}
        onToggleFavorite={onToggleFavorite}
        onUpdateCaption={onUpdateCaption}
        onUpdatePhotoDate={onUpdatePhotoDate}
        onMovePhotoToAlbum={onMovePhotoToAlbum}
        onDeletePhoto={onDeletePhoto}
        hideAlbumActions
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerGlass}>
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Ionicons name="heart" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Our Dates</Text>
            <Text style={styles.headerSub}>a little scrapbook of us 💌</Text>
          </View>
          <View style={styles.pill}>
            <Ionicons name="images" size={14} color={THEME.accent} />
            <Text style={styles.pillText}>{photos.length}</Text>
          </View>
        </View>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
        data={[{ id: "__ALL__", name: "All Photos", isAll: true }, ...albums]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isAll = item.isAll;
          const count = isAll ? photos.length : albumStats.counts.get(item.id) || 0;

          return (
            <TouchableOpacity
              style={styles.albumCard}
              onPress={() => setSelectedAlbumId(item.id)}
              activeOpacity={0.88}
            >
              <View style={[styles.cover, isAll && styles.coverAll]}>
                <Ionicons name={isAll ? "grid" : "folder"} size={24} color="#fff" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.albumName}>{item.name}</Text>
                <Text style={styles.albumMeta}>
                  {count} {count === 1 ? "photo" : "photos"}
                </Text>

                {!item.isAll && item.dateISO ? (
                  <Text style={styles.albumDateText}>📅 {formatNiceDate(item.dateISO)}</Text>
                ) : null}
              </View>

              {!isAll && (
                <>
                  <TouchableOpacity
                    onPress={() => openRenameAlbum(item.id, item.name)}
                    style={styles.iconBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil" size={18} color="rgba(31,31,36,0.65)" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => confirmDeleteAlbum(item.id)}
                    style={styles.iconBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash" size={18} color="#d11" />
                  </TouchableOpacity>
                </>
              )}
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity style={styles.fab} onPress={openCreateAlbum} activeOpacity={0.9}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal transparent visible={showNameModal} animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalTitleRow}>
              <View style={styles.modalHeart}>
                <Ionicons name="heart" size={16} color="#fff" />
              </View>
              <Text style={styles.modalTitle}>
                {nameModalMode === "create" ? "Create Album" : "Rename Album"}
              </Text>
            </View>

            {nameModalMode === "create" && (
              <>
                <Text style={styles.fieldLabel}>Date</Text>

                <TouchableOpacity
                  style={styles.dateRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (Platform.OS === "ios") setShowDatePicker((v) => !v);
                    else setShowDatePicker(true);
                  }}
                >
                  <Ionicons name="calendar" size={18} color={THEME.accent} />
                  <Text style={styles.dateText}>
                    {dateISO ? formatNiceDate(dateISO) : "Pick a date"}
                  </Text>
                  <View style={{ flex: 1 }} />
                  <Ionicons
                    name={showDatePicker ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="rgba(31,31,36,0.45)"
                  />
                </TouchableOpacity>

                {Platform.OS === "ios" && showDatePicker && (
                  <View style={styles.pickerWrap}>
                    <DateTimePicker
                      value={dateObj}
                      mode="date"
                      display="spinner"
                      onChange={handlePickerChange}
                      themeVariant="light"
                    />
                  </View>
                )}

                {Platform.OS === "android" && showDatePicker && (
                  <DateTimePicker
                    value={dateObj}
                    mode="date"
                    display="default"
                    onChange={handlePickerChange}
                  />
                )}
              </>
            )}

            <Text style={styles.fieldLabel}>Album name</Text>
            <TextInput
              value={nameValue}
              onChangeText={setNameValue}
              placeholder="Album name"
              placeholderTextColor="rgba(31,31,36,0.35)"
              style={styles.input}
              autoFocus
              autoCorrect={false}
              autoCapitalize="sentences"
              returnKeyType="done"
            />

            {nameModalMode === "create" && (
              <>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  value={descValue}
                  onChangeText={setDescValue}
                  placeholder="Write something about this date 💕"
                  placeholderTextColor="rgba(31,31,36,0.35)"
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </>
            )}

            <View style={styles.modalRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnGhost]}
                onPress={closeModal}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnTextGhost}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                activeOpacity={0.9}
                onPress={() => {
                  const v = (nameValue || "").trim();
                  if (!v) return;

                  if (nameModalMode === "create") {
                    onCreateAlbum(v, dateISO, descValue);
                  } else if (renameTargetId) {
                    onRenameAlbum(renameTargetId, v);
                  }

                  closeModal();
                }}
              >
                <Text style={styles.modalBtnTextPrimary}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },

  headerGlass: {
    marginTop: 60,
    marginHorizontal: 14,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 1,
    borderColor: THEME.border,
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 8,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: THEME.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 8,
  },
  headerTitle: {
    fontFamily: Fonts.title,
    color: THEME.text,
    fontSize: 24,
    letterSpacing: -0.4,
  },
  headerSub: {
    fontFamily: Fonts.semibold,
    color: THEME.sub,
    fontSize: 13,
    marginTop: 3,
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255, 45, 85, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 45, 85, 0.16)",
  },
  pillText: { fontFamily: Fonts.bold, color: THEME.accent, letterSpacing: -0.2 },

  albumCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  cover: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: THEME.accent2,
    alignItems: "center",
    justifyContent: "center",
  },
  coverAll: { backgroundColor: THEME.accent2 },

  albumName: {
    fontFamily: Fonts.semibold,
    fontSize: 17,
    color: THEME.text,
    letterSpacing: -0.3,
  },
  albumMeta: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: THEME.sub,
    marginTop: 3,
  },
  albumDateText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: THEME.sub,
    marginTop: 6,
  },

  iconBtn: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: "rgba(31,31,36,0.06)",
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  fab: {
    position: "absolute",
    right: 22,
    bottom: 120,
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: THEME.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(18,18,22,0.55)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
  },
  modalTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  modalHeart: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: THEME.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: { fontFamily: Fonts.title, fontSize: 20, color: THEME.text, letterSpacing: -0.3 },

  fieldLabel: {
    marginTop: 10,
    marginBottom: 6,
    color: THEME.sub,
    fontFamily: Fonts.bold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 44,
    backgroundColor: "rgba(31,31,36,0.05)",
    borderWidth: 1,
    borderColor: "rgba(60, 60, 67, 0.12)",
  },
  dateText: { fontFamily: Fonts.bold, fontSize: 16, color: THEME.text },
  pickerWrap: {
    marginTop: 10,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(31,31,36,0.05)",
    borderWidth: 1,
    borderColor: "rgba(60, 60, 67, 0.12)",
    paddingVertical: 6,
  },

  input: {
    fontFamily: Fonts.semibold,
    borderWidth: 1,
    borderColor: "rgba(60, 60, 67, 0.12)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "rgba(31,31,36,0.05)",
    minHeight: 44,
    color: THEME.text,
  },

  textArea: { minHeight: 90, paddingTop: 12 },

  modalRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  modalBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    minHeight: 46,
  },
  modalBtnGhost: {
    backgroundColor: "rgba(31,31,36,0.06)",
    borderWidth: 1,
    borderColor: "rgba(60, 60, 67, 0.12)",
  },
  modalBtnPrimary: { backgroundColor: THEME.accent },
  modalBtnTextGhost: { fontFamily: Fonts.bold, color: THEME.text, fontSize: 16 },
  modalBtnTextPrimary: { fontFamily: Fonts.bold, color: "#fff", fontSize: 16 },
});
