import React, { useState } from "react";
import { View, Text, TextInput, Button, ScrollView } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import api from "../services/api";

export default function TeacherPanel() {
  const [studentId, setStudentId] = useState("");
  const [cardUID, setCardUID] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [invalidateCardUID, setInvalidateCardUID] = useState("");

  const handleAssignCard = () => {
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
      .then(() => alert("Card assigned"))
      .catch((err) => alert("Error: " + err));
  };

  const handleInvalidateCard = () => {
    api.post("/teacher/invalidate-card", { cardUID: invalidateCardUID })
      .then(() => alert("Card invalidated"))
      .catch((err) => alert("Error: " + err));
  };

  const handleViewPermissions = () => {
    api.get("/teacher/permissions")
      .then((res) => setPermissions(res.data))
      .catch((err) => alert("Error: " + err));
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
      <Button title="Select Start Date" onPress={() => setShowStartDatePicker(true)} />
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) setStartDate(selectedDate);
          }}
        />
      )}
      <Text>Selected Start Date: {startDate.toDateString()}</Text>

      <Text style={{ marginTop: 10 }}>Start Time</Text>
      <Button title="Select Start Time" onPress={() => setShowStartTimePicker(true)} />
      {showStartTimePicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowStartTimePicker(false);
            if (selectedTime) setStartTime(selectedTime);
          }}
        />
      )}
      <Text>Selected Start Time: {startTime.toLocaleTimeString()}</Text>

      <Text style={{ marginTop: 10 }}>End Date</Text>
      <Button title="Select End Date" onPress={() => setShowEndDatePicker(true)} />
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) setEndDate(selectedDate);
          }}
        />
      )}
      <Text>Selected End Date: {endDate.toDateString()}</Text>

      <Text style={{ marginTop: 10 }}>End Time</Text>
      <Button title="Select End Time" onPress={() => setShowEndTimePicker(true)} />
      {showEndTimePicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowEndTimePicker(false);
            if (selectedTime) setEndTime(selectedTime);
          }}
        />
      )}
      <Text>Selected End Time: {endTime.toLocaleTimeString()}</Text>

      <TextInput
        placeholder="Recurrence Pattern"
        value={recurrencePattern}
        onChangeText={setRecurrencePattern}
        style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
      />
      <View style={{ flexDirection: "row", marginVertical: 10 }}>
        <Button
          title={isRecurring ? "Recurring: ON" : "Recurring: OFF"}
          onPress={() => setIsRecurring(!isRecurring)}
        />
      </View>
      <Button title="Assign Card" onPress={handleAssignCard} />

      <Text style={{ fontWeight: "bold", marginVertical: 10 }}>Invalidate a Card</Text>
      <TextInput
        placeholder="Card UID"
        value={invalidateCardUID}
        onChangeText={setInvalidateCardUID}
        style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
      />
      <Button title="Invalidate Card" onPress={handleInvalidateCard} />

      <Text style={{ fontWeight: "bold", marginVertical: 10 }}>View Permissions</Text>
      <Button title="Load Permissions" onPress={handleViewPermissions} />
      {permissions.map((perm, i) => (
        <Text key={i} style={{ marginTop: 5 }}>
          {JSON.stringify(perm)}
        </Text>
      ))}
    </ScrollView>
  );
}
