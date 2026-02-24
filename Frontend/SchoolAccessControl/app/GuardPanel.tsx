import React, { useState, useRef, useEffect } from "react";
import { View, ScrollView, Image } from "react-native";
import { TextInput, Button, Snackbar, Text, Card, Title, Paragraph, DataTable } from "react-native-paper";
import api, { getUserId } from "../services/api";
import { useRouter } from 'expo-router';
import { useAppTheme } from '../theme/ThemeContext';
import { mockValidationResponse, mockInvalidValidationResponse } from '../utils/mockData';

export default function GuardPanel() {
  const [uid, setUid] = useState("");
  const [result, setResult] = useState("");
  const [visible, setVisible] = useState(false);
  const [cardInfo, setCardInfo] = useState<any>(null); // State to store card information
  const [permissions, setPermissions] = useState<any[]>([]); // State to store permissions related to the card
  const [cards, setCards] = useState<any[]>([]); // State to store all cards (if needed)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null); // Add photo URL state
  const textInputRef = useRef<any>(null);
  const { theme } = useAppTheme();
  // Snackbar message state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Add loading state variables
  const [isValidating, setIsValidating] = useState(false);
  const [isLoadingCards, setIsLoadingCards] = useState(false);

  // Mock mode state
  const [isMockMode, setIsMockMode] = useState(false);
  const [mockPressCount, setMockPressCount] = useState(0);
  const mockTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTitlePress = () => {
    setMockPressCount((prev) => {
      const newCount = prev + 1;
      if (newCount >= 5) {
        setIsMockMode((prevMode) => {
          const newMode = !prevMode;
          showSnackbar(newMode ? "Mock Mode Enabled" : "Mock Mode Disabled");
          return newMode;
        });
        return 0;
      }
      
      if (mockTimeoutRef.current) {
        clearTimeout(mockTimeoutRef.current);
      }
      mockTimeoutRef.current = setTimeout(() => {
        setMockPressCount(0);
      }, 2000);
      
      return newCount;
    });
  };
  // Function to show snackbar messages
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  // Fetch all cards (optional, based on your requirements)
  const loadCards = () => {
    setIsLoadingCards(true);
    api.get("/cards")
      .then((res) => setCards(res.data))
      .catch((err) => showSnackbar("Error fetching cards: " + err))
      .finally(() => {
        setIsLoadingCards(false);
      });
  };

  useEffect(() => {
    loadCards();
  }, []);

  const handleValidation = () => {
    if (uid.trim() === "") {
      showSnackbar("Please enter a card UID");
      return;
    }

    setIsValidating(true);
    setResult("Validating...");

    if (isMockMode) {
      setTimeout(() => {
        const res = uid.toLowerCase() === "invalid" ? mockInvalidValidationResponse : mockValidationResponse;
        if (res.data.valid) {
          setResult("Access Granted");
          setCardInfo(res.data.card);
          setPermissions(res.data.permissions);
          setPhotoUrl(res.data.photoUrl);
          showSnackbar("Card validation successful (MOCK)");
        } else {
          setResult("Access Denied");
          setCardInfo(null);
          setPermissions([]);
          setPhotoUrl(null);
          showSnackbar("Invalid card or expired permissions (MOCK)");
        }
        setVisible(true);
        setUid("");
        textInputRef.current?.focus();
        setIsValidating(false);
      }, 500);
      return;
    }

    api.post("/guard/validate", { cardUID: uid })
      .then((res) => {
        if (res.data.valid) {
          setResult("Access Granted");
          setCardInfo(res.data.card);
          setPermissions(res.data.permissions);
          setPhotoUrl(res.data.photoUrl);
          showSnackbar("Card validation successful");
        } else {
          setResult("Access Denied");
          setCardInfo(null);
          setPermissions([]);
          setPhotoUrl(null);
          showSnackbar("Invalid card or expired permissions");
        }
        setVisible(true);
        setUid("");
        textInputRef.current?.focus();
      })
      .catch((error) => {
        setResult("Error");
        setCardInfo(null);
        setPermissions([]);
        setPhotoUrl(null);
        setVisible(true);
        showSnackbar(`Error validating card: ${error.response?.data?.error || error.message}`);
        textInputRef.current?.focus();
      })
      .finally(() => {
        setIsValidating(false);
      });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView style={{ margin: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text 
                style={{ fontWeight: "bold", fontSize: 20 }}
                onPress={handleTitlePress}
                suppressHighlighting={true}
              >
                Guard Panel
              </Text>
              {isMockMode && (
                <View style={{ backgroundColor: theme.colors.error, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>DEMO</Text>
                </View>
              )}
            </View>
            {/* Card Validation Section */}
            <Card elevation={4} style={{ margin: 10 }}>
              <Card.Content>
                <Title>Validate a Card</Title>
                <TextInput
                  ref={textInputRef}
                  label="Card UID"
                  value={uid}
                  onChangeText={setUid}
                  mode="outlined"
                  style={{ marginVertical: 10 }}
                  onSubmitEditing={handleValidation}
                  returnKeyType="done"
                />
                <Button 
                  mode="contained" 
                  onPress={handleValidation}
                  disabled={isValidating}
                  loading={isValidating}
                >
                  {isValidating ? "Validating..." : "Validate"}
                </Button>

                {/* New styled result card */}
                {result && (
                  <Card 
                    style={{ 
                      marginTop: 20,
                      backgroundColor: result === "Access Granted" ? theme.colors.success : theme.colors.error,
                      elevation: 4
                    }}
                  >
                    <Card.Content>
                      <Text 
                        style={{ 
                          fontSize: 24,
                          fontWeight: "bold",
                          textAlign: "center",
                          color: "white",
                          padding: 10
                        }}
                      >
                        {result}
                      </Text>
                    </Card.Content>
                  </Card>
                )}

                {/* Display Card Information if available */}
                {cardInfo && (
                  <Card style={{ marginTop: 20 }} elevation={2}>
                    <Card.Content>
                      <Title>Card Details</Title>
                      <Paragraph>
                        <Text style={{ fontWeight: "bold" }}>UID:</Text> {cardInfo.uid}
                      </Paragraph>
                      <Paragraph>
                        <Text style={{ fontWeight: "bold" }}>Last Assigned:</Text> {cardInfo.lastAssigned}
                      </Paragraph>
                      <Paragraph>
                        <Text style={{ fontWeight: "bold" }}>Is Valid:</Text> {cardInfo.isValid ? "Yes" : "No"}
                      </Paragraph>
                    </Card.Content>
                  </Card>
                )}

                {/* Display Permissions if available */}
                {permissions.length > 0 && (
                  <Card style={{ marginTop: 20 }} elevation={2}>
                    <Card.Content>
                      <Title>Permissions</Title>
                      <ScrollView horizontal={true} style={{ marginHorizontal: -16 }}>
                        <View style={{ minWidth: 800 }}>  {/* Adjust minWidth based on your content */}
                          <DataTable>
                            <DataTable.Header>
                              <DataTable.Title style={{ width: 100 }}>ID</DataTable.Title>
                              <DataTable.Title style={{ width: 150 }}>Student ID</DataTable.Title>
                              <DataTable.Title style={{ width: 150 }}>Assigned By</DataTable.Title>
                              <DataTable.Title style={{ width: 200 }}>Start Date</DataTable.Title>
                              <DataTable.Title style={{ width: 200 }}>End Date</DataTable.Title>
                              <DataTable.Title style={{ width: 100 }}>Recurring</DataTable.Title>
                            </DataTable.Header>

                            {permissions.map((perm) => (
                              <DataTable.Row key={perm.id}>
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
                )}

                {/* Display Student Photo if available */}
                {photoUrl && (
                  <Card style={{ marginTop: 20 }} elevation={2}>
                    <Card.Content>
                      <Title>Student Photo</Title>
                      <View style={{ alignItems: 'center', marginTop: 10 }}>
                        <Image
                          source={{ uri: photoUrl }}
                          style={{ 
                            width: 200, 
                            height: 200, 
                            borderRadius: 10,
                            backgroundColor: '#f0f0f0'
                          }}
                          resizeMode="cover"
                        />
                      </View>
                    </Card.Content>
                  </Card>
                )}
              </Card.Content>
            </Card>

            {/* Optional: Display All Cards */}
            <Card elevation={4} style={{ margin: 10 }}>
              <Card.Content>
                <Title>All Cards</Title>
                <Button 
                  mode="contained" 
                  onPress={loadCards} 
                  style={{ marginBottom: 10 }}
                  disabled={isLoadingCards}
                  loading={isLoadingCards}
                >
                  {isLoadingCards ? "Loading..." : "Refresh Cards"}
                </Button>
                {cards.length > 0 ? (
                  cards.map((c: any) => (
                    <Card key={c.uid} style={{ marginBottom: 10 }} elevation={2}>
                      <Card.Content>
                        <Paragraph>
                          <Text style={{ fontWeight: "bold" }}>UID:</Text> {c.uid}
                        </Paragraph>
                        <Paragraph>
                          <Text style={{ fontWeight: "bold" }}>Last Assigned:</Text> {c.lastAssigned}
                        </Paragraph>
                        <Paragraph>
                          <Text style={{ fontWeight: "bold" }}>Is Valid:</Text> {c.isValid ? "Yes" : "No"}
                        </Paragraph>
                      </Card.Content>
                    </Card>
                  ))
                ) : (
                  <Text>No cards available.</Text>
                )}
              </Card.Content>
            </Card>
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