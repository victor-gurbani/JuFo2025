import React, { useState } from "react";
import { View } from "react-native";
import { TextInput, Button, Snackbar, Text, Card, Title } from "react-native-paper";

export default function LoginScreen({ navigation }) {
  const [role, setRole] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const handleLogin = () => {
    const trimmedRole = role.trim().toLowerCase();
    if (trimmedRole === "admin" || trimmedRole === "teacher" || trimmedRole === "guard") {
      navigation.navigate(`${role.charAt(0).toUpperCase() + role.slice(1)}Panel`);
    } else {
      setSnackbarMessage("Invalid role. Please enter admin, teacher, or guard.");
      setSnackbarVisible(true);
    }
  };

  return (
    <View style={{ margin: 20 }}>
      <Card>
        <Card.Content>
          <Title>Login</Title>
          <Text>Login as (admin/teacher/guard):</Text>
          <TextInput
            label="Enter role"
            value={role}
            onChangeText={setRole}
            mode="outlined"
            style={{ marginVertical: 10 }}
          />
          <Button mode="contained" onPress={handleLogin}>
            Login
          </Button>
        </Card.Content>
      </Card>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={Snackbar.DURATION_SHORT}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}