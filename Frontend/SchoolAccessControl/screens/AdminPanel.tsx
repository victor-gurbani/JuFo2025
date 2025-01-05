import React, { useEffect, useState } from "react";
import { View, Text, Button, TextInput, ScrollView } from "react-native";
import api from "../services/api";

export default function AdminPanel() {
  const [dashboard, setDashboard] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherPermission, setTeacherPermission] = useState("");

  useEffect(() => {
    // Load admin dashboard info
    api.get("/admin/dashboard").then((response) => {
      setDashboard(response.data.message);
    });

    // Load teacher list
    loadTeachers();
  }, []);

  const loadTeachers = () => {
    api
      .get("/admin/teachers")
      .then((res) => setTeachers(res.data))
      .catch((err) => alert("Error: " + err));
  };

  const createTeacher = () => {
    api
      .post("/admin/teachers", {
        id: teacherId,
        name: teacherName,
        permissionLevel: teacherPermission,
      })
      .then(() => {
        alert("Teacher created");
        setTeacherId("");
        setTeacherName("");
        setTeacherPermission("");
        loadTeachers();
      })
      .catch((err) => alert("Error: " + err));
  };

  const updateTeacher = () => {
    api
      .put(`/admin/teachers/${teacherId}`, {
        name: teacherName,
        permissionLevel: teacherPermission,
      })
      .then(() => {
        alert("Teacher updated");
        loadTeachers();
      })
      .catch((err) => alert("Error: " + err));
  };

  const deleteTeacher = (id: string) => {
    api
      .delete(`/admin/teachers/${id}`)
      .then(() => {
        alert("Teacher deleted");
        loadTeachers();
      })
      .catch((err) => alert("Error: " + err));
  };

  return (
    <ScrollView style={{ margin: 20 }}>
      <Text style={{ fontWeight: "bold", marginBottom: 10 }}>Admin Panel</Text>
      <Text>Dashboard: {dashboard}</Text>

      <Text style={{ marginTop: 20, fontWeight: "bold" }}>
        Create or Update Teacher
      </Text>
      <TextInput
        placeholder="Teacher ID"
        value={teacherId}
        onChangeText={setTeacherId}
        style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
      />
      <TextInput
        placeholder="Teacher Name"
        value={teacherName}
        onChangeText={setTeacherName}
        style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
      />
      <TextInput
        placeholder="Permission Level"
        value={teacherPermission}
        onChangeText={setTeacherPermission}
        style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
      />

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Button title="Create Teacher" onPress={createTeacher} />
        <Button title="Update Teacher" onPress={updateTeacher} />
      </View>

      <Text style={{ marginVertical: 20, fontWeight: "bold" }}>
        Current Teachers
      </Text>
      {teachers.map((t: any) => (
        <View key={t.id} style={{ marginBottom: 10 }}>
          <Text>ID: {t.id}</Text>
          <Text>Name: {t.name}</Text>
          <Text>Permission: {t.permissionLevel}</Text>
          <Button title="Delete" onPress={() => deleteTeacher(t.id)} />
        </View>
      ))}
    </ScrollView>
  );
}