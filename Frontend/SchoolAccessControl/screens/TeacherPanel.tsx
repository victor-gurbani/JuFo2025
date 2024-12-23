import React from "react";
import { View, Text, Button } from "react-native";
import api from "../services/api";

export default function TeacherPanel() {
  const handleAssignCard = () => {
    // Example call
    api.post("/teacher/assign-card", { studentId: "123", cardUID: "abc123" })
      .then(() => alert("Card assigned"));
  };

  return (
    <View style={{ margin: 20 }}>
      <Text>Teacher Panel</Text>
      <Button title="Assign Card" onPress={handleAssignCard} />
    </View>
  );
}