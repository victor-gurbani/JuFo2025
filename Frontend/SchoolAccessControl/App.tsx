import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import AdminPanel from "./screens/AdminPanel";
import TeacherPanel from "./screens/TeacherPanel";
import GuardScreen from "./screens/GuardScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="AdminPanel" component={AdminPanel} />
        <Stack.Screen name="TeacherPanel" component={TeacherPanel} />
        <Stack.Screen name="GuardScreen" component={GuardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}