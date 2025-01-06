import React, { useState } from "react";
import { Snackbar } from "react-native-paper";
import { View, Text, TextInput, ScrollView } from "react-native";
import { Button } from "react-native-paper";
import { DatePickerModal, TimePickerModal } from "react-native-paper-dates";
import api from "../services/api";
import "react-native-paper-dates"; // For date formatting

export default function TeacherPanel() {
  const [studentId, setStudentId] = useState("");
  const [cardUID, setCardUID] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endTime, setEndTime] = useState<Date | undefined>(undefined);
  const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [isStartTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);
  const [isEndTimePickerVisible, setEndTimePickerVisible] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState("");
  const [permissions, setPermissions] = useState<any[]>([]);
  const [invalidateCardUID, setInvalidateCardUID] = useState("");

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleAssignCard = () => {
    if (!startDate || !startTime || !endDate || !endTime) {
      showSnackbar("Please select all date and time values.");
      return;
    }

    const startDateTime = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
      startTime.getHours(),
      startTime.getMinutes()
    );

    const endDateTime = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
      endTime.getHours(),
      endTime.getMinutes()
    );

    api.post("/teacher/assign-card", {
      studentId,
      cardUID,
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
      isRecurring,
      recurrencePattern,
    })
      .then(() => showSnackbar("Card assigned"))
      .catch((err) => showSnackbar("Error: " + err));
  };

  const handleInvalidateCard = () => {
    api.post("/teacher/invalidate-card", { cardUID: invalidateCardUID })
      .then(() => showSnackbar("Card invalidated"))
      .catch((err) => showSnackbar("Error: " + err));
  };

  const handleViewPermissions = () => {
    api.get("/teacher/permissions")
      .then((res) => setPermissions(res.data))
      .catch((err) => showSnackbar("Error: " + err));
  };

  return (
    <ScrollView style={{ margin: 20 }}>
      <Text style={{ fontWeight: "bold", marginBottom: 10 }}>Assign a Card</Text>
      <TextInput
        placeholder="Student ID"
        value={studentId}
        onChangeText={setStudentId}
        style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
      />
      <TextInput
        placeholder="Card UID"
        value={cardUID}
        onChangeText={setCardUID}
        style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
      />

      <Text style={{ marginTop: 10 }}>Start Date</Text>
      <Button onPress={() => setStartDatePickerVisible(true)}>Select Start Date</Button>
      <DatePickerModal
        mode="single"
        locale="en"
        visible={isStartDatePickerVisible}
        onDismiss={() => setStartDatePickerVisible(false)}
        date={startDate}
        onConfirm={(params: { date: Date }) => {
          setStartDate(params.date);
          setStartDatePickerVisible(false);
        }}
      />
      <Text>Selected Start Date: {startDate?.toDateString() || "None"}</Text>

      <Text style={{ marginTop: 10 }}>Start Time</Text>
      <Button onPress={() => setStartTimePickerVisible(true)}>Select Start Time</Button>
      <TimePickerModal
        visible={isStartTimePickerVisible}
        onDismiss={() => setStartTimePickerVisible(false)}
        onConfirm={(params) => {
          setStartTime(params.hours != null ? new Date(0, 0, 0, params.hours, params.minutes) : undefined);
          setStartTimePickerVisible(false);
        }}
      />
      <Text>Selected Start Time: {startTime?.toLocaleTimeString() || "None"}</Text>

      <DatePickerModal
        mode="single"
        locale="en"
        visible={isEndDatePickerVisible}
        onDismiss={() => setEndDatePickerVisible(false)}
        date={endDate}
        onConfirm={(params: { date: Date }) => {
          setEndDate(params.date);
          setEndDatePickerVisible(false);
        }}
      />
        }}
      />
      <Text>Selected End Date: {endDate?.toDateString() || "None"}</Text>

      <Text style={{ marginTop: 10 }}>End Time</Text>
      <Button onPress={() => setEndTimePickerVisible(true)}>Select End Time</Button>
      <TimePickerModal
        visible={isEndTimePickerVisible}
        onDismiss={() => setEndTimePickerVisible(false)}
        onConfirm={(params) => {
          setEndTime(params.hours != null ? new Date(0, 0, 0, params.hours, params.minutes) : undefined);
          setEndTimePickerVisible(false);
        }}
      />
      <Text>Selected End Time: {endTime?.toLocaleTimeString() || "None"}</Text>

      <TextInput
        placeholder="Recurrence Pattern"
        value={recurrencePattern}
        onChangeText={setRecurrencePattern}
        style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
      />
      <View style={{ flexDirection: "row", marginVertical: 10 }}>
        <Button onPress={() => setIsRecurring(!isRecurring)}>
          {isRecurring ? "Recurring: ON" : "Recurring: OFF"}
        </Button>
      </View>
      <Button onPress={handleAssignCard}>Assign Card</Button>

      <Text style={{ fontWeight: "bold", marginVertical: 10 }}>Invalidate a Card</Text>
      <TextInput
        placeholder="Card UID"
        value={invalidateCardUID}
        onChangeText={setInvalidateCardUID}
        style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
      />
      <Button onPress={handleInvalidateCard}>Invalidate Card</Button>

      <Text style={{ fontWeight: "bold", marginVertical: 10 }}>View Permissions</Text>
      <Button onPress={handleViewPermissions}>Load Permissions</Button>
      {permissions.map((perm, i) => (
        <Text key={i} style={{ marginTop: 5 }}>
          {JSON.stringify(perm)}
        </Text>
      ))}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={Snackbar.DURATION_SHORT}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
}
