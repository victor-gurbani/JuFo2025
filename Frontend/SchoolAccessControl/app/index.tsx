import React, { useState, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import { TextInput, Button, Snackbar, Text, Card, Title, SegmentedButtons } from "react-native-paper";
import { useRouter } from 'expo-router';
import ThemeToggle from '../components/ThemeToggle';
import { useAppTheme } from '../theme/ThemeContext';
import api from '../services/api';

export default function LoginScreen() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [guardOption, setGuardOption] = useState("regular");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"admin" | "teacher" | "guard" | "student" | "">(""); // Track selected role
  const textInputRef = useRef<TextInput>(null);
  const router = useRouter();
  const { theme } = useAppTheme();

  const handleLogin = async () => {
    if (!id || !password) {
      setSnackbarMessage("Please enter both ID and password");
      setSnackbarVisible(true);
      return;
    }

    if (!role) {
      setSnackbarMessage("Please select a role");
      setSnackbarVisible(true);
      return;
    }

    setIsLoading(true);

    try {
      let response;
      
      if (role === "student") {
        // Student login with just studentId
        response = await api.post("/auth/login-student", {
          studentId: id,
        });
      } else {
        // Teacher/Guard/Admin login with id and password
        response = await api.post("/auth/login", {
          id,
          password,
        });
      }

      if (response.data?.token) {
        // Store token in global state (can be enhanced with AsyncStorage later)
        (global as any).__authToken = response.data.token;

        // Navigate based on role
        if (role === "admin") {
          router.push("/AdminPanel");
        } else if (role === "teacher") {
          router.push("/TeacherPanel");
        } else if (role === "guard") {
          router.push(guardOption === "face" ? "/GuardFacePanel" : "/GuardPanel");
        } else if (role === "student") {
          router.push("/StudentPanel");
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || "Login failed";
      setSnackbarMessage(errorMessage);
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ margin: 20 }}>
        <Card elevation={5} style={{ margin: 10 }}>
          <Card.Content>
            <Title>School Access Control</Title>
            <Text style={{ marginBottom: 15 }}>Login to your account</Text>

            {/* Role selection */}
            <Text style={{ marginBottom: 10, fontWeight: "600" }}>Select Role:</Text>
            <SegmentedButtons
              value={role}
              onValueChange={(value) => setRole(value as "admin" | "teacher" | "guard" | "student")}
              buttons={[
                { value: "admin", label: "Admin" },
                { value: "teacher", label: "Teacher" },
                { value: "guard", label: "Guard" },
                { value: "student", label: "Student" },
              ]}
              style={{ marginBottom: 20 }}
            />

            {/* ID/StudentID Input */}
            <TextInput
              ref={textInputRef}
              label={role === "student" ? "Student ID" : "User ID"}
              value={id}
              onChangeText={setId}
              mode="outlined"
              style={{ marginVertical: 10 }}
              disabled={!role || isLoading}
              editable={!!role && !isLoading}
            />

            {/* Password Input (not needed for students) */}
            {role !== "student" && (
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                style={{ marginVertical: 10 }}
                disabled={!role || isLoading}
                editable={!!role && !isLoading}
              />
            )}

            {/* Guard options only visible when guard is selected */}
            {role === "guard" && (
              <Card elevation={2} style={{ marginVertical: 15, padding: 10 }}>
                <Text style={{ marginBottom: 10, fontWeight: "600" }}>Select panel type:</Text>
                <SegmentedButtons
                  value={guardOption}
                  onValueChange={setGuardOption}
                  buttons={[
                    { value: "regular", label: "Regular Panel" },
                    { value: "face", label: "Face Recognition" },
                  ]}
                  style={{ marginBottom: 10 }}
                />
              </Card>
            )}

            {/* Add theme toggle switch */}
            <ThemeToggle />

            {/* Login Button */}
            <Button
              mode="contained"
              onPress={handleLogin}
              style={{ marginTop: 20 }}
              disabled={!id || (!role || (role !== "student" && !password)) || isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>

            {isLoading && (
              <View style={{ justifyContent: "center", alignItems: "center", marginTop: 20 }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            )}
          </Card.Content>
        </Card>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={Snackbar.DURATION_SHORT}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          elevation: 3,
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}
