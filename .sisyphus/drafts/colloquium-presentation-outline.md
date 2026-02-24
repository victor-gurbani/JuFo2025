# Colloquium Presentation Outline: Digital School Access Control

## Presentation Schedule (10 Minutes Total)

### 1. Motivation & Problem Statement (2:00 min)
- **Current Situation:** Physical keys are lost/cloned; paper-based lists are inefficient; manual guard checks are slow.
- **The Gap:** Modern schools need a system that combines **security** (biometrics) with **privacy** (local data).
- **The Solution:** A distributed ecosystem using NFC, Edge Computing (Raspberry Pi), and server-side AI.
- **Goal:** Move from "security by obscurity" to "security by design".

### 2. Leitfrage (0:30 min)
- **Research Question:** "How can a cost-effective, GDPR-compliant access control system be implemented using Edge Computing and Biometrics for school environments?"

### 3. System Demo & Architecture (3:00 min)
- **Workflow:** 
    1. **NFC Scan:** Student taps card; UID is sent to Node.js backend.
    2. **RBAC Validation:** Backend checks SQLite DB for valid roles/permissions/time-slots.
    3. **Biometric Step:** (Optional) Guard takes a photo. 
    4. **AI Pipeline:** Image normalized (HEIC conversion) → TensorFlow.js comparison (Euclidean distance).
- **Mock Mode:** Mention the integrated "Developer Mock Mode" for offline/safe presentation environments.

### 4. Key Results & Benchmarks (2:30 min)
- **Performance (RPi 4):**
    - RFID Validation: ~157 ms.
    - Face Recognition (Detection + Descriptor): ~532 ms.
    - Total verification time < 1 second (H1: < 2s goal surpassed).
- **Accuracy:** 100% match rate in controlled test scenarios (H2).
- **Engineering Wins:** Successfully handled the "iPhone Problem" (HEIC to PNG conversion pipeline).

### 5. GDPR & Ethics (1:00 min)
- **Privacy by Design:** Local-only processing on Edge hardware means biometric data never leaves the school network.
- **Legal Grounds:** Compliance with Art. 9 DSGVO through explicit "Opt-In" and strict proportionality.
- **Transparency:** System logging allows for audit trails while protecting student identity through hashing/local storage.

### 6. Conclusion & Outlook (1:00 min)
- **Answer to Leitfrage:** Yes, local Edge Computing provides the necessary performance and legal security for schools.
- **Future Work:**
    - Migration to **PostgreSQL** for higher concurrency.
    - Implementation of **Liveness Detection** (Anti-spoofing).
    - Transition to **Live Video Streams** for faster throughput.

---

## Defense Responses (Answer Framework)

### Q1: "Warum haben Sie X statt Y gewählt?" (Tech Choices)
- **Position:** I prioritized development speed and local deployment capability.
- **Evidence:** SQLite was chosen for zero-config local storage on Raspberry Pi; React Native (Expo) allowed cross-platform use for guards/students.
- **Limitation:** SQLite struggles with high concurrent writes; React Native adds overhead compared to native Swift/Kotlin.
- **Implication:** For a single-school pilot, this stack is optimal; for a district-wide rollout, migrating to PostgreSQL/Native would be the next step.

### Q2: "Was sind die Schwächen Ihres Systems?" (Limitations)
- **Position:** The system is a robust prototype but lacks advanced physical security features.
- **Evidence:** Current face recognition depends heavily on ambient lighting and lacks 3D liveness detection (vulnerable to high-res photos).
- **Limitation:** It is not currently "military grade" security.
- **Implication:** It serves as a strong **deterrent** and **verification tool** in supervised school environments, rather than an unmanned high-security gate.

### Q3: "Wie skaliert das System?" (Scalability)
- **Position:** The architecture is horizontally scalable at the Edge but requires backend hardening.
- **Evidence:** Every entrance can have its own Raspberry Pi (Edge Node).
- **Limitation:** The central SQLite database becomes a bottleneck as user counts grow towards thousands.
- **Implication:** Future iterations would use a centralized PostgreSQL cluster or a distributed sync mechanism for multi-entrance synchronization.

### Q4: "Was haben Sie persönlich gelernt?" (Reflection)
- **Position:** I gained deep insights into the "Privacy by Design" philosophy and full-stack integration.
- **Evidence:** Managing the HEIC-to-PNG pipeline and TensorFlow memory issues taught me how to handle real-world hardware constraints.
- **Limitation:** I realized that technical excellence is useless without a solid legal/ethical framework (GDPR).
- **Implication:** This project shaped my understanding of how to build AI systems that respect human rights rather than just "optimizing for accuracy".

### Q5: "Wie gehen Sie mit False Positives/Negatives um?" (Security)
- **Position:** I use a conservative threshold combined with human oversight.
- **Evidence:** The Euclidean distance threshold is set to **0.6**, which minimizes False Positives (impersonation).
- **Limitation:** This leads to occasional False Negatives (legitimate users denied) in poor lighting.
- **Implication:** The system is designed as a **Guard Assistant**; if the AI fails, the guard performs a manual ID check, ensuring security is never compromised by "computer says no".
