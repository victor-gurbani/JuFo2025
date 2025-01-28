import React, { useState, useRef } from "react";
import { View } from "react-native";
import { TextInput, Button, Snackbar, Text, Card, Title, Paragraph } from "react-native-paper";
import api from "../services/api";

export default function GuardPanel() {
  const [uid, setUid] = useState("");
  const [result, setResult] = useState("");
  const [visible, setVisible] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  const handleValidation = () => {
    if (uid.trim() === "") return;

    api.post("/guard/validate", { cardUID: uid })
      .then(res => {
        setResult(res.data.valid ? "Access Granted" : "Access Denied");
        setVisible(true);
        // Clear the UID after validation
        setUid("");
        // Keep the TextInput focused
        textInputRef.current?.focus();
      })
      .catch(() => {
        setResult("Error");
        setVisible(true);
        // Keep the TextInput focused
        textInputRef.current?.focus();
      });
  };

  return (
    <View style={{ margin: 20 }}>
      <Card elevation={4} style={{ margin: 10 }}>
        <Card.Content>
          <Title>Guard Panel</Title>
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
        </Card.Content>
      </Card>
      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={Snackbar.DURATION_SHORT}
      >
        {result}
      </Snackbar>
    </View>
  );
}