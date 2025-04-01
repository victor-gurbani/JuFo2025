import React, { useEffect, useState } from "react";
import { View, ScrollView, Image } from "react-native";
import { TextInput, Button, Snackbar, Text, Card, Title, Paragraph, DataTable, SegmentedButtons } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import api from "../services/api";
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useWindowDimensions } from 'react-native';

export default function AdminPanel() {
  const router = useRouter();
  // State to store the current admin/teacher's ID
  const [currentTeacherId, setCurrentTeacherId] = useState("");
  const [dashboard, setDashboard] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teacherPhotos, setTeacherPhotos] = useState<{[key: string]: string}>({});
  const [cards, setCards] = useState([]);
  const [teacherId, setTeacherId] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherPermission, setTeacherPermission] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('teachers');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalLogs, setTotalLogs] = useState(0);

  const permissionLevels = ["guard", "teacher", "tutor", "admin"];

  // Helper function to append teacherId to requests
  const apiWithTeacherId = (method: string, url: string, body?: any) => {
    if (method === "GET" || method === "DELETE") {
      const separator = url.includes('?') ? '&' : '?';
      return api[method.toLowerCase()](`${url}${separator}teacherId=${currentTeacherId}`);
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
      loadStudents();
    }
  }, [currentTeacherId]);

  useEffect(() => {
    if (currentTeacherId && activeTab === 'cards') {
      loadAccessLogs();
    }
  }, [currentTeacherId, currentPage, pageSize, activeTab]);

  const loadTeachers = () => {
    setTeachersLoading(true);
    apiWithTeacherId("GET", "/admin/teachers")
      .then((res) => {
        setTeachers(res.data);
        setTeachersLoading(false);
        
        // Now that we have basic data, load the photos separately
        loadTeacherPhotos();
      })
      .catch((err) => {
        showSnackbar("Error: " + err);
        setTeachersLoading(false);
      });
  };

  const loadTeacherPhotos = () => {
    apiWithTeacherId("GET", "/admin/teachers/photos")
      .then((res) => {
        const photoMap: {[key: string]: string} = {};
        res.data.forEach((item: {id: string, photoUrl: string}) => {
          if (item.id && item.photoUrl) {
            photoMap[item.id] = item.photoUrl;
          }
        });
        setTeacherPhotos(photoMap);
      })
      .catch((err) => {
        console.error("Error loading teacher photos:", err);
        // Don't show a snackbar for this - it's not critical
      });
  };

  const loadCards = () => {
    apiWithTeacherId("GET", "/admin/cards")
      .then((res) => setCards(res.data))
      .catch((err) => showSnackbar("Error: " + err));
  };

  const loadAccessLogs = () => {
    apiWithTeacherId("GET", `/admin/access-logs?page=${currentPage}&limit=${pageSize}`)
      .then((res) => {
        setAccessLogs(res.data);
        // If backend returns total count in headers or response
        if (res.headers && res.headers['x-total-count']) {
          setTotalLogs(parseInt(res.headers['x-total-count']));
        }
      })
      .catch((err) => showSnackbar("Error loading access logs: " + err));
  };

  const loadStudents = () => {
    apiWithTeacherId("GET", "/admin/students")
      .then((res) => setStudents(res.data))
      .catch((err) => showSnackbar("Error loading students: " + err));
  };

  const deleteStudent = (id: string) => {
    apiWithTeacherId("DELETE", `/admin/students/${id}`)
      .then(() => {
        showSnackbar("Student deleted");
        loadStudents();
      })
      .catch((err) => showSnackbar("Error: " + err));
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
        quality: 0.5,
        base64: true
      });

      if (!result.canceled && result.assets[0]) {
        const base64Image = result.assets[0].uri?.startsWith('data:image/')
          ? result.assets[0].uri
          : `data:image/${result.assets[0].uri.split('.').pop()?.toLowerCase() || 'jpg'};base64,${result.assets[0].base64}`;
        setPhotoUrl(base64Image);
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
    if (!teacherId || !teacherName || !teacherPermission) {
      showSnackbar("Please fill in all required fields.");
      return;
    }

    apiWithTeacherId("PUT", `/admin/teachers/${teacherId}`, {
      name: teacherName,
      permissionLevel: teacherPermission,
      photoUrl: photoUrl
    })
      .then(() => {
        showSnackbar("Teacher updated");
        setTeacherId("");
        setTeacherName("");
        setTeacherPermission("");
        setPhotoUrl("");
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

  const { width } = useWindowDimensions();

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
            <SegmentedButtons
              value={activeTab}
              onValueChange={setActiveTab}
              buttons={[
                { value: 'teachers', label: 'Teachers' },
                { value: 'students', label: 'Students' },
                { value: 'cards', label: 'Cards & Logs' }
              ]}
              style={{ marginVertical: 10 }}
            />

            {activeTab === 'teachers' && (
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

                {teachersLoading ? (
                  // Loading placeholders
                  Array(3).fill(0).map((_, index) => (
                    <Card key={`loading-${index}`} style={{ marginBottom: 10, margin: 10 }} elevation={4}>
                      <Card.Content>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View 
                            style={{
                              width: 60,
                              height: 60,
                              borderRadius: 30,
                              marginRight: 15,
                              backgroundColor: '#e0e0e0'
                            }}
                          />
                          <View style={{ flex: 1 }}>
                            <View style={{ height: 18, width: '70%', backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 8 }} />
                            <View style={{ height: 14, width: '50%', backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 8 }} />
                            <View style={{ height: 14, width: '40%', backgroundColor: '#e0e0e0', borderRadius: 4 }} />
                          </View>
                        </View>
                      </Card.Content>
                      <Card.Actions>
                        <View style={{ height: 36, width: 80, backgroundColor: '#e0e0e0', borderRadius: 4, marginRight: 8 }} />
                        <View style={{ height: 36, width: 80, backgroundColor: '#e0e0e0', borderRadius: 4 }} />
                      </Card.Actions>
                    </Card>
                  ))
                ) : teachers.filter(t => t.id && t.id.trim() !== '').length > 0 ? (
                  teachers
                    .filter(t => t.id && t.id.trim() !== '')
                    .map((t: any) => (
                      <Card key={t.id} style={{ marginBottom: 10, margin: 10 }} elevation={4}>
                        <Card.Content>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {teacherPhotos[t.id] ? (
                              <Image
                                source={{ uri: teacherPhotos[t.id] }}
                                style={{
                                  width: 60,
                                  height: 60,
                                  borderRadius: 30,
                                  marginRight: 15,
                                  backgroundColor: '#f0f0f0'
                                }}
                              />
                            ) : (
                              <View 
                                style={{
                                  width: 60,
                                  height: 60,
                                  borderRadius: 30,
                                  marginRight: 15,
                                  backgroundColor: '#e0e0e0',
                                  justifyContent: 'center',
                                  alignItems: 'center'
                                }}
                              >
                                <Text style={{ fontSize: 24, color: '#666' }}>
                                  {t.name?.charAt(0)?.toUpperCase() || '?'}
                                </Text>
                              </View>
                            )}
                            <View style={{ flex: 1 }}>
                              <Title>ID: {t.id}</Title>
                              <Paragraph>Name: {t.name}</Paragraph>
                              <Paragraph>Permission: {t.permissionLevel}</Paragraph>
                            </View>
                          </View>
                        </Card.Content>
                        <Card.Actions>
                          <Button 
                            onPress={() => {
                              setTeacherId(t.id);
                              setTeacherName(t.name);
                              setTeacherPermission(t.permissionLevel);
                              setPhotoUrl(t.photoUrl || '');
                            }}
                            style={{ marginRight: 8 }}
                          >
                            Edit
                          </Button>
                          <Button onPress={() => deleteTeacher(t.id)}>Delete</Button>
                        </Card.Actions>
                      </Card>
                    ))
                ) : (
                  <Text style={{ margin: 10, fontStyle: 'italic', color: '#666' }}>
                    No teachers found. Create a new teacher to get started.
                  </Text>
                )}
              </>
            )}

            {activeTab === 'students' && (
              <>
                <Text style={{ marginVertical: 20, fontWeight: "bold" }}>Students</Text>
                <Button mode="contained" onPress={loadStudents} style={{ marginBottom: 10 }}>
                  Refresh Students
                </Button>
                {students.map((s) => (
                  <Card key={s.id} style={{ marginBottom: 10, margin: 10 }} elevation={4}>
                    <Card.Content>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {s.photoUrl ? (
                          <Image
                            source={{ uri: s.photoUrl }}
                            style={{
                              width: 60,
                              height: 60,
                              borderRadius: 30,
                              marginRight: 15,
                              backgroundColor: '#f0f0f0'
                            }}
                          />
                        ) : (
                          <View style={{
                            width: 60,
                            height: 60,
                            borderRadius: 30,
                            marginRight: 15,
                            backgroundColor: '#e0e0e0',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}>
                            <Text style={{ fontSize: 24, color: '#666' }}>
                              {s.id.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Title>ID: {s.id}</Title>
                          {s.name && <Paragraph>Name: {s.name}</Paragraph>}
                          {s.classGroup && <Paragraph>Class: {s.classGroup}</Paragraph>}
                          {s.assignedCards && <Paragraph>Cards: {s.assignedCards}</Paragraph>}
                          {s.assignedTeachers && (
                            <Paragraph>Teachers: {s.assignedTeachers}</Paragraph>
                          )}
                        </View>
                      </View>
                    </Card.Content>
                    <Card.Actions>
                      <Button onPress={() => deleteStudent(s.id)}>Delete</Button>
                    </Card.Actions>
                  </Card>
                ))}
              </>
            )}

            {activeTab === 'cards' && (
              <>
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
                    
                    {/* Responsive pagination controls */}
                    <View style={{ 
                      flexDirection: width > 800 ? 'row' : 'column', 
                      marginTop: 15,
                      gap: 15,
                      justifyContent: width > 800 ? 'space-between' : 'flex-start',
                      alignItems: width > 800 ? 'center' : 'stretch'
                    }}>
                      <View style={{ 
                        flexDirection: width > 400 ? 'row' : 'column', 
                        alignItems: width > 400 ? 'center' : 'flex-start',
                        width: width > 800 ? undefined : '100%'
                      }}>
                        <Text style={{ 
                          marginRight: width > 400 ? 10 : 0, 
                          marginBottom: width > 400 ? 0 : 5 
                        }}>
                          Page Size:
                        </Text>
                        <SegmentedButtons
                          value={pageSize.toString()}
                          onValueChange={(value) => {
                            setPageSize(parseInt(value));
                            setCurrentPage(1); // Reset to first page when changing page size
                          }}
                          buttons={[
                            { value: '10', label: '10' },
                            { value: '20', label: '20' },
                            { value: '50', label: '50' },
                          ]}
                          style={{ 
                            width: width > 400 ? 200 : '100%', 
                            maxWidth: width > 800 ? 200 : '100%'
                          }}
                        />
                      </View>
                      
                      <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        justifyContent: width > 800 ? 'flex-end' : 'center',
                        width: width > 800 ? undefined : '100%'
                      }}>
                        <Button 
                          mode="outlined" 
                          onPress={() => {
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1);
                            }
                          }}
                          disabled={currentPage <= 1}
                          icon="chevron-left"
                          contentStyle={{ flexDirection: 'row-reverse' }}
                        >
                          {width > 500 ? "Previous" : ""}
                        </Button>
                        <Text style={{ marginHorizontal: 15 }}>Page {currentPage}</Text>
                        <Button 
                          mode="outlined" 
                          onPress={() => {
                            setCurrentPage(currentPage + 1);
                          }}
                          disabled={accessLogs.length < pageSize} // Disable if current page has fewer items than page size
                          icon="chevron-right"
                        >
                          {width > 500 ? "Next" : ""}
                        </Button>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              </>
            )}
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