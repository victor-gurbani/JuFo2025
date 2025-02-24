import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/LoginScreen";
import AdminPanel from "../screens/AdminPanel";
import TeacherPanel from "../screens/TeacherPanel";
import GuardPanel from "../screens/GuardPanel";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    // <NavigationContainer>
      <Stack.Navigator /*initialRouteName="Login"*/>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="AdminPanel" component={AdminPanel} />
        <Stack.Screen name="TeacherPanel" component={TeacherPanel} />
        <Stack.Screen name="GuardPanel" component={GuardPanel} />
      </Stack.Navigator>
    // </NavigationContainer>
  );
}