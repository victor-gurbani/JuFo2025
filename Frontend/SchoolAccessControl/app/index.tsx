import React, { useState, useRef } from "react";
import { View } from "react-native";
import { TextInput, Button, Snackbar, Text, Card, Title, SegmentedButtons } from "react-native-paper";
import { useRouter } from 'expo-router';
import ThemeToggle from '../components/ThemeToggle';
import { useAppTheme } from '../theme/ThemeContext';

export default function LoginScreen() {
  const [role, setRole] = useState("");
  const [guardOption, setGuardOption] = useState("regular");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const textInputRef = useRef<TextInput>(null);
  const router = useRouter();
  const { theme } = useAppTheme();

  const handleLogin = () => {
    const trimmedRole = role.trim().toLowerCase();
    
    if (trimmedRole === "admin" || trimmedRole === "teacher") {
      router.push(`${role.charAt(0).toUpperCase() + role.slice(1)}Panel`);
    } else if (trimmedRole === "guard") {
      // Route to the appropriate guard panel based on selected option
      router.push(guardOption === "face" ? "GuardFacePanel" : "GuardPanel");
    } else {
      setSnackbarMessage("Invalid role. Please enter admin, teacher, or guard.");
      setSnackbarVisible(true);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
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
            
            {/* Guard options only visible when guard is entered */}
            {role.trim().toLowerCase() === "guard" && (
              <Card elevation={2} style={{ marginVertical: 10, padding: 10 }}>
                <Text style={{ marginBottom: 10 }}>Select guard panel type:</Text>
                <SegmentedButtons
                  value={guardOption}
                  onValueChange={setGuardOption}
                  buttons={[
                    { value: 'regular', label: 'Regular Panel' },
                    { value: 'face', label: 'Face Recognition Panel' },
                  ]}
                  style={{ marginBottom: 10 }}
                />
              </Card>
            )}
            
            {/* Add theme toggle switch */}
            <ThemeToggle />
            
            <Button mode="contained" onPress={handleLogin} style={{ marginTop: 10 }}>
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