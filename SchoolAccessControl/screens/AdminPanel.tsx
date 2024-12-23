import React, { useEffect, useState } from "react";
import { View, Text, Button } from "react-native";
import api from "../services/api";

export default function AdminPanel() {
  const [dashboard, setDashboard] = useState("");

  useEffect(() => {
    api.get("/admin/dashboard").then(response => {
      setDashboard(response.data.message);
    });
  }, []);

  return (
    <View style={{ margin: 20 }}>
      <Text>Admin Panel</Text>
      <Text>{dashboard}</Text>
      <Button title="Create Teacher" onPress={() => { /* handle creation */ }} />
    </View>
  );
}