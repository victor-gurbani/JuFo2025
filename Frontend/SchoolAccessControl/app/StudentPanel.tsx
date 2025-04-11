import React, { useState, useEffect, useRef } from "react";
import { View, ScrollView, Image, Platform } from "react-native";  
import { TextInput, Button, Snackbar, Text, Card, Title, Paragraph, Switch, ActivityIndicator, HelperText } from "react-native-paper";
import * as FileSystem from 'expo-file-system';  
import api from "../services/api";
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../theme/ThemeContext';

export default function StudentPanel() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [inputStudentId, setInputStudentId] = useState("");
  const [committedStudentId, setCommittedStudentId] = useState("");
  const idInputTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [verifyFace, setVerifyFace] = useState(true);
  const [nextPhotoUpdate, setNextPhotoUpdate] = useState<string | null>(null);
  
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Loading states
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleStudentIdChange = (text: string) => {
    setInputStudentId(text);
    
    // Clear any existing timeout
    if (idInputTimeoutRef.current) {
      clearTimeout(idInputTimeoutRef.current);
    }
    
    // Set new timeout to commit the ID after 800ms of inactivity
    idInputTimeoutRef.current = setTimeout(() => {
      setCommittedStudentId(text);
    }, 800);
  };

  const apiWithStudentId = (method: string, url: string, body?: any) => {
    if (method === "GET" || method === "DELETE") {
      return api[method.toLowerCase()](`${url}?studentId=${committedStudentId}`);
    } else {
      return api[method.toLowerCase()](url, { ...body, studentId: committedStudentId });
    }
  };

  // Load student info when the ID is committed
  useEffect(() => {
    if (committedStudentId) {
      loadStudentInfo();
    }
  }, [committedStudentId]);

  const loadStudentInfo = () => {
    setIsLoadingInfo(true);
    apiWithStudentId("GET", "/student/info")
      .then((res) => {
        setStudentInfo(res.data);
        setEmail(res.data.email || '');
        setPhotoUrl(res.data.photoUrl || null);
        
        // Check if photo update is restricted
        if (res.data.lastPhotoUpdate) {
          const lastUpdate = new Date(res.data.lastPhotoUpdate);
          const nextUpdate = new Date(lastUpdate.getTime() + 7 * 24 * 60 * 60 * 1000);
          if (nextUpdate > new Date()) {
            setNextPhotoUpdate(nextUpdate.toISOString());
          } else {
            setNextPhotoUpdate(null);
          }
        } else {
          setNextPhotoUpdate(null);
        }
      })
      .catch((err) => {
        if (err.response && err.response.status === 404) {
          showSnackbar("Student not found");
        } else {
          showSnackbar("Error: " + (err.response?.data?.error || err.message));
        }
        setStudentInfo(null);
      })
      .finally(() => {
        setIsLoadingInfo(false);
      });
  };

  const handleUpdateInfo = () => {
    if (!email) {
      showSnackbar("Email is required");
      return;
    }

    setIsUpdatingInfo(true);
    apiWithStudentId("POST", "/student/update-info", { email })
      .then(() => {
        showSnackbar("Information updated successfully");
        loadStudentInfo();
      })
      .catch((err) => showSnackbar("Error: " + (err.response?.data?.error || err.message)))
      .finally(() => {
        setIsUpdatingInfo(false);
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
        // Process image data
        let imageData: string;
        
        if (result.assets[0].base64) {
          // We have base64 data directly
          const fileType = result.assets[0].uri.split('.').pop()?.toLowerCase() || 'jpeg';
          imageData = result.assets[0].uri?.startsWith('data:image/')
            ? result.assets[0].uri
            : `data:image/${fileType};base64,${result.assets[0].base64}`;
        } else {
          // We need to read the file
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
                  uploadPhotoToServer(reader.result);
                }
              };
              
              reader.readAsDataURL(blob);
              return; // We'll handle the upload in the onload callback
            } else {
              // For native platforms - use expo-file-system
              const fileUri = result.assets[0].uri;
              const fileInfo = await FileSystem.getInfoAsync(fileUri);
              
              if (fileInfo.exists) {
                const base64 = await FileSystem.readAsStringAsync(fileUri, {
                  encoding: FileSystem.EncodingType.Base64,
                });
                
                const fileType = fileUri.split('.').pop()?.toLowerCase() || 'jpeg';
                imageData = `data:image/${fileType};base64,${base64}`;
              } else {
                throw new Error("File does not exist");
              }
            }
          } catch (error) {
            showSnackbar("Failed to process the image: " + error.message);
            return;
          }
        }
        
        // Set preview and upload
        setPhotoUrl(imageData);
        uploadPhotoToServer(imageData);
      }
    } catch (error) {
      showSnackbar("Error picking image: " + error.message);
    }
  };

  const uploadPhotoToServer = (imageData: string) => {
    if (nextPhotoUpdate) {
      showSnackbar(`You can update your photo after ${new Date(nextPhotoUpdate).toLocaleDateString()}`);
      return;
    }

    setIsUpdatingPhoto(true);
    apiWithStudentId("POST", "/student/update-photo", {
      photoUrl: imageData,
      verifyFace
    })
      .then((res) => {
        showSnackbar("Photo updated successfully");
        if (res.data.nextUpdateAvailable) {
          setNextPhotoUpdate(res.data.nextUpdateAvailable);
        }
        loadStudentInfo();
      })
      .catch((err) => {
        // Handle specific error for face detection
        if (err.response?.data?.error === "No face detected in the photo") {
          showSnackbar("No face was detected in the photo. Please use a clear photo of your face.");
        } else {
          showSnackbar("Error: " + (err.response?.data?.error || err.message));
        }
        // Revert to previous photo
        setPhotoUrl(studentInfo?.photoUrl || null);
      })
      .finally(() => {
        setIsUpdatingPhoto(false);
      });
  };

  // Calculate if photo update is allowed
  const canUpdatePhoto = !nextPhotoUpdate;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView style={{ margin: 20 }}>
        <TextInput
          label="Your Student ID"
          value={inputStudentId}
          onChangeText={handleStudentIdChange}
          mode="outlined"
          style={{ marginBottom: 10 }}
        />
        
        {committedStudentId ? (
          isLoadingInfo ? (
            <ActivityIndicator style={{ marginTop: 20 }} />
          ) : studentInfo ? (
            <>
              <Card style={{ marginBottom: 20, margin: 10 }} elevation={4}>
                <Card.Content>
                  <Title>Student Information</Title>
                  
                  <View style={{ alignItems: 'center', marginVertical: 20 }}>
                    {photoUrl ? (
                      <Image
                        source={{ uri: photoUrl }}
                        style={{ 
                          width: 150, 
                          height: 150, 
                          borderRadius: 75,
                          backgroundColor: '#f0f0f0'
                        }}
                      />
                    ) : (
                      <View style={{
                        width: 150,
                        height: 150,
                        borderRadius: 75,
                        backgroundColor: '#e0e0e0',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <Text style={{ fontSize: 40, color: '#666' }}>
                          {studentInfo.name?.charAt(0)?.toUpperCase() || studentInfo.id?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                      </View>
                    )}
                    
                    <Button 
                      mode="contained" 
                      onPress={pickImage}
                      disabled={isUpdatingPhoto || !canUpdatePhoto}
                      loading={isUpdatingPhoto}
                      style={{ marginTop: 15 }}
                    >
                      {isUpdatingPhoto ? "Uploading..." : "Update Photo"}
                    </Button>
                    
                    {!canUpdatePhoto && (
                      <HelperText type="info" visible={true}>
                        You can update your photo after {new Date(nextPhotoUpdate).toLocaleDateString()}
                      </HelperText>
                    )}
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                      <Switch
                        value={verifyFace}
                        onValueChange={setVerifyFace}
                      />
                      <Text style={{ marginLeft: 10 }}>Verify face in photo</Text>
                    </View>
                  </View>
                  
                  <View style={{ marginTop: 20 }}>
                    <Paragraph style={{ fontWeight: 'bold' }}>ID:</Paragraph>
                    <Paragraph>{studentInfo.id}</Paragraph>
                    
                    <Paragraph style={{ fontWeight: 'bold', marginTop: 10 }}>Name:</Paragraph>
                    <Paragraph>{studentInfo.name || 'Not set'}</Paragraph>
                    
                    <Paragraph style={{ fontWeight: 'bold', marginTop: 10 }}>Class Group:</Paragraph>
                    <Paragraph>{studentInfo.classGroup || 'Not set'}</Paragraph>
                    
                    <Paragraph style={{ fontWeight: 'bold', marginTop: 10 }}>Tutor:</Paragraph>
                    <Paragraph>{studentInfo.tutorName || 'Not assigned'}</Paragraph>
                    
                    <TextInput
                      label="Email"
                      value={email}
                      onChangeText={setEmail}
                      mode="outlined"
                      style={{ marginTop: 15 }}
                      keyboardType="email-address"
                    />
                    
                    <Button 
                      mode="contained" 
                      onPress={handleUpdateInfo}
                      disabled={isUpdatingInfo || email === studentInfo.email}
                      loading={isUpdatingInfo}
                      style={{ marginTop: 15 }}
                    >
                      {isUpdatingInfo ? "Updating..." : "Update Information"}
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </>
          ) : (
            <Text style={{ margin: 20 }}>Student not found. Please check your ID.</Text>
          )
        ) : (
          <Text style={{ margin: 20 }}>Please enter your Student ID to view your information.</Text>
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