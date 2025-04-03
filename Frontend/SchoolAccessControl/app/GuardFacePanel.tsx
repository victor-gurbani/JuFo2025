import React, { useState, useRef, useEffect } from "react";
import { View, ScrollView, Image, StyleSheet } from "react-native";
import { TextInput, Button, Snackbar, Text, Card, Title, Paragraph, DataTable, ProgressBar } from "react-native-paper";
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import api from "../services/api";
import { useRouter } from 'expo-router';
import { useAppTheme } from '../theme/ThemeContext';

export default function GuardFacePanel() {
  const router = useRouter();
  const { theme } = useAppTheme();
  // State variables
  const [inputGuardId, setInputGuardId] = useState("");
  const [committedGuardId, setCommittedGuardId] = useState("");
  const idInputTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [uid, setUid] = useState("");
  const [result, setResult] = useState("");
  const [visible, setVisible] = useState(false);
  const [cardInfo, setCardInfo] = useState<any>(null);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const textInputRef = useRef<TextInput>(null);
  
  // Camera related state
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<CameraType>('front');
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef<any>(null);
  const [snapshotImage, setSnapshotImage] = useState<string | null>(null);
  
  // Face verification state
  const [isFaceVerifying, setIsFaceVerifying] = useState(false);
  const [faceVerified, setFaceVerified] = useState<boolean | null>(null);
  const [similarityScore, setSimilarityScore] = useState(0);
  const [faceVerificationMessage, setFaceVerificationMessage] = useState("");

  // Snackbar message state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Loading state variables
  const [isValidating, setIsValidating] = useState(false);
  const [isLoadingCards, setIsLoadingCards] = useState(false);

  // Helper function to append guardId to requests
  const apiWithGuardId = (method: string, url: string, body?: any) => {
    if (method === "GET" || method === "DELETE") {
      return api[method.toLowerCase()](`${url}?guardId=${committedGuardId}`); 
    } else {
      return api[method.toLowerCase()](url, { ...body, guardId: committedGuardId });
    }
  };

  // Function to show snackbar messages
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  // Fetch all cards (optional, based on your requirements)
  const loadCards = () => {
    setIsLoadingCards(true);
    apiWithGuardId("GET", "/cards")
      .then((res) => setCards(res.data))
      .catch((err) => showSnackbar("Error fetching cards: " + err))
      .finally(() => {
        setIsLoadingCards(false);
      });
  };

  useEffect(() => {
    if (committedGuardId) {
      loadCards();
    }
  }, [committedGuardId]);

  const handleGuardIdChange = (text: string) => {
    setInputGuardId(text);
    
    // Clear any existing timeout
    if (idInputTimeoutRef.current) {
      clearTimeout(idInputTimeoutRef.current);
    }
    
    // Set new timeout to commit the ID after 800ms of inactivity
    idInputTimeoutRef.current = setTimeout(() => {
      setCommittedGuardId(text);
    }, 800);
  };

  const handleValidation = () => {
    if (uid.trim() === "") {
      showSnackbar("Please enter a card UID");
      return;
    }

    // Reset face verification state
    setFaceVerified(null);
    setSimilarityScore(0);
    setFaceVerificationMessage("");
    setSnapshotImage(null);

    setIsValidating(true);
    setResult("Validating...");
    apiWithGuardId("POST", "/guard/validate", { cardUID: uid })
      .then((res) => {
        if (res.data.valid) {
          setCardInfo(res.data.card);
          setPermissions(res.data.permissions);
          setPhotoUrl(res.data.photoUrl);
          
          // Check if there's a reference photo available
          if (res.data.photoUrl) {
            setResult("Access Granted (Pending Face)");
            showSnackbar("Card validation successful - Please verify face");
            // Show camera for face verification
            setShowCamera(true);
          } else {
            // No reference photo available
            setResult("Access Granted (No Face Reference)");
            showSnackbar("Card validation successful - No reference photo available for face verification");
            setFaceVerificationMessage("No reference photo available for this student");
            // Don't show camera as face verification isn't possible
            setShowCamera(false);
          }
        } else {
          setResult("Access Denied");
          setCardInfo(null);
          setPermissions([]);
          setPhotoUrl(null);
          setShowCamera(false);
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
        setShowCamera(false);
        setVisible(true);
        showSnackbar(`Error validating card: ${error.response?.data?.error || error.message}`);
        textInputRef.current?.focus();
      })
      .finally(() => {
        setIsValidating(false);
      });
  };

  const toggleCameraFacing = () => {
    setCameraFacing(current => current === 'back' ? 'front' : 'back');
  };

  const takePicture = async () => {
    if (!cameraRef.current || !cardInfo) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
        skipProcessing: true
      });
      
      setSnapshotImage(photo.uri);
      
      // Now verify the face
      verifyFace(photo.base64 ? `data:image/jpeg;base64,${photo.base64}` : photo.uri, cardInfo.uid);
    } catch (error) {
      console.error("Error taking picture:", error);
      showSnackbar("Failed to take picture");
    }
  };

  const verifyFace = (imageUri: string, cardUID: string) => {
    setIsFaceVerifying(true);
    setFaceVerificationMessage("Verifying face...");
    
    apiWithGuardId("POST", "/guard/verify-face", {
      snapshotImage: imageUri,
      cardUID: cardUID
    })
      .then((res) => {
        const { match, similarity, error } = res.data;
        
        setSimilarityScore(similarity / 100); // Convert to 0-1 range for ProgressBar
        setFaceVerified(match);
        
        if (error) {
          setFaceVerificationMessage(`Face verification error: ${error}`);
        } else if (match) {
          setResult("Access Granted");
          setFaceVerificationMessage(`Face verified (${similarity.toFixed(1)}% match)`);
        } else {
          setFaceVerificationMessage(`Face does not match (${similarity.toFixed(1)}% similarity)`);
        }
      })
      .catch((error) => {
        console.error("Face verification error:", error);
        setFaceVerified(false);
        setFaceVerificationMessage("Face verification failed");
        showSnackbar(`Error: ${error.message}`);
      })
      .finally(() => {
        setIsFaceVerifying(false);
        setShowCamera(false); // Hide camera after verification
      });
  };

  // Get background color based on result and face verification
  const getResultBackgroundColor = () => {
    if (result === "Access Granted") {
      return theme.colors.success;
    } else if (result === "Access Granted (Pending Face)") {
      return faceVerified === null ? theme.colors.warning : 
             faceVerified ? theme.colors.success : 
             theme.colors.warning;
    } else if (result === "Access Granted (No Face Reference)") {
      return theme.colors.warning;
    } else {
      return theme.colors.error;
    }
  };

  // Get result text based on card validation and face verification
  const getResultText = () => {
    if (result === "Access Denied" || result === "Error" || result === "Validating...") {
      return result;
    }
    
    if (result === "Access Granted (No Face Reference)") {
      return "Access Granted (No Face Reference)";
    }
    
    if (faceVerified === null) {
      return "Access Granted (Pending Face)";
    }
    
    return faceVerified ? "Access Granted" : "Access Granted (Face Mismatch)";
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView style={{ margin: 20 }}>
        {/* Input field for Guard ID */}
        <TextInput
          label="Current Guard ID"
          value={inputGuardId}
          onChangeText={handleGuardIdChange}
          style={{ marginVertical: 5 }}
          mode="outlined"
        />

        {committedGuardId ? (
          <>
            <Text style={{ fontWeight: "bold", marginBottom: 10 }}>Face Recognition Guard Panel</Text>

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

                {/* Camera Section - Updated with recommended expo approach */}
                {showCamera && (
                  <Card style={{ marginTop: 20, overflow: 'hidden' }} elevation={4}>
                    <Card.Content>
                      <Title>Face Verification</Title>
                      <Text style={{ marginBottom: 10 }}>Please line up your face in the camera</Text>
                      
                      {!permission ? (
                        // Camera permissions are still loading
                        <View style={{ height: 300, justifyContent: 'center', alignItems: 'center' }}>
                          <Text>Loading camera permissions...</Text>
                        </View>
                      ) : !permission.granted ? (
                        // Camera permissions are not granted yet
                        <View style={{ height: 300, justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ marginBottom: 10 }}>We need camera permission to verify your face</Text>
                          <Button mode="contained" onPress={requestPermission}>
                            Grant Permission
                          </Button>
                        </View>
                      ) : (
                        // Camera is ready to use
                        <View style={{ height: 300, overflow: 'hidden', borderRadius: 10 }}>
                          <CameraView
                            ref={cameraRef}
                            style={{ flex: 1 }}
                            facing={cameraFacing}
                          />
                        </View>
                      )}
                      
                      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }}>
                        <Button 
                          mode="contained" 
                          onPress={toggleCameraFacing}
                          icon="camera-switch"
                          disabled={!permission?.granted}
                        >
                          Flip Camera
                        </Button>
                        <Button 
                          mode="contained" 
                          onPress={takePicture}
                          icon="camera"
                          loading={isFaceVerifying}
                          disabled={isFaceVerifying || !permission?.granted}
                        >
                          {isFaceVerifying ? "Verifying..." : "Take Photo"}
                        </Button>
                      </View>
                    </Card.Content>
                  </Card>
                )}
                
                {/* Face verification result */}
                {snapshotImage && (
                  <Card style={{ marginTop: 20 }} elevation={2}>
                    <Card.Content>
                      <Title>Face Verification Result</Title>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ marginBottom: 5 }}>{faceVerificationMessage}</Text>
                          <ProgressBar 
                            progress={similarityScore} 
                            color={similarityScore > 0.6 ? theme.colors.success : theme.colors.error} 
                            style={{ height: 10, borderRadius: 5 }} 
                          />
                          {/* <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
                            <Text>0%</Text>
                            <Text>50%</Text>
                            <Text>100%</Text>
                          </View> */}
                        </View>
                        <Image 
                          source={{ uri: snapshotImage }} 
                          style={{ width: 80, height: 80, borderRadius: 5, marginLeft: 10 }} 
                        />
                      </View>
                    </Card.Content>
                  </Card>
                )}

                {/* Result card */}
                {result && (
                  <Card 
                    style={{ 
                      marginTop: 20,
                      backgroundColor: getResultBackgroundColor(),
                      elevation: 4
                    }}
                  >
                    <Card.Content>
                      <Text 
                        style={{ 
                          fontSize: 24,
                          fontWeight: "bold",
                          textAlign: "center",
                          color: theme.colors.text,
                          padding: 10
                        }}
                      >
                        {getResultText()}
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

                {/* Display warning if no reference photo */}
                {cardInfo && !photoUrl && (
                  <Card style={{ marginTop: 20, backgroundColor: theme.colors.warning }} elevation={2}>
                    <Card.Content>
                      <Title style={{ color: theme.colors.text }}>Warning: No Reference Photo</Title>
                      <Paragraph style={{ color: theme.colors.text }}>
                        The student assigned to this card does not have a reference photo. 
                        Face verification cannot be performed.
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
                      <Title>Student Reference Photo</Title>
                      <View style={{ alignItems: 'center', marginTop: 10 }}>
                        <Image
                          source={{ uri: photoUrl }}
                          style={{ 
                            width: 200, 
                            height: 200, 
                            borderRadius: 10,
                            backgroundColor: theme.colors.background
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
            
          </>
        ) : (
          <Text>Please enter your Guard ID to proceed.</Text>
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