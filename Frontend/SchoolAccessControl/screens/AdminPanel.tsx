import React, { useEffect, useState } from "react";
import { View, ScrollView } from "react-native";
import { TextInput, Button, Snackbar, Text, Card, Title, Paragraph } from "react-native-paper";
import api from "../services/api";

export default function AdminPanel() {
  // Add a state to store the current admin/teacher’s ID
  const [currentTeacherId, setCurrentTeacherId] = useState("");
  const [dashboard, setDashboard] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [cards, setCards] = useState([]);
  const [teacherId, setTeacherId] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherPermission, setTeacherPermission] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Example of how we pass teacherId: we define an internal function that sets default config
  const apiWithTeacherId = (method: string, url: string, body?: any) => {
    if (method === "GET" || method === "DELETE") {
      return api[method.toLowerCase()](`${url}?teacherId=${currentTeacherId}`);
    } else {
      return api[method.toLowerCase()](url, { ...body, teacherId: currentTeacherId });
    }
  };

  useEffect(() => {
    // Make sure we pass teacherId in the request
    apiWithTeacherId("GET", "/admin/dashboard")
      .then((response) => {
        setDashboard(response.data.message);
      })
      .catch((err) => showSnackbar("Error: " + err));

    loadTeachers();
    loadCards();
  }, []);

  const loadTeachers = () => {
    apiWithTeacherId("GET", "/admin/teachers")
      .then((res) => setTeachers(res.data))
      .catch((err) => showSnackbar("Error: " + err));
  };

  const loadCards = () => {
    apiWithTeacherId("GET", "/admin/cards")
      .then((res) => setCards(res.data))
      .catch((err) => showSnackbar("Error: " + err));
  };

  const createTeacher = () => {
    apiWithTeacherId("POST", "/admin/teachers", {
      id: teacherId,
      name: teacherName,
      permissionLevel: teacherPermission
    })
      .then(() => {
        showSnackbar("Teacher created");
        setTeacherId("");
        setTeacherName("");
        setTeacherPermission("");
        loadTeachers();
      })
      .catch((err) => showSnackbar("Error: " + err));
  };

  const updateTeacher = () => {
    apiWithTeacherId("PUT", `/admin/teachers/${teacherId}`, {
      name: teacherName,
      permissionLevel: teacherPermission
    })
      .then(() => {
        showSnackbar("Teacher updated");
        loadTeachers();
      })
      .catch((err) => showSnackbar("Error: " + err));
  };

  const deleteTeacher = (id: string) => {
    apiWithTeacherId("DELETE", `/admin/teachers/${id}`)
      .then(() => {
        showSnackbar("Teacher deleted");
        loadTeachers();
      })
      .catch((err) => showSnackbar("Error: " + err));
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  return (
    <ScrollView style={{ margin: 20 }}>
      {/* This input allows the user/admin to define who they are */}
      <TextInput
        label="Current Admin / Teacher ID"
        value={currentTeacherId}
        onChangeText={setCurrentTeacherId}
        style={{ marginVertical: 5 }}
      />

      <Text style={{ fontWeight: "bold", marginBottom: 10 }}>Admin Panel</Text>
      <Text>Dashboard: {dashboard}</Text>

      <Text style={{ marginTop: 20, fontWeight: "bold" }}>
        Create or Update Teacher
      </Text>
      <TextInput
        label="Teacher ID"
        value={teacherId}
        onChangeText={setTeacherId}
        style={{ marginVertical: 5 }}
      />
      <TextInput
        label="Teacher Name"
        value={teacherName}
        onChangeText={setTeacherName}
        style={{ marginVertical: 5 }}
      />
      <TextInput
        label="Permission Level"
        value={teacherPermission}
        onChangeText={setTeacherPermission}
        style={{ marginVertical: 5 }}
      />

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Button mode="contained" onPress={createTeacher} style={{ margin: 5 }}>
          Create Teacher
        </Button>
        <Button mode="contained" onPress={updateTeacher} style={{ margin: 5 }}>
          Update Teacher
        </Button>
      </View>

      <Text style={{ marginVertical: 20, fontWeight: "bold" }}>
        Current Teachers
      </Text>
      {teachers.map((t: any) => (
        <Card key={t.id} style={{ marginBottom: 10, margin: 10 }} elevation={4}>
          <Card.Content>
            <Title>ID: {t.id}</Title>
            <Paragraph>Name: {t.name}</Paragraph>
            <Paragraph>Permission: {t.permissionLevel}</Paragraph>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => deleteTeacher(t.id)}>Delete</Button>
          </Card.Actions>
        </Card>
      ))}

      <Text style={{ marginVertical: 20, fontWeight: "bold" }}>All Cards</Text>
      <Button mode="contained" onPress={loadCards} style={{ marginBottom: 10 }}>
        Refresh Cards
      </Button>
      {cards.map((c: any) => (
        <Card key={c.uid} style={{ marginBottom: 10, margin: 10 }} elevation={4}>
          <Card.Content>
            <Title>Card UID: {c.uid}</Title>
            <Paragraph>Is Valid: {c.isValid ? "Yes" : "No"}</Paragraph>
          </Card.Content>
        </Card>
      ))}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
}