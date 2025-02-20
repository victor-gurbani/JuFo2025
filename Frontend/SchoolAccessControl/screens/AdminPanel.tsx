import React, { useEffect, useState } from "react";
import { View, ScrollView, Image } from "react-native";
import { TextInput, Button, Snackbar, Text, Card, Title, Paragraph, DataTable } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import api from "../services/api";
import * as ImagePicker from 'expo-image-picker';

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
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [photoUrl, setPhotoUrl] = useState("");

  const permissionLevels = ["guard", "teacher", "tutor", "admin"];

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
      loadAccessLogs();
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

  const loadAccessLogs = () => {
    apiWithTeacherId("GET", "/admin/access-logs")
      .then((res) => setAccessLogs(res.data))
      .catch((err) => showSnackbar("Error loading access logs: " + err));
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showSnackbar("Permission to access camera roll is required!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0].uri) {
        setPhotoUrl(result.assets[0].uri);
      }
    } catch (error) {
      showSnackbar("Error picking image: " + error.message);
    }
  };

  const createTeacher = () => {
    if (!teacherId || !teacherName || !teacherPermission) {
      showSnackbar("Please fill in all fields.");
      return;
    }

    apiWithTeacherId("POST", "/admin/teachers", {
      id: teacherId,
      name: teacherName,
      permissionLevel: teacherPermission,
      photoUrl: photoUrl
    })
      .then(() => {
        showSnackbar("Teacher created");
        setTeacherId("");
        setTeacherName("");
        setTeacherPermission("");
        setPhotoUrl("");
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

            <View style={{ marginVertical: 5 }}>
              <Text>Permission Level</Text>
              <View style={{ 
                borderWidth: 1, 
                borderColor: '#666',
                borderRadius: 4,
                marginTop: 5
              }}>
                <Picker
                  selectedValue={teacherPermission}
                  onValueChange={(itemValue) => setTeacherPermission(itemValue.toLowerCase())}
                  style={{ height: 50 }}
                >
                  <Picker.Item label="Select a permission level" value="" />
                  {permissionLevels.map((level) => (
                    <Picker.Item 
                      key={level} 
                      label={level.charAt(0).toUpperCase() + level.slice(1)} 
                      value={level} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={{ marginVertical: 10 }}>
              <Button mode="outlined" onPress={pickImage}>
                Pick Teacher Photo
              </Button>
              {photoUrl ? (
                <View style={{ marginTop: 10, alignItems: 'center' }}>
                  <Image
                    source={{ uri: photoUrl }}
                    style={{ width: 100, height: 100, borderRadius: 50 }}
                  />
                </View>
              ) : null}
            </View>

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

            <Card style={{ marginBottom: 20, margin: 10 }} elevation={4}>
              <Card.Content>
                <Title>Access Logs</Title>
                <Button mode="contained" onPress={loadAccessLogs} style={{ marginBottom: 10 }}>
                  Refresh Logs
                </Button>
                <ScrollView horizontal={true}>
                  <DataTable>
                    <DataTable.Header>
                      <DataTable.Title style={{ width: 200 }}>Timestamp</DataTable.Title>
                      <DataTable.Title style={{ width: 150 }}>Student</DataTable.Title>
                      <DataTable.Title style={{ width: 150 }}>Card UID</DataTable.Title>
                      <DataTable.Title style={{ width: 100 }}>Direction</DataTable.Title>
                      <DataTable.Title style={{ width: 100 }}>Approved</DataTable.Title>
                    </DataTable.Header>

                    {accessLogs.map((log) => (
                      <DataTable.Row key={log.id}>
                        <DataTable.Cell style={{ width: 200 }}>
                          {new Date(log.timestamp * 1000).toLocaleString()}
                        </DataTable.Cell>
                        <DataTable.Cell style={{ width: 150 }}>{log.student}</DataTable.Cell>
                        <DataTable.Cell style={{ width: 150 }}>{log.cardUID}</DataTable.Cell>
                        <DataTable.Cell style={{ width: 100 }}>{log.direction}</DataTable.Cell>
                        <DataTable.Cell style={{ width: 100 }}>
                          {log.wasApproved ? "Yes" : "No"}
                        </DataTable.Cell>
                      </DataTable.Row>
                    ))}
                  </DataTable>
                </ScrollView>
              </Card.Content>
            </Card>
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