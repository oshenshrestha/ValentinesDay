import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
  FlatList,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import * as ExpoCalendar from "expo-calendar";
import DateTimePicker from "@react-native-community/datetimepicker";

import { loadData, saveData } from "../storage/storage";
import { Fonts } from "../theme/typography";

const STORAGE_KEY = "planned_events_v2"; // bumped version because we now store time

const THEME = {
  text: "#1F1F24",
  sub: "rgba(31,31,36,0.60)",
  card: "rgba(255,255,255,0.86)",
  border: "rgba(60, 60, 67, 0.14)",
  accent: "#FF2D55",
};

function isoDateOnly(d) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function timeToHHMM(d) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; // 24h "HH:MM"
}

function formatTimePretty(hhmm) {
  // "14:05" -> "2:05 PM"
  const [hStr, mStr] = (hhmm || "12:00").split(":");
  const h = Math.max(0, Math.min(23, parseInt(hStr, 10) || 0));
  const m = Math.max(0, Math.min(59, parseInt(mStr, 10) || 0));
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${pad2(m)} ${suffix}`;
}

function combineDateAndTime(dateISO, timeHHMM) {
  // Creates a local Date from date + time
  const [y, mo, d] = dateISO.split("-").map((x) => parseInt(x, 10));
  const [hh, mm] = (timeHHMM || "12:00").split(":").map((x) => parseInt(x, 10));
  return new Date(y, (mo || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
}

async function getDefaultDeviceCalendarId() {
  const calendars = await ExpoCalendar.getCalendarsAsync(ExpoCalendar.EntityTypes.EVENT);
  const writable = calendars.filter((c) => c.allowsModifications);
  if (writable.length > 0) return writable[0].id;
  if (calendars.length > 0) return calendars[0].id;
  return null;
}

export default function CalendarScreen() {
  const today = useMemo(() => isoDateOnly(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(today);

  // events now include timeHHMM + durationMins
  // {id, dateISO, timeHHMM, durationMins, title, notes, deviceEventId?}
  const [events, setEvents] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [syncToDevice, setSyncToDevice] = useState(true);

  // time controls
  const [timeObj, setTimeObj] = useState(() => {
    const d = new Date();
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);
    d.setHours(Math.min(23, d.getHours() + 1)); // default: next hour
    return d;
  });
  const [timeHHMM, setTimeHHMM] = useState(timeToHHMM(timeObj));
  const [durationMins, setDurationMins] = useState(60);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // permissions / chosen calendar
  const [calendarPermission, setCalendarPermission] = useState("unknown");
  const [deviceCalendarId, setDeviceCalendarId] = useState(null);

  useEffect(() => {
    (async () => {
      const loaded = await loadData(STORAGE_KEY, []);
      setEvents(Array.isArray(loaded) ? loaded : []);

      try {
        const { status } = await ExpoCalendar.requestCalendarPermissionsAsync();
        setCalendarPermission(status);
        if (status === "granted") {
          const id = await getDefaultDeviceCalendarId();
          setDeviceCalendarId(id);
        }
      } catch {
        setCalendarPermission("denied");
      }
    })();
  }, []);

  useEffect(() => {
    saveData(STORAGE_KEY, events).catch(() => {});
  }, [events]);

  const markedDates = useMemo(() => {
    const marked = {};
    for (const e of events) {
      marked[e.dateISO] = { marked: true, dotColor: THEME.accent };
    }
    marked[selectedDate] = {
      ...(marked[selectedDate] || {}),
      selected: true,
      selectedColor: "rgba(255,45,85,0.85)",
      selectedTextColor: "#fff",
    };
    return marked;
  }, [events, selectedDate]);

  const futureEventsSorted = useMemo(() => {
    const nowISO = isoDateOnly(new Date());
    return [...events]
      .filter((e) => e.dateISO >= nowISO)
      .sort((a, b) => {
        if (a.dateISO !== b.dateISO) return a.dateISO < b.dateISO ? -1 : 1;
        // same day: sort by time
        return (a.timeHHMM || "00:00") < (b.timeHHMM || "00:00") ? -1 : 1;
      });
  }, [events]);

  const openAddModalForDate = (dateISO) => {
    setSelectedDate(dateISO);
    setTitle("");
    setNotes("");
    setSyncToDevice(true);

    const d = new Date();
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);
    d.setHours(Math.min(23, d.getHours() + 1));
    setTimeObj(d);
    setTimeHHMM(timeToHHMM(d));
    setDurationMins(60);

    setShowModal(true);
  };

  const ensureCalendarPermission = async () => {
    try {
      const { status } = await ExpoCalendar.requestCalendarPermissionsAsync();
      setCalendarPermission(status);
      if (status === "granted") {
        const id = await getDefaultDeviceCalendarId();
        setDeviceCalendarId(id);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const createDeviceEvent = async ({ dateISO, timeHHMM, durationMins, title, notes }) => {
    if (Platform.OS === "web") return null;

    const ok = await ensureCalendarPermission();
    if (!ok) return null;

    const calId = deviceCalendarId || (await getDefaultDeviceCalendarId());
    if (!calId) return null;

    const start = combineDateAndTime(dateISO, timeHHMM);
    const end = new Date(start.getTime() + Math.max(15, durationMins || 60) * 60 * 1000);

    const eventId = await ExpoCalendar.createEventAsync(calId, {
      title,
      notes: notes || "",
      startDate: start,
      endDate: end,
      timeZone: undefined,
      alarms: [{ relativeOffset: -60 }], // 1 hour before
    });

    return eventId;
  };

  const addEvent = async () => {
    const t = (title || "").trim();
    if (!t) return;

    const nowISO = isoDateOnly(new Date());
    if (selectedDate < nowISO) {
      Alert.alert("Pick a future date", "This calendar tab is for planning upcoming dates 💗");
      return;
    }

    let deviceEventId = null;

    if (syncToDevice) {
      try {
        deviceEventId = await createDeviceEvent({
          dateISO: selectedDate,
          timeHHMM,
          durationMins,
          title: t,
          notes,
        });

        if (!deviceEventId && Platform.OS !== "web") {
          Alert.alert(
            "Added in app",
            "Saved in the app, but couldn’t add it to your phone calendar. Enable Calendar permissions in Settings."
          );
        }
      } catch {
        Alert.alert("Added in app", "Saved in app, but phone calendar sync failed.");
      }
    }

    const newItem = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      dateISO: selectedDate,
      timeHHMM,
      durationMins,
      title: t,
      notes: notes || "",
      deviceEventId: deviceEventId || null,
      createdAt: new Date().toISOString(),
    };

    setEvents((prev) => [newItem, ...prev]);
    setShowModal(false);
  };

  const deleteEvent = async (event) => {
    Alert.alert(
      "Delete this plan?",
      "This removes it from the app. If it was synced, it will also delete from your phone calendar.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setEvents((prev) => prev.filter((x) => x.id !== event.id));

            if (event.deviceEventId && Platform.OS !== "web") {
              try {
                const ok = await ensureCalendarPermission();
                if (ok) await ExpoCalendar.deleteEventAsync(event.deviceEventId);
              } catch {
                // ignore
              }
            }
          },
        },
      ]
    );
  };

  const onTimePickerChange = (event, selected) => {
    if (Platform.OS === "android") setShowTimePicker(false);
    if (event?.type === "dismissed") return;

    const next = selected || timeObj;
    setTimeObj(next);
    setTimeHHMM(timeToHHMM(next));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerGlass}>
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Ionicons name="calendar" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Calendar</Text>
            <Text style={styles.headerSub}>plan future dates + sync to your phone 💌</Text>
          </View>

          <TouchableOpacity
            style={styles.addPill}
            onPress={() => openAddModalForDate(selectedDate)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color={THEME.accent} />
            <Text style={styles.addPillText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.calendarWrap}>
        <Calendar
          markedDates={markedDates}
          onDayPress={(day) => {
            setSelectedDate(day.dateString);
            openAddModalForDate(day.dateString);
          }}
          theme={{
            backgroundColor: "transparent",
            calendarBackground: "transparent",
            textSectionTitleColor: "rgba(31,31,36,0.55)",
            selectedDayBackgroundColor: THEME.accent,
            selectedDayTextColor: "#fff",
            todayTextColor: THEME.accent,
            dayTextColor: THEME.text,
            monthTextColor: THEME.text,
            textDayFontWeight: "700",
            textMonthFontWeight: "900",
            textDayHeaderFontWeight: "800",
            arrowColor: THEME.accent,
            dotColor: THEME.accent,
          }}
          style={styles.calendar}
        />
      </View>

      <Text style={styles.sectionHeader}>Upcoming</Text>

      {futureEventsSorted.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="sparkles" size={40} color="rgba(255,45,85,0.35)" />
          <Text style={styles.emptyTitle}>No plans yet</Text>
          <Text style={styles.emptySub}>Tap a date to add a cute future plan 💗</Text>
        </View>
      ) : (
        <FlatList
          data={futureEventsSorted}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 160 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSub}>
                  📅 {item.dateISO} • ⏰ {formatTimePretty(item.timeHHMM)}{" "}
                  {item.deviceEventId ? " • synced to phone" : ""}
                </Text>
                {!!item.notes && <Text style={styles.cardNotes}>{item.notes}</Text>}
              </View>

              <TouchableOpacity onPress={() => deleteEvent(item)} style={styles.trashBtn} activeOpacity={0.7}>
                <Ionicons name="trash" size={18} color="#d11" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalTitleRow}>
              <View style={styles.modalHeart}>
                <Ionicons name="heart" size={16} color="#fff" />
              </View>
              <Text style={styles.modalTitle}>Plan for {selectedDate}</Text>
            </View>

            <Text style={styles.label}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Dinner, movie, picnic..."
              placeholderTextColor="rgba(31,31,36,0.35)"
              style={styles.input}
              autoFocus
            />

            <Text style={styles.label}>Time</Text>
            <TouchableOpacity
              style={styles.timeRow}
              activeOpacity={0.8}
              onPress={() => {
                if (Platform.OS === "ios") setShowTimePicker((v) => !v);
                else setShowTimePicker(true);
              }}
            >
              <Ionicons name="time" size={18} color={THEME.accent} />
              <Text style={styles.timeText}>{formatTimePretty(timeHHMM)}</Text>
              <View style={{ flex: 1 }} />
              <Ionicons
                name={showTimePicker ? "chevron-up" : "chevron-down"}
                size={18}
                color="rgba(31,31,36,0.45)"
              />
            </TouchableOpacity>

            {Platform.OS === "ios" && showTimePicker && (
              <View style={styles.pickerWrap}>
                <DateTimePicker
                  value={timeObj}
                  mode="time"
                  display="spinner"
                  onChange={onTimePickerChange}
                  themeVariant="light"
                />
              </View>
            )}

            {Platform.OS === "android" && showTimePicker && (
              <DateTimePicker value={timeObj} mode="time" display="default" onChange={onTimePickerChange} />
            )}

            <Text style={styles.label}>Duration</Text>
            <View style={styles.durationRow}>
              {[30, 60, 90, 120].map((m) => {
                const active = durationMins === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.dChip, active && styles.dChipOn]}
                    onPress={() => setDurationMins(m)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.dChipText, active && styles.dChipTextOn]}>{m}m</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Outfit idea, reservation time, etc."
              placeholderTextColor="rgba(31,31,36,0.35)"
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.syncRow, syncToDevice && styles.syncRowOn]}
              activeOpacity={0.85}
              onPress={() => setSyncToDevice((v) => !v)}
            >
              <Ionicons
                name={syncToDevice ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={syncToDevice ? THEME.accent : "rgba(31,31,36,0.45)"}
              />
              <Text style={styles.syncText}>Also add to my phone calendar</Text>
            </TouchableOpacity>

            {Platform.OS !== "web" && calendarPermission === "denied" ? (
              <Text style={styles.permissionNote}>
                Calendar permission is off. You can enable it in your phone Settings to sync events.
              </Text>
            ) : null}

            <View style={styles.modalRow}>
              <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => setShowModal(false)} activeOpacity={0.85}>
                <Text style={styles.btnGhostText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={addEvent} activeOpacity={0.9}>
                <Text style={styles.btnPrimaryText}>Save</Text>
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
  headerTitle: { fontFamily: Fonts.title, color: THEME.text, fontSize: 22, letterSpacing: -0.4 },
  headerSub: { fontFamily: Fonts.semibold, color: THEME.sub, fontSize: 13, marginTop: 3 },

  addPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255, 45, 85, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 45, 85, 0.16)",
  },
  addPillText: { fontFamily: Fonts.bold, color: THEME.accent },

  calendarWrap: {
    marginTop: 12,
    marginHorizontal: 14,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 20,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  calendar: { borderRadius: 16 },

  sectionHeader: {
    marginTop: 16,
    marginBottom: 10,
    marginLeft: 18,
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: THEME.sub,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  empty: { alignItems: "center", padding: 30 },
  emptyTitle: { marginTop: 10, fontSize: 18, fontFamily: Fonts.bold, color: THEME.text },
  emptySub: { marginTop: 6, color: THEME.sub, textAlign: "center", fontFamily: Fonts.semibold },

  card: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  cardTitle: { fontFamily: Fonts.bold, fontSize: 16, color: THEME.text, letterSpacing: -0.2 },
  cardSub: { marginTop: 4, color: THEME.sub, fontFamily: Fonts.semibold },
  cardNotes: { marginTop: 8, color: "rgba(31,31,36,0.75)", fontFamily: Fonts.semibold, lineHeight: 18 },

  trashBtn: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: "rgba(31,31,36,0.06)",
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
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
  modalTitle: { fontFamily: Fonts.title, fontSize: 18, color: THEME.text, letterSpacing: -0.2 },

  label: {
    marginTop: 10,
    marginBottom: 6,
    color: THEME.sub,
    fontFamily: Fonts.bold,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  input: {
    borderWidth: 1,
    borderColor: "rgba(60, 60, 67, 0.12)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "rgba(31,31,36,0.05)",
    minHeight: 44,
    color: THEME.text,
    fontFamily: Fonts.semibold,
  },
  textArea: { minHeight: 90, paddingTop: 12 },

  timeRow: {
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
  timeText: { fontFamily: Fonts.bold, fontSize: 16, color: THEME.text },

  pickerWrap: {
    marginTop: 10,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(31,31,36,0.05)",
    borderWidth: 1,
    borderColor: "rgba(60, 60, 67, 0.12)",
    paddingVertical: 6,
  },

  durationRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(31,31,36,0.05)",
    borderWidth: 1,
    borderColor: "rgba(60, 60, 67, 0.12)",
  },
  dChipOn: {
    backgroundColor: "rgba(255,45,85,0.08)",
    borderColor: "rgba(255,45,85,0.18)",
  },
  dChipText: { fontFamily: Fonts.bold, color: "rgba(31,31,36,0.65)" },
  dChipTextOn: { color: THEME.accent },

  syncRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(31,31,36,0.05)",
    borderWidth: 1,
    borderColor: "rgba(60, 60, 67, 0.12)",
  },
  syncRowOn: {
    borderColor: "rgba(255, 45, 85, 0.22)",
    backgroundColor: "rgba(255, 45, 85, 0.06)",
  },
  syncText: { fontFamily: Fonts.bold, color: THEME.text },

  permissionNote: { marginTop: 10, color: "rgba(31,31,36,0.55)", fontFamily: Fonts.semibold, lineHeight: 18 },

  modalRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  btn: { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: "center", minHeight: 46 },
  btnGhost: { backgroundColor: "rgba(31,31,36,0.06)", borderWidth: 1, borderColor: "rgba(60, 60, 67, 0.12)" },
  btnPrimary: { backgroundColor: THEME.accent },
  btnGhostText: { color: THEME.text, fontFamily: Fonts.bold, fontSize: 16 },
  btnPrimaryText: { color: "#fff", fontFamily: Fonts.bold, fontSize: 16 },
});
