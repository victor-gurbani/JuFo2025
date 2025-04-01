import React, { useState, useRef, useEffect } from "react";
import { View, ScrollView, Image, StyleSheet, TouchableOpacity, Platform } from "react-native"; // Added StyleSheet, TouchableOpacity
import { TextInput, Button, Snackbar, Text, Card, Title, Paragraph, DataTable, ProgressBar, ActivityIndicator } from "react-native-paper"; // Added ProgressBar, ActivityIndicator
import { Camera, CameraType } from 'expo-camera'; // Import Camera and CameraType
import api from "../services/api";
import { useRouter } from 'expo-router';

export default function GuardPanelWithFaceRecognition() { // Renamed for clarity
  const router = useRouter();

  // == Combined State Variables ==
  // Original GuardPanel state
  const [inputGuardId, setInputGuardId] = useState("");
  const [committedGuardId, setCommittedGuardId] = useState("");
  const idInputTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [uid, setUid] = useState("");
  const [result, setResult] = useState("");
  const [visible, setVisible] = useState(false); // Controls visibility of detailed results area
  const [cardInfo, setCardInfo] = useState<any>(null);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]); // State to store all cards (if needed)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null); // Student's reference photo URL
  const textInputRef = useRef<TextInput>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isValidating, setIsValidating] = useState(false); // Loading state for card validation part
  const [isLoadingCards, setIsLoadingCards] = useState(false); // Loading state for fetching all cards

  // New state for Face Recognition
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraRef, setCameraRef] = useState<Camera | null>(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false); // Loading state for taking snapshot
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null); // URL/base64 of the taken snapshot
  const [faceSimilarity, setFaceSimilarity] = useState<number>(0);
  const [faceMatch, setFaceMatch] = useState<boolean | null>(null);
  const [isFaceVerifying, setIsFaceVerifying] = useState(false); // Loading state for face verification API call
  const [accessStatus, setAccessStatus] = useState<'denied' | 'granted' | 'partial' | ''>(''); // Controls result card color

  // == Helper Functions ==
  const apiWithGuardId = (method: string, url: string, body?: any) => {
    const guardIdParam = `guardId=${committedGuardId}`;
    if (method.toUpperCase() === "GET" || method.toUpperCase() === "DELETE") {
      const separator = url.includes('?') ? '&' : '?';
      return api[method.toLowerCase()](`${url}${separator}${guardIdParam}`);
    } else {
      // Ensure body is an object even if initially undefined
      const requestBody = body || {};
      return api[method.toLowerCase()](url, { ...requestBody, guardId: committedGuardId });
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  // == Effects ==
  // Request camera permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        showSnackbar("Camera permission is required for face recognition.");
      }
    })();
  }, []);

  // Load cards when Guard ID is committed
  useEffect(() => {
    if (committedGuardId) {
      loadCards(); // Optional: Fetch all cards initially
      // Reset validation state when guard changes
      resetValidationState();
    } else {
        // Clear data if guard ID is removed
        resetValidationState();
        setCards([]);
    }
  }, [committedGuardId]);

  // == Core Logic Functions ==
  const loadCards = () => {
    if (!committedGuardId) return; // Don't load if no guard ID
    setIsLoadingCards(true);
    apiWithGuardId("GET", "/cards")
      .then((res) => setCards(res.data))
      .catch((err) => showSnackbar("Error fetching cards: " + (err.response?.data?.error || err.message)))
      .finally(() => setIsLoadingCards(false));
  };

  const handleGuardIdChange = (text: string) => {
    setInputGuardId(text);
    if (idInputTimeoutRef.current) {
      clearTimeout(idInputTimeoutRef.current);
    }
    idInputTimeoutRef.current = setTimeout(() => {
      setCommittedGuardId(text);
      // Focus UID input when Guard ID is set (optional)
      if (text && textInputRef.current) {
         // Small delay to ensure state update completes
         setTimeout(() => textInputRef.current?.focus(), 100);
      }
    }, 800); // Commit after 800ms inactivity
  };

  // Function to reset state related to a validation attempt
  const resetValidationState = () => {
      setResult("");
      setVisible(false);
      setCardInfo(null);
      setPermissions([]);
      setPhotoUrl(null);
      setSnapshotUrl(null);
      setFaceSimilarity(0);
      setFaceMatch(null);
      setAccessStatus('');
      // Optionally clear UID input as well
      // setUid("");
  }

  // Take a snapshot from the camera
  const takeSnapshot = async (): Promise<string | null> => {
    if (cameraRef && hasPermission) {
      setIsTakingPhoto(true);
      try {
        const photo = await cameraRef.takePictureAsync({
          quality: 0.5, // Lower quality for faster processing/upload
          base64: true,
          exif: false, // Don't need exif data
        });
        const base64Image = `data:image/jpeg;base64,${photo.base64}`; // Use jpeg for base64
        setSnapshotUrl(base64Image);
        return base64Image;
      } catch (error: any) {
        showSnackbar("Error taking photo: " + error.message);
        setSnapshotUrl(null); // Clear snapshot on error
        return null;
      } finally {
        setIsTakingPhoto(false);
      }
    } else {
      showSnackbar(hasPermission ? "Camera not ready." : "Camera permission denied.");
      return null;
    }
  };

  // Verify face similarity via API
  const verifyFace = async (snapshotImage: string, cardUID: string): Promise<{ similarity: number; match: boolean }> => {
    if (!committedGuardId) {
        showSnackbar("Guard ID is required for face verification.");
        return { similarity: 0, match: false };
    }
    setIsFaceVerifying(true);
    try {
      const response = await apiWithGuardId("POST", "/guard/verify-face", {
        snapshotImage, // Base64 image string
        cardUID
      });
      const { similarity = 0, match = false } = response.data; // Provide defaults
      setFaceSimilarity(similarity);
      setFaceMatch(match);
      return { similarity, match };
    } catch (error: any) {
      showSnackbar("Face verification error: " + (error.response?.data?.error || error.message));
      setFaceSimilarity(0);
      setFaceMatch(false);
      return { similarity: 0, match: false };
    } finally {
      setIsFaceVerifying(false);
    }
  };

  // Combined validation function
  const handleValidation = async () => {
    if (uid.trim() === "") {
      showSnackbar("Please enter a card UID");
      return;
    }
     if (!committedGuardId) {
      showSnackbar("Please enter your Guard ID first");
      return;
    }
    if (!hasPermission && Platform.OS !== 'web') { // Camera needed unless on web maybe
        showSnackbar("Camera permission is required.");
        // Optionally allow validation without face check if needed
        // setResult("Proceeding without face check (no camera permission)");
        // setAccessStatus('partial'); // Or handle as desired
        // setVisible(true);
        return; // Stop if permission is strictly required
    }

    // Reset previous results before starting new validation
    resetValidationState();
    setIsValidating(true); // Start overall validation process indicator
    setResult("Validating Card...");

    try {
      // 1. Validate the card
      const cardValidationResponse = await apiWithGuardId("POST", "/guard/validate", { cardUID: uid });

      if (cardValidationResponse.data.valid) {
        // Card is valid
        setResult("Card Valid. Checking Face...");
        setCardInfo(cardValidationResponse.data.card);
        setPermissions(cardValidationResponse.data.permissions);
        setPhotoUrl(cardValidationResponse.data.photoUrl); // Get reference photo URL

        // 2. Take Snapshot
        const snapshot = await takeSnapshot(); // This sets snapshotUrl internally

        if (snapshot && cardValidationResponse.data.photoUrl) { // Only verify if we have both snapshot and reference photo
          // 3. Verify Face
          const { match } = await verifyFace(snapshot, uid); // This sets faceSimilarity & faceMatch

          // 4. Determine Final Result based on Card + Face
          if (match) {
            setResult("Access Granted - Identity Verified");
            setAccessStatus('granted');
          } else {
            setResult("Access Granted - Face Mismatch");
            setAccessStatus('partial'); // Or 'denied' depending on policy
          }
          showSnackbar("Card and Face check complete.");

        } else if (snapshot && !cardValidationResponse.data.photoUrl) {
            setResult("Access Granted - No Reference Photo");
            setAccessStatus('partial'); // Or 'granted' depending on policy
            showSnackbar("Card valid, but no reference photo for comparison.");
        } else if (!snapshot && cardValidationResponse.data.photoUrl) {
            // Snapshot failed, but card is valid and reference exists
            setResult("Access Granted - Snapshot Failed");
            setAccessStatus('partial'); // Or 'granted' depending on policy
            showSnackbar("Card valid, but failed to capture snapshot for verification.");
        } else {
            // Card valid, but no snapshot AND no reference photo
            setResult("Access Granted - No Face Data");
            setAccessStatus('partial'); // Or 'granted' depending on policy
            showSnackbar("Card valid, but face verification could not be performed.");
        }

      } else {
        // Card is invalid or other validation error
        setResult("Access Denied - Invalid Card");
        setAccessStatus('denied');
        // No need to clear cardInfo etc. here, resetValidationState already did
        showSnackbar(cardValidationResponse.data.message || "Invalid card or expired permissions");
      }

      // Show results area, clear input, refocus
      setVisible(true);
      setUid(""); // Clear UID input after attempt
      textInputRef.current?.focus();

    } catch (error: any) {
      // Catch errors from card validation or unexpected issues in the flow
      setResult("Validation Error");
      setAccessStatus(''); // Indicate error state
      // resetValidationState(); // Ensure clean state on error
      setVisible(true); // Still show the error message area
      showSnackbar(`Validation Error: ${error.response?.data?.error || error.message}`);
      textInputRef.current?.focus(); // Refocus for retry
    } finally {
      setIsValidating(false); // Stop overall validation indicator
      // isTakingPhoto and isFaceVerifying are handled in their respective functions
    }
  };

  // Get background color for the result card based on access status
  const getAccessColor = () => {
    switch (accessStatus) {
      case 'granted': return "#4CAF50"; // Green
      case 'partial': return "#FFC107"; // Amber/Yellow
      case 'denied': return "#f44336";  // Red
      default: return "#9E9E9E";        // Grey (for initial/error state)
    }
  };

  // Determine if the main button should be disabled
  const isValidationInProgress = isValidating || isTakingPhoto || isFaceVerifying;
  const getButtonText = () => {
      if (isTakingPhoto) return "Taking Snapshot...";
      if (isFaceVerifying) return "Verifying Face...";
      if (isValidating) return "Validating Card..."; // Initial state of validation
      return "Validate with Face Recognition";
  }

  // == Render ==
  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ margin: 20 }} keyboardShouldPersistTaps="handled">
        {/* Input field for Guard ID */}
        <TextInput
          label="Current Guard ID"
          value={inputGuardId}
          onChangeText={handleGuardIdChange}
          style={{ marginBottom: 15 }} // Added margin bottom
          mode="outlined"
          disabled={isValidationInProgress} // Disable while validating
        />

        {!committedGuardId ? (
          <Card elevation={2} style={{ padding: 15, alignItems: 'center' }}>
             <Text variant="titleMedium">Please enter your Guard ID above.</Text>
          </Card>
        ) : (
          <>
            {/* Camera Section */}
            <Card elevation={4} style={{ marginBottom: 15 }}>
              <Card.Content>
                <Title>Live Camera Feed</Title>
                {hasPermission === null ? (
                  <ActivityIndicator animating={true} style={{ marginVertical: 20 }} />
                ) : hasPermission === false ? (
                  <Text style={{ color: 'red', textAlign: 'center', marginVertical: 20 }}>Camera permission denied. Face recognition unavailable.</Text>
                ) : (
                  <View style={styles.cameraContainer}>
                    <Camera
                      ref={ref => setCameraRef(ref)}
                      style={styles.camera}
                      type={CameraType.front} // *** CORRECTED TYPE USAGE ***
                      onMountError={(error) => {
                        console.error("Camera mount error:", error);
                        showSnackbar(`Camera Error: ${error.message}`);
                      }}
                    />
                    {/* Overlay shown while taking photo */}
                    {isTakingPhoto && (
                      <View style={styles.takingPhotoOverlay}>
                        <ActivityIndicator size="large" color="#ffffff" />
                        <Text style={styles.takingPhotoText}>Capturing...</Text>
                      </View>
                    )}
                  </View>
                )}
              </Card.Content>
            </Card>

            {/* Card Validation and Results Section */}
            <Card elevation={4} style={{ marginBottom: 15 }}>
              <Card.Content>
                <Title>Validate Access</Title>
                <TextInput
                  ref={textInputRef}
                  label="Scan or Enter Card UID"
                  value={uid}
                  onChangeText={setUid}
                  mode="outlined"
                  style={{ marginVertical: 10 }}
                  onSubmitEditing={handleValidation} // Validate on submit
                  returnKeyType="done"
                  keyboardType="default" // Adjust as needed (numeric, etc.)
                  disabled={isValidationInProgress || !committedGuardId || !hasPermission} // Disable if busy, no guard ID, or no permission
                  autoFocus={!!committedGuardId} // Auto-focus if Guard ID is set
                />
                <Button
                  mode="contained"
                  onPress={handleValidation}
                  disabled={isValidationInProgress || !committedGuardId || !hasPermission || uid.trim() === ""} // Also disable if UID is empty
                  loading={isValidationInProgress} // Show spinner when busy
                  style={{ paddingVertical: 5 }} // Make button slightly larger
                  labelStyle={{ fontSize: 16 }}
                >
                  {getButtonText()}
                </Button>

                {/* Result Display Area - only shown after an attempt */}
                {visible && (
                  <>
                    {/* Main Result Card */}
                    <Card
                      style={{
                        marginTop: 20,
                        backgroundColor: getAccessColor(),
                        elevation: 4
                      }}
                    >
                      <Card.Content>
                        <Text style={styles.resultText}>
                          {result}
                        </Text>
                      </Card.Content>
                    </Card>

                    {/* Face Similarity Indicator */}
                    {faceMatch !== null && ( // Show only if face verification was attempted
                      <Card style={{ marginTop: 20 }} elevation={2}>
                        <Card.Content>
                          <Title>Face Recognition Result</Title>
                          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent:'space-between'}}>
                            <Text>Similarity:</Text>
                            <Text style={{fontWeight: 'bold'}}>{faceSimilarity.toFixed(1)}%</Text>
                          </View>
                          <ProgressBar
                            progress={faceSimilarity / 100}
                            color={faceSimilarity > 70 ? '#4CAF50' : (faceSimilarity > 50 ? '#FFC107' : '#f44336')} // Example threshold colors
                            style={{ marginVertical: 10, height: 10, borderRadius: 5 }}
                          />
                          <Text style={{
                            color: faceMatch ? '#4CAF50' : '#f44336',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            marginTop: 5,
                            fontSize: 18
                          }}>
                            {faceMatch ? 'IDENTITY MATCH' : 'IDENTITY MISMATCH'}
                          </Text>
                        </Card.Content>
                      </Card>
                    )}

                    {/* Photo Comparison */}
                    {photoUrl && snapshotUrl && ( // Show only if both photos are available
                      <Card style={{ marginTop: 20 }} elevation={2}>
                        <Card.Content>
                          <Title>Photo Comparison</Title>
                          <View style={styles.photoComparison}>
                            <View style={styles.photoColumn}>
                              <Text style={{textAlign: 'center', marginBottom: 5}}>Reference Photo</Text>
                              <Image
                                source={{ uri: photoUrl }}
                                style={styles.comparisonPhoto}
                                resizeMode="cover"
                              />
                            </View>
                            <View style={styles.photoColumn}>
                              <Text style={{textAlign: 'center', marginBottom: 5}}>Live Snapshot</Text>
                              <Image
                                source={{ uri: snapshotUrl }} // Snapshot is base64
                                style={styles.comparisonPhoto}
                                resizeMode="cover"
                              />
                            </View>
                          </View>
                        </Card.Content>
                      </Card>
                    )}

                    {/* Display Card Information if available */}
                    {cardInfo && (
                      <Card style={{ marginTop: 20 }} elevation={2}>
                        <Card.Content>
                          <Title>Card Details</Title>
                          <Paragraph><Text style={{ fontWeight: "bold" }}>UID:</Text> {cardInfo.uid}</Paragraph>
                          <Paragraph><Text style={{ fontWeight: "bold" }}>Last Assigned:</Text> {cardInfo.lastAssigned || 'N/A'}</Paragraph>
                          <Paragraph><Text style={{ fontWeight: "bold" }}>Is Valid:</Text> {cardInfo.isValid ? "Yes" : "No"}</Paragraph>
                        </Card.Content>
                      </Card>
                    )}

                    {/* Display Permissions if available */}
                    {permissions.length > 0 && (
                      <Card style={{ marginTop: 20 }} elevation={2}>
                        <Card.Content>
                          <Title>Permissions ({permissions.length})</Title>
                           {/* Make DataTable horizontally scrollable */}
                          <ScrollView horizontal={true} >
                              <DataTable>
                                <DataTable.Header>
                                  {/* Adjust widths as needed */}
                                  <DataTable.Title style={{ width: 80 }}>ID</DataTable.Title>
                                  <DataTable.Title style={{ width: 120 }}>Student ID</DataTable.Title>
                                  <DataTable.Title style={{ width: 120 }}>Assigned By</DataTable.Title>
                                  <DataTable.Title style={{ width: 180 }}>Start Date</DataTable.Title>
                                  <DataTable.Title style={{ width: 180 }}>End Date</DataTable.Title>
                                  <DataTable.Title style={{ width: 100 }}>Recurring</DataTable.Title>
                                </DataTable.Header>

                                {permissions.map((perm) => (
                                  <DataTable.Row key={perm.id}>
                                    <DataTable.Cell style={{ width: 80 }}>{perm.id}</DataTable.Cell>
                                    <DataTable.Cell style={{ width: 120 }}>{perm.assignedStudent}</DataTable.Cell>
                                    <DataTable.Cell style={{ width: 120 }}>{perm.assignedBy}</DataTable.Cell>
                                    <DataTable.Cell style={{ width: 180 }}>{new Date(perm.startDate).toLocaleString()}</DataTable.Cell>
                                    <DataTable.Cell style={{ width: 180 }}>{new Date(perm.endDate).toLocaleString()}</DataTable.Cell>
                                    <DataTable.Cell style={{ width: 100 }}>{perm.isRecurring ? "Yes" : "No"}</DataTable.Cell>
                                  </DataTable.Row>
                                ))}
                              </DataTable>
                          </ScrollView>
                        </Card.Content>
                      </Card>
                    )}

                    {/* Display Student Reference Photo if available but no snapshot was taken (e.g., validation error before snapshot) */}
                    {photoUrl && !snapshotUrl && cardInfo && (
                      <Card style={{ marginTop: 20 }} elevation={2}>
                        <Card.Content>
                          <Title>Student Reference Photo</Title>
                          <View style={{ alignItems: 'center', marginTop: 10 }}>
                            <Image
                              source={{ uri: photoUrl }}
                              style={styles.singlePhoto} // Use a slightly larger style maybe
                              resizeMode="cover"
                            />
                          </View>
                        </Card.Content>
                      </Card>
                    )}

                  </> // End of visible results area
                )}
              </Card.Content>
            </Card>

            {/* Optional: Display All Cards */}
            {/* <Card elevation={4} style={{ marginVertical: 10 }}>
              <Card.Content>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Title>All Registered Cards</Title>
                    <Button
                        mode="outlined" // Changed style
                        onPress={loadCards}
                        disabled={isLoadingCards || !committedGuardId}
                        loading={isLoadingCards}
                        icon="refresh" // Added icon
                    >
                        {isLoadingCards ? "Loading..." : "Refresh"}
                    </Button>
                </View>
                {isLoadingCards && cards.length === 0 ? ( // Show indicator only when loading initially
                    <ActivityIndicator animating={true} style={{marginVertical: 10}}/>
                ) : cards.length > 0 ? (
                  cards.map((c: any) => (
                    <Card key={c.uid} style={{ marginBottom: 10 }} elevation={1} mode="outlined">
                      <Card.Content>
                        <Paragraph><Text style={{ fontWeight: "bold" }}>UID:</Text> {c.uid}</Paragraph>
                        <Paragraph><Text style={{ fontWeight: "bold" }}>Last Assigned:</Text> {c.lastAssigned || 'N/A'}</Paragraph>
                        <Paragraph><Text style={{ fontWeight: "bold" }}>Is Valid:</Text> {c.isValid ? "Yes" : "No"}</Paragraph>
                      </Card.Content>
                    </Card>
                  ))
                ) : (
                  <Text style={{textAlign: 'center', marginVertical: 10}}>No cards found or Guard ID not set.</Text>
                )}
              </Card.Content>
            </Card> */}

          </> // End of content shown when Guard ID is committed
        )}
      </ScrollView>

      {/* Snackbar for notifications */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000} // Standard duration
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
        style={styles.snackbar} // Apply style for positioning
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

// == Styles ==
const styles = StyleSheet.create({
  cameraContainer: {
    width: '100%',
    aspectRatio: 3/4, // Common camera aspect ratio (adjust if needed)
    // height: 300, // Or fixed height
    borderRadius: 10,
    overflow: 'hidden', // Clip the camera view to the border radius
    position: 'relative', // Needed for the absolute overlay
    backgroundColor: '#ccc', // Placeholder background
    marginVertical: 10,
  },
  camera: {
    ...StyleSheet.absoluteFillObject, // Make camera fill the container
  },
  takingPhotoOverlay: {
    ...StyleSheet.absoluteFillObject, // Cover the camera view
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Semi-transparent black
    justifyContent: 'center',
    alignItems: 'center',
  },
  takingPhotoText: {
    color: '#ffffff',
    marginTop: 10,
    fontSize: 16,
  },
  resultText: {
    fontSize: 22, // Slightly smaller than original
    fontWeight: "bold",
    textAlign: "center",
    color: "white",
    paddingVertical: 10, // Added vertical padding
  },
  snapshotContainer: { // If you want to display snapshot separately elsewhere
    marginTop: 15,
    alignItems: 'center',
  },
  snapshot: { // Style for a standalone snapshot image
    width: '80%',
    aspectRatio: 1, // Make it square or adjust as needed
    borderRadius: 10,
    marginTop: 5,
  },
  photoComparison: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Use space-around for better spacing
    alignItems: 'flex-start', // Align items to the top
    marginTop: 10,
  },
  photoColumn: {
    flex: 1, // Each column takes half the space
    alignItems: 'center',
    paddingHorizontal: 5, // Add some horizontal padding
  },
  comparisonPhoto: {
    width: '100%', // Make photo fill the column width
    aspectRatio: 1, // Make comparison photos square
    borderRadius: 8, // Slightly smaller border radius
    marginTop: 5,
    backgroundColor: '#e0e0e0' // Background color while loading
  },
  singlePhoto: { // Style for displaying just the reference photo
      width: 200,
      height: 200,
      borderRadius: 10,
      backgroundColor: '#f0f0f0'
  },
  snackbar: { // Ensure snackbar is at the bottom
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      // zIndex: 1000, // Usually not needed unless complex layout
      // elevation: 3 // Default elevation is usually fine
  }
});