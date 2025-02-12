import React, { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import { TextInput, Button, Snackbar, Text, Card, Title, Paragraph, Switch } from "react-native-paper";
import { DatePickerModal, TimePickerModal } from "react-native-paper-dates";
import api from "../services/api";
import "react-native-paper-dates"; // For date formatting

export default function TeacherPanel() {
  const [currentTeacherId, setCurrentTeacherId] = useState("");
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

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  // Helper to pass teacherId
  const apiWithTeacherId = (method: string, url: string, body?: any) => {
    if (method === "GET" || method === "DELETE") {
      return api[method.toLowerCase()](`${url}?teacherId=${currentTeacherId}`);
    } else {
      return api[method.toLowerCase()](url, { ...body, teacherId: currentTeacherId });
    }
  };

  useEffect(() => {
    if (currentTeacherId) {
      handleViewPermissions();
    }
  }, [currentTeacherId]);

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

    apiWithTeacherId("POST", "/teacher/assign-card", {
      studentId,
      cardUID,
      startDate: startDateTimeISO,
      endDate: endDateTimeISO,
      isRecurring,
      recurrencePattern,
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
      })
      .catch((err) => showSnackbar("Error: " + err));
  };

  const handleInvalidateCard = () => {
    apiWithTeacherId("POST", "/teacher/invalidate-card", {
      cardUID: invalidateCardUID
    })
      .then(() => showSnackbar("Card invalidated"))
      .catch((err) => showSnackbar("Error: " + err));
  };

  const handleViewPermissions = () => {
    apiWithTeacherId("GET", "/teacher/permissions")
      .then((res) => setPermissions(res.data))
      .catch((err) => showSnackbar("Error: " + err));
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ margin: 20 }}>
        <TextInput
          label="Current Teacher ID"
          value={currentTeacherId}
          onChangeText={setCurrentTeacherId}
          mode="outlined"
          style={{ marginBottom: 10 }}
        />
        {currentTeacherId ? (
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
                <Button mode="outlined" onPress={() => setStartDatePickerVisible(true)} style={{ marginBottom: 10 }}>
                  Select Start Date
                </Button>
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
                <Paragraph>Selected Start Date: {startDate?.toDateString() || "None"}</Paragraph>

                <Button mode="outlined" onPress={() => setStartTimePickerVisible(true)} style={{ marginBottom: 10 }}>
                  Select Start Time
                </Button>
                <TimePickerModal
                  visible={isStartTimePickerVisible}
                  onDismiss={() => setStartTimePickerVisible(false)}
                  onConfirm={(params) => {
                    setStartTime(params.hours != null ? new Date(0, 0, 0, params.hours, params.minutes) : undefined);
                    setStartTimePickerVisible(false);
                  }}
                />
                <Paragraph>Selected Start Time: {startTime?.toLocaleTimeString() || "None"}</Paragraph>

                <Button mode="outlined" onPress={() => setEndDatePickerVisible(true)} style={{ marginBottom: 10 }}>
                  Select End Date
                </Button>
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
                <Paragraph>Selected End Date: {endDate?.toDateString() || "None"}</Paragraph>

                <Button mode="outlined" onPress={() => setEndTimePickerVisible(true)} style={{ marginBottom: 10 }}>
                  Select End Time
                </Button>
                <TimePickerModal
                  visible={isEndTimePickerVisible}
                  onDismiss={() => setEndTimePickerVisible(false)}
                  onConfirm={(params) => {
                    setEndTime(params.hours != null ? new Date(0, 0, 0, params.hours, params.minutes) : undefined);
                    setEndTimePickerVisible(false);
                  }}
                />
                <Paragraph>Selected End Time: {endTime?.toLocaleTimeString() || "None"}</Paragraph>

                <TextInput
                  label="Recurrence Pattern"
                  value={recurrencePattern}
                  onChangeText={setRecurrencePattern}
                  mode="outlined"
                  style={{ marginBottom: 10 }}
                />
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                  <Paragraph>Recurring: </Paragraph>
                  <Switch value={isRecurring} onValueChange={setIsRecurring} />
                </View>
                <Button mode="contained" onPress={handleAssignCard}>
                  Assign Card
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
                <Button mode="contained" onPress={handleInvalidateCard}>
                  Invalidate Card
                </Button>
              </Card.Content>
            </Card>

            <Card style={{ marginBottom: 20, margin: 10 }} elevation={4}>
              <Card.Content>
                <Title>View Permissions</Title>
                <Button mode="contained" onPress={handleViewPermissions} style={{ marginBottom: 10 }}>
                  Load Permissions
                </Button>
                {permissions.map((perm, i) => (
                  <Paragraph key={i} style={{ marginTop: 5 }}>
                    {JSON.stringify(perm)}
                  </Paragraph>
                ))}
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
