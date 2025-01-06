import React, { useState } from "react";
import { View, Text, TextInput, Button, ScrollView } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import api from "../services/api";

export default function TeacherPanel() {
  const [studentId, setStudentId] = useState("");
  const [cardUID, setCardUID] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [invalidateCardUID, setInvalidateCardUID] = useState("");

  const handleAssignCard = () => {
    api.post("/teacher/assign-card", {
      studentId,
      cardUID,
      startDate,
      endDate,
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
      <DateTimePicker
        style={{ width: 200 }}
        value={startDate}
        mode="date"
        placeholder="Select start date"
        format="YYYY-MM-DD"
        minDate="2020-01-01"
        maxDate="2030-12-31"
        confirmBtnText="Confirm"
        cancelBtnText="Cancel"
        onDateChange={(date) => setStartDate(date)}
      />
      <Text style={{ marginTop: 10 }}>End Date</Text>
      <DateTimePicker
        style={{ width: 200 }}
        value={endDate}
        mode="date"
        placeholder="Select end date"
        format="YYYY-MM-DD"
        minDate="2020-01-01"
        maxDate="2030-12-31"
        confirmBtnText="Confirm"
        cancelBtnText="Cancel"
        onDateChange={(date) => setEndDate(date)}
      />
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