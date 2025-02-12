import React, { useEffect, useState } from "react";
import { View, ScrollView } from "react-native";
import { TextInput, Button, Snackbar, Text, Card, Title, Paragraph } from "react-native-paper";
import api from "../services/api";

export default function AdminPanel() {
  // State to store the current admin/teacher's ID
  const [currentTeacherId, setCurrentTeacherId] = useState("");
  const [dashboard, setDashboard] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [cards, setCards] = useState([]);
  const [teacherId, setTeacherId] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherPermission, setTeacherPermission] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Helper function to append teacherId to requests
  const apiWithTeacherId = (method: string, url: string, body?: any) => {
    if (method === "GET" || method === "DELETE") {
      return api[method.toLowerCase()](`${url}?teacherId=${currentTeacherId}`);
    } else {
      return api[method.toLowerCase()](url, { ...body, teacherId: currentTeacherId });
    }
  };

  useEffect(() => {
    if (currentTeacherId) {
      // Fetch admin dashboard info
      apiWithTeacherId("GET", "/admin/dashboard")
        .then((response) => {
          setDashboard(response.data.message);
        })
        .catch((err) => showSnackbar("Error: " + err));

      loadTeachers();
      loadCards();
    }
  }, [currentTeacherId]);

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
    <View style={{ flex: 1 }}>
      <ScrollView style={{ margin: 20 }}>
        {/* Input field for Admin/Teacher ID */}
        <TextInput
          label="Current Admin / Teacher ID"
          value={currentTeacherId}
          onChangeText={setCurrentTeacherId}
          style={{ marginVertical: 5 }}
          mode="outlined"
        />

        {currentTeacherId ? (
          <>
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
              mode="outlined"
            />
            <TextInput
              label="Teacher Name"
              value={teacherName}
              onChangeText={setTeacherName}
              style={{ marginVertical: 5 }}
              mode="outlined"
            />
            <TextInput
              label="Permission Level"
              value={teacherPermission}
              onChangeText={setTeacherPermission}
              style={{ marginVertical: 5 }}
              mode="outlined"
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
          </>
        ) : (
          <Text>Please enter your Admin or Teacher ID to proceed.</Text>
        )}
      </ScrollView>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
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