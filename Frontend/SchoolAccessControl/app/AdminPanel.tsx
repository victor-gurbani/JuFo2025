import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, ScrollView, Image } from "react-native";
import { TextInput, Button, Snackbar, Text, Card, Title, Paragraph, DataTable, SegmentedButtons, Portal, Modal, ActivityIndicator } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import api from "../services/api";
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { useAppTheme } from '../theme/ThemeContext'; // Add this import

export default function AdminPanel() {
  const router = useRouter();
  const { theme } = useAppTheme(); // Get the current theme
  // State to store the current admin/teacher's ID
  const [inputTeacherId, setInputTeacherId] = useState("");
  const [committedTeacherId, setCommittedTeacherId] = useState("");
  const idInputTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isCreatingTeacher, setIsCreatingTeacher] = useState(false);
  const [isUpdatingTeacher, setIsUpdatingTeacher] = useState(false);
  const [isDeletingTeacher, setIsDeletingTeacher] = useState<string | null>(null);
  const [isDeletingStudent, setIsDeletingStudent] = useState<string | null>(null);

  const permissionLevels = ["guard", "teacher", "tutor", "admin"];

  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [cardPermissions, setCardPermissions] = useState<any[]>([]);
  const [cardLogs, setCardLogs] = useState<any[]>([]);
  const [isLoadingCardDetails, setIsLoadingCardDetails] = useState(false);
  const [isInvalidatingCard, setIsInvalidatingCard] = useState<string | null>(null);
  const [showCardDetailModal, setShowCardDetailModal] = useState(false);

  // Helper function to append teacherId to requests
  const apiWithTeacherId = (method: string, url: string, body?: any) => {
    if (method === "GET" || method === "DELETE") {
      const separator = url.includes('?') ? '&' : '?';
      return api[method.toLowerCase()](`${url}${separator}teacherId=${committedTeacherId}`);
    } else {
      return api[method.toLowerCase()](url, { ...body, teacherId: committedTeacherId });
    }
  };

  const handleTeacherIdChange = (text: string) => {
    setInputTeacherId(text);
    
    // Clear any existing timeout
    if (idInputTimeoutRef.current) {
      clearTimeout(idInputTimeoutRef.current);
    }
    
    // Set new timeout to commit the ID after 800ms of inactivity
    idInputTimeoutRef.current = setTimeout(() => {
      setCommittedTeacherId(text);
    }, 800);
  };

  useEffect(() => {
    if (committedTeacherId) {
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
  }, [committedTeacherId]);

  useEffect(() => {
    if (committedTeacherId && activeTab === 'cards') {
      loadAccessLogs();
    }
  }, [committedTeacherId, currentPage, pageSize, activeTab]);

  const loadTeachers = () => {
    setIsLoadingTeachers(true);
    apiWithTeacherId("GET", "/admin/teachers")
      .then((res) => {
        setTeachers(res.data);
        // Now that we have basic data, load the photos separately
        loadTeacherPhotos();
      })
      .catch((err) => {
        showSnackbar("Error: " + err);
      })
      .finally(() => {
        setIsLoadingTeachers(false);
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
    setIsLoadingCards(true);
    apiWithTeacherId("GET", "/admin/cards")
      .then((res) => setCards(res.data))
      .catch((err) => showSnackbar("Error: " + err))
      .finally(() => {
        setIsLoadingCards(false);
      });
  };

  const loadAccessLogs = () => {
    setIsLoadingLogs(true);
    apiWithTeacherId("GET", `/admin/access-logs?page=${currentPage}&limit=${pageSize}`)
      .then((res) => {
        setAccessLogs(res.data);
        // If backend returns total count in headers or response
        if (res.headers && res.headers['x-total-count']) {
          setTotalLogs(parseInt(res.headers['x-total-count']));
        }
      })
      .catch((err) => showSnackbar("Error loading access logs: " + err))
      .finally(() => {
        setIsLoadingLogs(false);
      });
  };

  const loadStudents = () => {
    setIsLoadingStudents(true);
    apiWithTeacherId("GET", "/admin/students")
      .then((res) => setStudents(res.data))
      .catch((err) => showSnackbar("Error loading students: " + err))
      .finally(() => {
        setIsLoadingStudents(false);
      });
  };

  const deleteStudent = (id: string) => {
    setIsDeletingStudent(id);
    apiWithTeacherId("DELETE", `/admin/students/${id}`)
      .then(() => {
        showSnackbar("Student deleted");
        loadStudents();
      })
      .catch((err) => showSnackbar("Error: " + err))
      .finally(() => {
        setIsDeletingStudent(null);
      });
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

      if (!result.canceled && result.assets && result.assets[0]) {
        // Check if we have base64 data directly from the picker
        if (result.assets[0].base64) {
          // We have base64 data, create a data URI
          const fileType = result.assets[0].uri.split('.').pop()?.toLowerCase() || 'jpeg';
          const base64Image = result.assets[0].uri?.startsWith('data:image/')
            ? result.assets[0].uri
            : `data:image/${fileType};base64,${result.assets[0].base64}`;
          
          setPhotoUrl(base64Image);
        } else {
          // No base64 data, fetch from URI
          showSnackbar("Processing image...");
          
          try {
            // For web platforms
            if (Platform.OS === 'web') {
              const response = await fetch(result.assets[0].uri);
              const blob = await response.blob();
              const reader = new FileReader();
              
              reader.onload = () => {
                if (typeof reader.result === 'string') {
                  setPhotoUrl(reader.result);
                }
              };
              
              reader.readAsDataURL(blob);
            } else {
              // For native platforms - use expo-file-system
              const fileUri = result.assets[0].uri;
              const fileInfo = await FileSystem.getInfoAsync(fileUri);
              
              if (fileInfo.exists) {
                const base64 = await FileSystem.readAsStringAsync(fileUri, {
                  encoding: FileSystem.EncodingType.Base64,
                });
                
                const fileType = fileUri.split('.').pop()?.toLowerCase() || 'jpeg';
                const base64Image = `data:image/${fileType};base64,${base64}`;
                setPhotoUrl(base64Image);
              } else {
                throw new Error("File does not exist");
              }
            }
          } catch (error) {
            showSnackbar("Failed to process the image: " + error.message);
          }
        }
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

    setIsCreatingTeacher(true);
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
      .catch((err) => showSnackbar("Error: " + err))
      .finally(() => {
        setIsCreatingTeacher(false);
      });
  };

  const updateTeacher = () => {
    if (!teacherId || !teacherName || !teacherPermission) {
      showSnackbar("Please fill in all required fields.");
      return;
    }

    setIsUpdatingTeacher(true);
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
      .catch((err) => showSnackbar("Error: " + err))
      .finally(() => {
        setIsUpdatingTeacher(false);
      });
  };

  const deleteTeacher = (id: string) => {
    setIsDeletingTeacher(id);
    apiWithTeacherId("DELETE", `/admin/teachers/${id}`)
      .then(() => {
        showSnackbar("Teacher deleted");
        loadTeachers();
      })
      .catch((err) => showSnackbar("Error: " + err))
      .finally(() => {
        setIsDeletingTeacher(null);
      });
  };

  const loadCardDetails = (cardUID: string) => {
    setIsLoadingCardDetails(true);
    setSelectedCard(cards.find((c: any) => c.uid === cardUID));
    
    // Load permissions for this card
    apiWithTeacherId("GET", `/cards/${cardUID}/permissions`)
      .then((res) => {
        setCardPermissions(res.data);
      })
      .catch((err) => showSnackbar(`Error loading card permissions: ${err}`))
      .finally(() => {
        setIsLoadingCardDetails(false);
      });
    
    // Load access logs for this specific card
    apiWithTeacherId("GET", `/admin/card-logs/${cardUID}`)
      .then((res) => {
        setCardLogs(res.data || []);
      })
      .catch((err) => {
        // If endpoint doesn't exist, don't show error - the feature might not be implemented yet
        console.log("Card-specific logs not available:", err);
        setCardLogs([]);
      });
    
    setShowCardDetailModal(true);
  };

  const invalidateCard = (cardUID: string) => {
    setIsInvalidatingCard(cardUID);
    
    apiWithTeacherId("POST", "/admin/invalidate-card", { cardUID })
      .then(() => {
        showSnackbar("Card invalidated successfully");
        loadCards(); // Refresh the cards list
      })
      .catch((err) => {
        // If admin route fails, try the teacher route as fallback
        return apiWithTeacherId("POST", "/teacher/invalidate-card", { cardUID })
          .then(() => {
            showSnackbar("Card invalidated successfully");
            loadCards(); // Refresh the cards list
          })
          .catch((teacherErr) => {
            showSnackbar(`Error invalidating card: ${teacherErr}`);
          });
      })
      .finally(() => {
        setIsInvalidatingCard(null);
      });
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const { width } = useWindowDimensions();

  // Add this useEffect to handle keyboard events for the modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showCardDetailModal) {
        setShowCardDetailModal(false);
      }
    };

    // Only add the listener when the modal is visible
    if (showCardDetailModal) {
      document.addEventListener('keydown', handleKeyDown);
    }

    // Clean up the event listener when the component unmounts or the modal closes
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCardDetailModal]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ margin: 20 }}>
        {/* Input field for Admin/Teacher ID */}
        <TextInput
          label="Current Admin / Teacher ID"
          value={inputTeacherId}
          onChangeText={handleTeacherIdChange}
          style={{ marginVertical: 5 }}
          mode="outlined"
        />

        {committedTeacherId ? (
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
                    borderColor: theme.colors.outline,
                    borderRadius: 4,
                    marginTop: 5,
                    backgroundColor: theme.colors.surface,
                  }}>
                    <Picker
                      selectedValue={teacherPermission}
                      onValueChange={(itemValue) => setTeacherPermission(itemValue.toLowerCase())}
                      style={{ 
                        height: 50,
                        color: theme.colors.onSurface,
                        backgroundColor: theme.colors.surface, // Explicitly set background color on Picker too
                      }}
                      dropdownIconColor={theme.colors.onSurface}
                      // Force a specific background color mode for each platform
                      itemStyle={{ 
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.onSurface,
                      }}
                    >
                      <Picker.Item 
                        label="Select a permission level" 
                        value="" 
                        color={theme.colors.onSurfaceVariant}
                        // Ensure each item has the correct background
                        style={{ backgroundColor: theme.colors.surface }}
                      />
                      {permissionLevels.map((level) => (
                        <Picker.Item 
                          key={level} 
                          label={level.charAt(0).toUpperCase() + level.slice(1)} 
                          value={level}
                          color={theme.colors.onSurface}
                          // Ensure each item has the correct background
                          style={{ backgroundColor: theme.colors.surface }}
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
                  <Button 
                    mode="contained" 
                    onPress={createTeacher} 
                    style={{ margin: 5 }}
                    disabled={isCreatingTeacher}
                    loading={isCreatingTeacher}
                  >
                    {isCreatingTeacher ? "Creating..." : "Create Teacher"}
                  </Button>
                  <Button 
                    mode="contained" 
                    onPress={updateTeacher} 
                    style={{ margin: 5 }}
                    disabled={isUpdatingTeacher}
                    loading={isUpdatingTeacher}
                  >
                    {isUpdatingTeacher ? "Updating..." : "Update Teacher"}
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
                          <Button 
                            onPress={() => deleteTeacher(t.id)}
                            disabled={isDeletingTeacher === t.id}
                            loading={isDeletingTeacher === t.id}
                          >
                            {isDeletingTeacher === t.id ? "Deleting..." : "Delete"}
                          </Button>
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
                <Button 
                  mode="contained" 
                  onPress={loadStudents} 
                  style={{ marginBottom: 10 }}
                  disabled={isLoadingStudents}
                  loading={isLoadingStudents}
                >
                  {isLoadingStudents ? "Loading..." : "Refresh Students"}
                </Button>

                {isLoadingStudents ? (
                  // Loading placeholders for students
                  Array(3).fill(0).map((_, index) => (
                    <Card key={`student-loading-${index}`} style={{ marginBottom: 10, margin: 10 }} elevation={4}>
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
                            <View style={{ height: 18, width: '60%', backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 8 }} />
                            <View style={{ height: 14, width: '40%', backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 8 }} />
                            <View style={{ height: 14, width: '70%', backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 8 }} />
                            <View style={{ height: 14, width: '50%', backgroundColor: '#e0e0e0', borderRadius: 4 }} />
                          </View>
                        </View>
                      </Card.Content>
                      <Card.Actions>
                        <View style={{ height: 36, width: 80, backgroundColor: '#e0e0e0', borderRadius: 4 }} />
                      </Card.Actions>
                    </Card>
                  ))
                ) : students.length > 0 ? (
                  students.map((s) => (
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
                        <Button 
                          onPress={() => deleteStudent(s.id)}
                          disabled={isDeletingStudent === s.id}
                          loading={isDeletingStudent === s.id}
                        >
                          {isDeletingStudent === s.id ? "Deleting..." : "Delete"}
                        </Button>
                      </Card.Actions>
                    </Card>
                  ))
                ) : (
                  <Text style={{ margin: 10, fontStyle: 'italic', color: '#666' }}>
                    No students found. Students need to be added via the teacher panel.
                  </Text>
                )}
              </>
            )}

            {activeTab === 'cards' && (
              <>
                <Text style={{ marginVertical: 20, fontWeight: "bold" }}>All Cards</Text>
                <Button 
                  mode="contained" 
                  onPress={loadCards} 
                  style={{ marginBottom: 10 }}
                  disabled={isLoadingCards}
                  loading={isLoadingCards}
                >
                  {isLoadingCards ? "Loading..." : "Refresh Cards"}
                </Button>
                {cards.map((c: any) => (
                  <Card key={c.uid} style={{ marginBottom: 10, margin: 10 }} elevation={4}>
                    <Card.Content>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                          <Title>Card UID: {c.uid}</Title>
                          <Paragraph>
                            <Text style={{ fontWeight: 'bold' }}>Status:</Text> 
                            <Text style={{ 
                              color: c.isValid ? theme?.colors.success : theme?.colors.error,
                              fontWeight: 'bold'
                            }}>
                              {c.isValid ? " Valid" : " Invalid"}
                            </Text>
                          </Paragraph>
                          <Paragraph>
                            <Text style={{ fontWeight: 'bold' }}>Last Assigned To:</Text> {c.lastAssigned || 'None'}
                          </Paragraph>
                        </View>
                      </View>
                    </Card.Content>
                    <Card.Actions>
                      <Button 
                        onPress={() => loadCardDetails(c.uid)}
                        icon="information"
                        style={{ marginRight: 8 }}
                      >
                        Details
                      </Button>
                      <Button 
                        onPress={() => invalidateCard(c.uid)}
                        disabled={!c.isValid || isInvalidatingCard === c.uid}
                        loading={isInvalidatingCard === c.uid}
                        icon="close-circle"
                        mode="outlined"
                        textColor={theme?.colors.error}
                      >
                        {isInvalidatingCard === c.uid ? "Invalidating..." : "Invalidate"}
                      </Button>
                    </Card.Actions>
                  </Card>
                ))}

                <Card style={{ marginBottom: 20, margin: 10 }} elevation={4}>
                  <Card.Content>
                    <Title>Access Logs</Title>
                    <Button 
                      mode="contained" 
                      onPress={loadAccessLogs} 
                      style={{ marginBottom: 10 }}
                      disabled={isLoadingLogs}
                      loading={isLoadingLogs}
                    >
                      {isLoadingLogs ? "Loading..." : "Refresh Logs"}
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
      <Portal>
        <Modal
          visible={showCardDetailModal}
          onDismiss={() => setShowCardDetailModal(false)}
          contentContainerStyle={{
            backgroundColor: theme.colors.surface,
            padding: 20,
            margin: 20,
            maxHeight: '80%',
            borderRadius: 10
          }}
        >
          <ScrollView>
            {selectedCard && (
              <>
                <Title>Card Details</Title>
                <Card style={{ marginBottom: 15 }} elevation={3}>
                  <Card.Content>
                    <Paragraph><Text style={{ fontWeight: 'bold' }}>UID:</Text> {selectedCard.uid}</Paragraph>
                    <Paragraph>
                      <Text style={{ fontWeight: 'bold' }}>Status:</Text> 
                      <Text style={{ 
                        color: selectedCard.isValid ? theme?.colors.success : theme?.colors.error,
                        fontWeight: 'bold'
                      }}>
                        {selectedCard.isValid ? " Valid" : " Invalid"}
                      </Text>
                    </Paragraph>
                    <Paragraph>
                      <Text style={{ fontWeight: 'bold' }}>Last Assigned To:</Text> {selectedCard.lastAssigned || 'None'}
                    </Paragraph>
                  </Card.Content>
                </Card>

                <Title style={{ marginTop: 15 }}>Permissions</Title>
                {isLoadingCardDetails ? (
                  <ActivityIndicator style={{ margin: 20 }} />
                ) : cardPermissions.length > 0 ? (
                  <Card style={{ marginBottom: 15 }} elevation={3}>
                    <Card.Content>
                      <ScrollView horizontal>
                        <DataTable>
                          <DataTable.Header>
                            <DataTable.Title style={{ width: 70 }}>ID</DataTable.Title>
                            <DataTable.Title style={{ width: 150 }}>Student</DataTable.Title>
                            <DataTable.Title style={{ width: 150 }}>Assigned By</DataTable.Title>
                            <DataTable.Title style={{ width: 180 }}>Start Date</DataTable.Title>
                            <DataTable.Title style={{ width: 180 }}>End Date</DataTable.Title>
                            <DataTable.Title style={{ width: 100 }}>Recurring</DataTable.Title>
                            <DataTable.Title style={{ width: 100 }}>Valid</DataTable.Title>
                          </DataTable.Header>

                          {cardPermissions.map((perm) => (
                            <DataTable.Row key={perm.id}>
                              <DataTable.Cell style={{ width: 70 }}>{perm.id}</DataTable.Cell>
                              <DataTable.Cell style={{ width: 150 }}>{perm.assignedStudent}</DataTable.Cell>
                              <DataTable.Cell style={{ width: 150 }}>{perm.assignedBy}</DataTable.Cell>
                              <DataTable.Cell style={{ width: 180 }}>{new Date(perm.startDate).toLocaleString()}</DataTable.Cell>
                              <DataTable.Cell style={{ width: 180 }}>{new Date(perm.endDate).toLocaleString()}</DataTable.Cell>
                              <DataTable.Cell style={{ width: 100 }}>{perm.isRecurring ? 'Yes' : 'No'}</DataTable.Cell>
                              <DataTable.Cell style={{ width: 100 }}>{perm.isValid ? 'Yes' : 'No'}</DataTable.Cell>
                            </DataTable.Row>
                          ))}
                        </DataTable>
                      </ScrollView>
                    </Card.Content>
                  </Card>
                ) : (
                  <Text style={{ margin: 10, fontStyle: 'italic', color: '#666' }}>
                    No permissions found for this card.
                  </Text>
                )}

                {cardLogs.length > 0 && (
                  <>
                    <Title style={{ marginTop: 15 }}>Access Logs</Title>
                    <Card style={{ marginBottom: 15 }} elevation={3}>
                      <Card.Content>
                        <ScrollView horizontal>
                          <DataTable>
                            <DataTable.Header>
                              <DataTable.Title style={{ width: 180 }}>Timestamp</DataTable.Title>
                              <DataTable.Title style={{ width: 150 }}>Student</DataTable.Title>
                              <DataTable.Title style={{ width: 100 }}>Direction</DataTable.Title>
                              <DataTable.Title style={{ width: 100 }}>Approved</DataTable.Title>
                            </DataTable.Header>

                            {cardLogs.map((log) => (
                              <DataTable.Row key={log.id}>
                                <DataTable.Cell style={{ width: 180 }}>
                                  {new Date(log.timestamp * 1000).toLocaleString()}
                                </DataTable.Cell>
                                <DataTable.Cell style={{ width: 150 }}>{log.student}</DataTable.Cell>
                                <DataTable.Cell style={{ width: 100 }}>{log.direction}</DataTable.Cell>
                                <DataTable.Cell style={{ width: 100 }}>{log.wasApproved ? 'Yes' : 'No'}</DataTable.Cell>
                              </DataTable.Row>
                            ))}
                          </DataTable>
                        </ScrollView>
                      </Card.Content>
                    </Card>
                  </>
                )}
              </>
            )}
            
            <Button 
              mode="contained" 
              onPress={() => setShowCardDetailModal(false)}
              style={{ marginTop: 20 }}
            >
              Close
            </Button>
          </ScrollView>
        </Modal>
      </Portal>
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