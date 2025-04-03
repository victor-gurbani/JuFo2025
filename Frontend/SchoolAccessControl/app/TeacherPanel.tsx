import React, { useState, useEffect, useRef } from "react";
import { View, ScrollView, Image, Platform } from "react-native";  
import { TextInput, Button, Snackbar, Text, Card, Title, Paragraph, Switch, DataTable } from "react-native-paper";
import { DatePickerModal, TimePickerModal } from "react-native-paper-dates";
import * as FileSystem from 'expo-file-system';  
import api from "../services/api";
import "react-native-paper-dates"; 
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

export default function TeacherPanel() {
  const router = useRouter();
  const [inputTeacherId, setInputTeacherId] = useState("");
  const [committedTeacherId, setCommittedTeacherId] = useState("");
  const idInputTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [studentId, setStudentId] = useState("");
  const [cardUID, setCardUID] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endTime, setEndTime] = useState<Date | undefined>(undefined);
  const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [isStartTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);
  const [isEndTimePickerVisible, setEndTimePickerVisible] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState("");
  const [permissions, setPermissions] = useState<any[]>([]);
  const [invalidateCardUID, setInvalidateCardUID] = useState("");
  const [studentPhotoUrl, setStudentPhotoUrl] = useState("");

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const [isAssigningCard, setIsAssigningCard] = useState(false);
  const [isInvalidatingCard, setIsInvalidatingCard] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleTeacherIdChange = (text: string) => {
    setInputTeacherId(text);

    if (idInputTimeoutRef.current) {
      clearTimeout(idInputTimeoutRef.current);
    }

    idInputTimeoutRef.current = setTimeout(() => {
      setCommittedTeacherId(text);
    }, 800);
  };

  const apiWithTeacherId = (method: string, url: string, body?: any) => {
    if (method === "GET" || method === "DELETE") {
      return api[method.toLowerCase()](`${url}?teacherId=${committedTeacherId}`);
    } else {
      return api[method.toLowerCase()](url, { ...body, teacherId: committedTeacherId });
    }
  };

  useEffect(() => {
    if (committedTeacherId) {
      handleViewPermissions();
    }
  }, [committedTeacherId]);

  const pickStudentImage = async () => {
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
        base64: true, 
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        // Check if we have base64 data directly from the picker
        if (result.assets[0].base64) {
          // We have base64 data, create a data URI
          const fileType = result.assets[0].uri.split('.').pop()?.toLowerCase() || 'jpeg';
          const base64Image = result.assets[0].uri?.startsWith('data:image/')
            ? result.assets[0].uri
            : `data:image/${fileType};base64,${result.assets[0].base64}`;
          
          setStudentPhotoUrl(base64Image);
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
                  setStudentPhotoUrl(reader.result);
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
                setStudentPhotoUrl(base64Image);
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

  const handleAssignCard = () => {
    if (!startDate || !startTime || !endDate || !endTime) {
      showSnackbar("Please select all date and time values.");
      return;
    }

    const startDateTime = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
      startTime.getHours(),
      startTime.getMinutes()
    );

    const endDateTime = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
      endTime.getHours(),
      endTime.getMinutes()
    );

    const startDateTimeISO = startDateTime.toISOString();
    const endDateTimeISO = endDateTime.toISOString();

    setIsAssigningCard(true);
    apiWithTeacherId("POST", "/teacher/assign-card", {
      studentId,
      cardUID,
      startDate: startDateTimeISO,
      endDate: endDateTimeISO,
      isRecurring,
      recurrencePattern,
      studentPhotoUrl
    })
      .then(() => {
        showSnackbar("Card assigned");
        // Clear the input fields
        setStudentId("");
        setCardUID("");
        setStartDate(undefined);
        setStartTime(undefined);
        setEndDate(undefined);
        setEndTime(undefined);
        setIsRecurring(false);
        setRecurrencePattern("");
        setStudentPhotoUrl("");
      })
      .catch((err) => showSnackbar("Error: " + err))
      .finally(() => {
        setIsAssigningCard(false);
      });
  };

  const handleInvalidateCard = () => {
    setIsInvalidatingCard(true);
    apiWithTeacherId("POST", "/teacher/invalidate-card", {
      cardUID: invalidateCardUID
    })
      .then(() => showSnackbar("Card invalidated"))
      .catch((err) => showSnackbar("Error: " + err))
      .finally(() => {
        setIsInvalidatingCard(false);
      });
  };

  const handleViewPermissions = () => {
    setIsLoadingPermissions(true);
    apiWithTeacherId("GET", "/teacher/permissions")
      .then((res) => setPermissions(res.data))
      .catch((err) => showSnackbar("Error: " + err))
      .finally(() => {
        setIsLoadingPermissions(false);
      });
  };

  const formatTimeString = (date?: Date) => {
    if (!date) return "Not set";
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ margin: 20 }}>
        <TextInput
          label="Current Teacher ID"
          value={inputTeacherId}
          onChangeText={handleTeacherIdChange}
          mode="outlined"
          style={{ marginBottom: 10 }}
        />
        {committedTeacherId ? (
          <>
            <Card style={{ marginBottom: 20, margin: 10 }} elevation={4}>
              <Card.Content>
                <Title>Assign a Card</Title>
                <TextInput
                  label="Student ID"
                  value={studentId}
                  onChangeText={setStudentId}
                  mode="outlined"
                  style={{ marginBottom: 10 }}
                />
                <TextInput
                  label="Card UID"
                  value={cardUID}
                  onChangeText={setCardUID}
                  mode="outlined"
                  style={{ marginBottom: 10 }}
                />
                <View style={{ marginVertical: 10 }}>
                  <Button mode="outlined" onPress={pickStudentImage}>
                    Pick Student Photo
                  </Button>
                  {studentPhotoUrl ? (
                    <View style={{ marginTop: 10, alignItems: 'center' }}>
                      <Image
                        source={{ uri: studentPhotoUrl }}
                        style={{ 
                          width: 100, 
                          height: 100, 
                          borderRadius: 50,
                          backgroundColor: '#f0f0f0'
                        }}
                      />
                    </View>
                  ) : null}
                </View>
                <View style={{ marginVertical: 15 }}>
                  <Title style={{ marginBottom: 10 }}>Access Period</Title>
                  
                  {/* Start Date/Time Row */}
                  <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={{ marginBottom: 5 }}>Start Date</Text>
                      <Button 
                        mode="outlined" 
                        onPress={() => setStartDatePickerVisible(true)}
                        icon="calendar"
                      >
                        {startDate ? startDate.toLocaleDateString() : "Select Date"}
                      </Button>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ marginBottom: 5 }}>Start Time</Text>
                      <Button 
                        mode="outlined" 
                        onPress={() => setStartTimePickerVisible(true)}
                        icon="clock-outline"
                      >
                        {formatTimeString(startTime)}
                      </Button>
                    </View>
                  </View>
              
                  {/* End Date/Time Row */}
                  <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={{ marginBottom: 5 }}>End Date</Text>
                      <Button 
                        mode="outlined" 
                        onPress={() => setEndDatePickerVisible(true)}
                        icon="calendar"
                      >
                        {endDate ? endDate.toLocaleDateString() : "Select Date"}
                      </Button>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ marginBottom: 5 }}>End Time</Text>
                      <Button 
                        mode="outlined" 
                        onPress={() => setEndTimePickerVisible(true)}
                        icon="clock-outline"
                      >
                        {formatTimeString(endTime)}
                      </Button>
                    </View>
                  </View>
                </View>
              
                {/* Keep existing DatePickerModal and TimePickerModal components */}
                <DatePickerModal
                  mode="single"
                  locale="en"
                  visible={isStartDatePickerVisible}
                  onDismiss={() => setStartDatePickerVisible(false)}
                  date={startDate}
                  onConfirm={(params: { date: Date }) => {
                    setStartDate(params.date);
                    setStartDatePickerVisible(false);
                  }}
                />
                <TimePickerModal
                  visible={isStartTimePickerVisible}
                  onDismiss={() => setStartTimePickerVisible(false)}
                  onConfirm={(params) => {
                    setStartTime(params.hours != null ? new Date(0, 0, 0, params.hours, params.minutes) : undefined);
                    setStartTimePickerVisible(false);
                  }}
                />
                <DatePickerModal
                  mode="single"
                  locale="en"
                  visible={isEndDatePickerVisible}
                  onDismiss={() => setEndDatePickerVisible(false)}
                  date={endDate}
                  onConfirm={(params: { date: Date }) => {
                    setEndDate(params.date);
                    setEndDatePickerVisible(false);
                  }}
                />
                <TimePickerModal
                  visible={isEndTimePickerVisible}
                  onDismiss={() => setEndTimePickerVisible(false)}
                  onConfirm={(params) => {
                    setEndTime(params.hours != null ? new Date(0, 0, 0, params.hours, params.minutes) : undefined);
                    setEndTimePickerVisible(false);
                  }}
                />
              
                {/* Recurring Section */}
                <Card style={{ marginVertical: 15, backgroundColor: '#f5f5f5' }}>
                  <Card.Content>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View>
                        <Title style={{ fontSize: 16 }}>Recurring Access</Title>
                        <Text style={{ color: '#666' }}>Enable for repeating schedules</Text>
                      </View>
                      <Switch value={isRecurring} onValueChange={setIsRecurring} />
                    </View>
                    {isRecurring && (
                      <TextInput
                        label="Recurrence Pattern"
                        value={recurrencePattern}
                        onChangeText={setRecurrencePattern}
                        mode="outlined"
                        style={{ marginTop: 10 }}
                        placeholder="e.g., Every Monday and Wednesday"
                      />
                    )}
                  </Card.Content>
                </Card>
              
                {/* Assign Button */}
                <Button 
                  mode="contained" 
                  onPress={handleAssignCard}
                  style={{ marginTop: 10 }}
                  icon="card-account-details"
                  disabled={isAssigningCard}
                  loading={isAssigningCard}
                >
                  {isAssigningCard ? "Assigning..." : "Assign Card"}
                </Button>
              </Card.Content>
            </Card>

            <Card style={{ marginBottom: 20, margin: 10 }} elevation={4}>
              <Card.Content>
                <Title>Invalidate a Card</Title>
                <TextInput
                  label="Card UID"
                  value={invalidateCardUID}
                  onChangeText={setInvalidateCardUID}
                  mode="outlined"
                  style={{ marginBottom: 10 }}
                />
                <Button 
                  mode="contained" 
                  onPress={handleInvalidateCard}
                  disabled={isInvalidatingCard}
                  loading={isInvalidatingCard}
                >
                  {isInvalidatingCard ? "Invalidating..." : "Invalidate Card"}
                </Button>
              </Card.Content>
            </Card>

            <Card style={{ marginBottom: 20, margin: 10 }} elevation={4}>
              <Card.Content>
                <Title>View Permissions</Title>
                <Button 
                  mode="contained" 
                  onPress={handleViewPermissions} 
                  style={{ marginBottom: 10 }}
                  disabled={isLoadingPermissions}
                  loading={isLoadingPermissions}
                >
                  {isLoadingPermissions ? "Loading..." : "Load Permissions"}
                </Button>
                {permissions.length > 0 ? (
                  <Card style={{ marginTop: 10 }} elevation={2}>
                    <Card.Content>
                      <Title>Permissions</Title>
                      <ScrollView horizontal={true} style={{ marginHorizontal: -16 }}>
                        <View style={{ minWidth: 800 }}>
                          <DataTable>
                            <DataTable.Header>
                              <DataTable.Title style={{ width: 100 }}>ID</DataTable.Title>
                              <DataTable.Title style={{ width: 150 }}>Student ID</DataTable.Title>
                              <DataTable.Title style={{ width: 150 }}>Assigned By</DataTable.Title>
                              <DataTable.Title style={{ width: 200 }}>Start Date</DataTable.Title>
                              <DataTable.Title style={{ width: 200 }}>End Date</DataTable.Title>
                              <DataTable.Title style={{ width: 100 }}>Recurring</DataTable.Title>
                            </DataTable.Header>

                            {permissions.map((perm, i) => (
                              <DataTable.Row key={i}>
                                <DataTable.Cell style={{ width: 100 }}>{perm.id}</DataTable.Cell>
                                <DataTable.Cell style={{ width: 150 }}>{perm.assignedStudent}</DataTable.Cell>
                                <DataTable.Cell style={{ width: 150 }}>{perm.assignedBy}</DataTable.Cell>
                                <DataTable.Cell style={{ width: 200 }}>{perm.startDate}</DataTable.Cell>
                                <DataTable.Cell style={{ width: 200 }}>{perm.endDate}</DataTable.Cell>
                                <DataTable.Cell style={{ width: 100 }}>{perm.isRecurring ? "Yes" : "No"}</DataTable.Cell>
                              </DataTable.Row>
                            ))}
                          </DataTable>
                        </View>
                      </ScrollView>
                    </Card.Content>
                  </Card>
                ) : (
                  <Paragraph style={{ marginTop: 5 }}>No permissions to display.</Paragraph>
                )}
              </Card.Content>
            </Card>
          </>
        ) : (
          <Text>Please enter your Teacher ID to proceed.</Text>
        )}
      </ScrollView>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={Snackbar.DURATION_SHORT}
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
