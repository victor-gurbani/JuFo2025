import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";

export default function LoginScreen({ navigation }) {
  const [role, setRole] = useState("");

  const handleLogin = () => {
    // Simple example to route based on role
    if (role === "admin") {
      navigation.navigate("AdminPanel");
    } else if (role === "teacher") {
      navigation.navigate("TeacherPanel");
    } else if (role === "guard") {
      navigation.navigate("GuardScreen");
    }
  };

  return (
    <View style={{ margin: 20 }}>
      <Text>Login as (admin/teacher/guard):</Text>
      <TextInput
        placeholder="Enter role"
        value={role}
        onChangeText={setRole}
        style={{ borderWidth: 1, marginVertical: 10, padding: 5 }}
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}