import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import api from "../services/api";

export default function GuardScreen() {
  const [uid, setUid] = useState("");
  const [result, setResult] = useState("");

  const handleValidation = () => {
    api.post("/guard/validate", { cardUID: uid })
      .then(res => {
        setResult(res.data.valid ? "Access Granted" : "Access Denied");
      })
      .catch(() => setResult("Error"));
  };

  return (
    <View style={{ margin: 20 }}>
      <Text>Guard Screen</Text>
      <TextInput
        placeholder="Card UID"
        value={uid}
        onChangeText={setUid}
        style={{ borderWidth: 1, marginVertical: 10, padding: 5 }}
      />
      <Button title="Validate" onPress={handleValidation} />
      <Text style={{ marginTop: 10 }}>{result}</Text>
    </View>
  );
}