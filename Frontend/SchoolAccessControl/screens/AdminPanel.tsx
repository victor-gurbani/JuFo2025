import React, { useEffect, useState } from "react";
import { View, ScrollView } from "react-native";
import { TextInput, Button, Snackbar, Text, Card, Title, Paragraph } from "react-native-paper";
import api from "../services/api";

export default function AdminPanel() {
  const [dashboard, setDashboard] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [cards, setCards] = useState([]); // New state for cards
  const [teacherId, setTeacherId] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherPermission, setTeacherPermission] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    // Load admin dashboard info
    api.get("/admin/dashboard").then((response) => {
      setDashboard(response.data.message);
    });

    // Load teacher list
    loadTeachers();

    // Load cards list
    loadCards(); // Fetch cards on mount
  }, []);

  const loadTeachers = () => {
    api
      .get("/admin/teachers")
      .then((res) => setTeachers(res.data))
      .catch((err) => showSnackbar("Error: " + err));
  };

  const loadCards = () => { // New function to load cards
    api
      .get("/admin/cards")
      .then((res) => setCards(res.data))
      .catch((err) => showSnackbar("Error: " + err));
  };

  const createTeacher = () => {
    api
      .post("/admin/teachers", {
        id: teacherId,
        name: teacherName,
        permissionLevel: teacherPermission,
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
    api
      .put(`/admin/teachers/${teacherId}`, {
        name: teacherName,
        permissionLevel: teacherPermission,
      })
      .then(() => {
        showSnackbar("Teacher updated");
        loadTeachers();
      })
      .catch((err) => showSnackbar("Error: " + err));
  };

  const deleteTeacher = (id: string) => {
    api
      .delete(`/admin/teachers/${id}`)
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

      {/* New Section to Display All Cards */}
      <Text style={{ marginVertical: 20, fontWeight: "bold" }}>
        All Cards
      </Text>
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