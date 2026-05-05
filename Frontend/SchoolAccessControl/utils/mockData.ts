export const mockValidationResponse = {
  data: {
    valid: true,
    card: {
      uid: "MOCK-UID-123",
      lastAssigned: new Date().toISOString(),
      isValid: true,
    },
    permissions: [
      {
        id: 999,
        assignedStudent: "MOCK-STUDENT-001",
        assignedBy: "MOCK-TEACHER-001",
        startDate: new Date(Date.now() - 86400000).toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        isRecurring: false,
      },
    ],
    photoUrl: "https://via.placeholder.com/200?text=Mock+Student",
  },
};

export const mockFaceVerificationResponse = {
  data: {
    match: true,
    similarity: 98.5,
    error: null,
  },
};

export const mockInvalidValidationResponse = {
  data: {
    valid: false,
    card: null,
    permissions: [],
    photoUrl: null,
  },
};

export const mockInvalidFaceVerificationResponse = {
  data: {
    match: false,
    similarity: 30.2,
    error: null,
  },
};
