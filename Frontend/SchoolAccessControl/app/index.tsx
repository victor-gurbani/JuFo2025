import React, { useState, useRef } from "react";
import { View } from "react-native";
import { TextInput, Button, Snackbar, Text, Card, Title } from "react-native-paper";
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [role, setRole] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const textInputRef = useRef<TextInput>(null);
  const router = useRouter();

  const handleLogin = () => {
    const trimmedRole = role.trim().toLowerCase();
    if (trimmedRole === "admin" || trimmedRole === "teacher" || trimmedRole === "guard") {
      router.push(`${role.charAt(0).toUpperCase() + role.slice(1)}Panel`);
    } else {
      setSnackbarMessage("Invalid role. Please enter admin, teacher, or guard.");
      setSnackbarVisible(true);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ margin: 20 }}>
        <Card elevation={5} style={{ margin: 10 }}>
          <Card.Content>
            <Title>Login</Title>
            <Text>Login as (admin/teacher/guard):</Text>
            <TextInput
              ref={textInputRef}
              label="Enter role"
              value={role}
              onChangeText={setRole}
              mode="outlined"
              style={{ marginVertical: 10 }}
              onSubmitEditing={handleLogin}
              returnKeyType="done"
            />
            <Button mode="contained" onPress={handleLogin}>
              Login
            </Button>
          </Card.Content>
        </Card>
      </View>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={Snackbar.DURATION_SHORT}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          elevation: 3
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}