import React, { useState, useRef, useEffect } from "react";
import { View, ScrollView } from "react-native";
import { TextInput, Button, Snackbar, Text, Card, Title, Paragraph } from "react-native-paper";
import api from "../services/api";

export default function GuardPanel() {
  // State variables
  const [currentGuardId, setCurrentGuardId] = useState("");
  const [uid, setUid] = useState("");
  const [result, setResult] = useState("");
  const [visible, setVisible] = useState(false);
  const [cardInfo, setCardInfo] = useState<any>(null); // State to store card information
  const [cards, setCards] = useState<any[]>([]); // State to store all cards (if needed)
  const textInputRef = useRef<TextInput>(null);

  // Snackbar message state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Helper function to append guardId to requests
  const apiWithGuardId = (method: string, url: string, body?: any) => {
    if (method === "GET" || method === "DELETE") {
      return api[method.toLowerCase()](`${url}?guardId=${currentGuardId}`);
    } else {
      return api[method.toLowerCase()](url, { ...body, guardId: currentGuardId });
    }
  };

  // Function to show snackbar messages
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  // Fetch all cards (optional, based on your requirements)
  const loadCards = () => {
    apiWithGuardId("GET", "/cards")
      .then((res) => setCards(res.data))
      .catch((err) => showSnackbar("Error fetching cards: " + err));
  };

  useEffect(() => {
    if (currentGuardId) {
      loadCards();
    }
  }, [currentGuardId]);

  const handleValidation = () => {
    if (uid.trim() === "") return;

    apiWithGuardId("POST", "/guard/validate", { cardUID: uid })
      .then((res) => {
        if (res.data.valid) {
          setResult("Access Granted");
          setCardInfo(res.data.card); // Set card information
        } else {
          setResult("Access Denied");
          setCardInfo(null); // Clear card information
        }
        setVisible(true);
        // Clear the UID after validation
        setUid("");
        // Keep the TextInput focused
        textInputRef.current?.focus();
      })
      .catch(() => {
        setResult("Error");
        setVisible(true);
        setCardInfo(null); // Clear card information
        // Keep the TextInput focused
        textInputRef.current?.focus();
      });
  };

  return (
    <ScrollView style={{ margin: 20 }}>
      {/* Input field for Guard ID */}
      <TextInput
        label="Current Guard ID"
        value={currentGuardId}
        onChangeText={setCurrentGuardId}
        style={{ marginVertical: 5 }}
        mode="outlined"
      />

      {currentGuardId ? (
        <>
          <Text style={{ fontWeight: "bold", marginBottom: 10 }}>Guard Panel</Text>

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
              <Button mode="contained" onPress={handleValidation}>
                Validate
              </Button>
              <Paragraph style={{ marginTop: 10 }}>{result}</Paragraph>

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
            </Card.Content>
          </Card>

          {/* Optional: Display All Cards */}
          <Card elevation={4} style={{ margin: 10 }}>
            <Card.Content>
              <Title>All Cards</Title>
              <Button mode="contained" onPress={loadCards} style={{ marginBottom: 10 }}>
                Refresh Cards
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

          {/* Snackbar for notifications */}
          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={3000}
          >
            {snackbarMessage}
          </Snackbar>
        </>
      ) : (
        <Text>Please enter your Guard ID to proceed.</Text>
      )}
    </ScrollView>
  );
}