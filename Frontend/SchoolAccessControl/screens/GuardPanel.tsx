import React, { useState } from "react";
import { View } from "react-native";
import { TextInput, Button, Snackbar, Text, Card, Title, Paragraph, Switch } from "react-native-paper";
import api from "../services/api";

export default function GuardScreen() {
  const [uid, setUid] = useState("");
  const [result, setResult] = useState("");
  const [visible, setVisible] = useState(false);

  const handleValidation = () => {
    api.post("/guard/validate", { cardUID: uid })
      .then(res => {
        setResult(res.data.valid ? "Access Granted" : "Access Denied");
        setVisible(true);
      })
      .catch(() => {
        setResult("Error");
        setVisible(true);
      });
  };

  return (
    <View style={{ margin: 20 }}>
      <Card>
        <Card.Content>
          <Title>Guard Screen</Title>
          <TextInput
            label="Card UID"
            value={uid}
            onChangeText={setUid}
            mode="outlined"
            style={{ marginVertical: 10 }}
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