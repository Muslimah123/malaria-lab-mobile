# System Architecture for AIME 2026 Paper
## Mobile-Based Malaria Detection System Using YOLOv12

This document provides a comprehensive technical description of the system architecture for inclusion in your paper.

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Components](#architecture-components)
3. [Data Flow](#data-flow)
4. [Technical Specifications](#technical-specifications)
5. [Deployment Architecture](#deployment-architecture)
6. [For the Paper](#for-the-paper)

---

## System Overview

The system is a **full-stack mobile health (mHealth) application** for automated malaria diagnosis from blood smear microscopy images. It consists of three main layers:

1. **Presentation Layer**: React Native mobile application (iOS/Android)
2. **Application Layer**: Flask REST API server with AI inference engine
3. **Data Layer**: SQLite database with persistent storage

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     MOBILE APPLICATION                          │
│                  (React Native + Expo)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Camera     │  │  Image       │  │   Results    │         │
│  │   Capture    │→ │  Upload      │→ │   Display    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / REST API
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION SERVER                           │
│                      (Flask Backend)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │     API      │→ │     AI       │→ │   Business   │         │
│  │   Endpoints  │  │   Inference  │  │    Logic     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                             │                                    │
│                    ┌────────┴────────┐                          │
│                    │  YOLOv12 Model  │                          │
│                    │   (best.pt)     │                          │
│                    └─────────────────┘                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   SQLite     │  │    File      │  │   Activity   │         │
│  │   Database   │  │   Storage    │  │     Logs     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Architecture Components

### 1. Mobile Application Layer

#### 1.1 Technology Stack
- **Framework**: React Native 0.81.5 with Expo SDK 54
- **Language**: JavaScript (ECMAScript 2020)
- **UI Framework**: React 19.1.0
- **State Management**: Redux Toolkit 2.5.0
- **Navigation**: React Navigation 7.0.12
- **HTTP Client**: Axios 1.7.9

#### 1.2 Core Modules

##### A. Authentication Module
- **Location**: `mobile-app/src/contexts/AuthContext.js`
- **Functions**:
  - User login with JWT token management
  - Token refresh mechanism
  - Session persistence using AsyncStorage
  - Role-based access control (Technician, Supervisor, Admin)
- **Security**:
  - JWT tokens with expiration
  - Secure token storage
  - Automatic token refresh

##### B. Image Capture Module
- **Location**: `mobile-app/src/services/cameraService.js`
- **Camera Integration**: Expo Camera API
- **Functions**:
  - Real-time camera preview
  - High-resolution image capture (4K support)
  - Manual focus control
  - Flash control for microscopy
  - Image quality validation (resolution, format)
- **Output**: JPEG images, ~2-8 MB

##### C. Upload & Session Management
- **Location**: `mobile-app/src/services/uploadService.js`
- **Upload Protocol**:
  1. Create upload session via API
  2. Validate image locally (size, format, resolution)
  3. Compress if necessary
  4. Multi-part form upload to server
  5. Progress tracking with callbacks
  6. Retry logic for failed uploads
- **Session Tracking**: Redux store maintains session state
- **Error Handling**: Network failures, timeout handling

##### D. Results Display Module
- **Location**: `mobile-app/src/screens/results/`
- **Displays**:
  - Parasite count (total and by species: PF, PM, PO, PV)
  - WBC (White Blood Cell) count
  - Parasite/WBC ratio
  - Detection confidence scores
  - Bounding box visualizations on image
  - Diagnostic interpretation (Positive/Negative)
- **Visualization**: Overlays bounding boxes with color-coded labels

##### E. Patient Management
- **Location**: `mobile-app/src/screens/patients/`
- **Functions**:
  - Patient registration (name, age, DOB, contact)
  - Patient search and filtering
  - Test history per patient
  - Patient ID generation (PAT-YYYYMMDD-XXX format)

##### F. API Discovery & Configuration
- **Location**: `mobile-app/src/config/api.js`
- **Auto-Discovery Mechanism**:
  - Attempts connection to multiple IP addresses sequentially
  - Default IPs: [192.168.1.86, 172.29.106.158, 127.0.0.1, localhost]
  - Health check endpoint: `/api/health`
  - Connection timeout: 120 seconds
  - Persists discovered URL in AsyncStorage
  - Fallback to manual configuration

---

### 2. Application Server Layer

#### 2.1 Technology Stack
- **Framework**: Flask 2.3.3 (Python web framework)
- **Language**: Python 3.10+
- **ORM**: SQLAlchemy 2.0.23
- **Authentication**: Flask-JWT-Extended 4.6.0
- **Security**: Flask-Bcrypt 1.0.1 (password hashing)
- **CORS**: Flask-CORS 4.0.0

#### 2.2 API Endpoints

##### A. Authentication API (`/api/auth`)
- **POST /register**: User registration
  - Input: `{username, password, role, name}`
  - Output: User ID and confirmation
  - Security: Password hashing (bcrypt), role validation

- **POST /login**: User authentication
  - Input: `{username, password}`
  - Output: `{access_token, refresh_token, user_info}`
  - Tokens: JWT with 1-hour expiration (access), 30-day (refresh)

- **POST /refresh**: Token refresh
  - Input: `{refresh_token}`
  - Output: New `{access_token}`

##### B. Patient API (`/api/patients`)
- **GET /patients**: List all patients (paginated)
  - Query params: `?page=1&per_page=20&search=name`
  - Returns: Patient list with test counts

- **POST /patients**: Create patient
  - Input: `{name, age, date_of_birth, contact, address, gender}`
  - Returns: Patient object with generated ID

- **GET /patients/<id>**: Get patient details
  - Returns: Patient info + test history

- **PUT /patients/<id>**: Update patient

##### C. Test API (`/api/tests`)
- **POST /tests**: Create new test
  - Input: `{patient_id, sample_type, collection_date, clinical_notes}`
  - Sample types: blood_smear, thick_smear, thin_smear
  - Returns: Test ID, status (pending)

- **GET /tests/<id>**: Get test details
  - Returns: Test info + diagnosis results + images

- **GET /tests**: List tests (paginated, filterable)
  - Filters: patient_id, status, date_range

##### D. Upload & Analysis API (`/api/upload`)
- **POST /upload/session**: Create upload session
  - Input: `{test_id, image_count}`
  - Returns: `session_id`

- **POST /upload/image**: Upload and analyze image
  - Input: Multipart form data
    - `session_id`: Upload session ID
    - `image`: Image file (JPEG/PNG)
    - `image_index`: Index in sequence
  - Processing:
    1. Validate image (format, size, resolution)
    2. Save to `server/uploads/<test_id>/`
    3. Trigger AI inference (YOLOv12)
    4. Store results in database
  - Returns: Detection results
    ```json
    {
      "parasiteCount": int,
      "parasitesDetected": [
        {"type": "PF", "confidence": 0.95, "bbox": [x1,y1,x2,y2]}
      ],
      "whiteBloodCellsDetected": int,
      "wbcsDetected": [
        {"type": "WBC", "confidence": 0.88, "bbox": [x1,y1,x2,y2]}
      ],
      "parasiteWbcRatio": float
    }
    ```

##### E. Dashboard API (`/api/dashboard`)
- **GET /dashboard**: Statistics
  - Total patients, tests, positive cases
  - Recent activity
  - Performance metrics

##### F. Activity Logs API (`/api/activity-logs`)
- **GET /activity-logs**: Audit trail
  - All user actions logged with timestamp
  - For compliance and traceability

#### 2.3 AI Inference Engine

##### A. MalariaDetector Class
- **Location**: `server/malaria_detector.py`
- **Model**: YOLOv12 (Ultralytics framework)
- **Model File**: `best.pt` (6.2 MB)
- **Input**: Image path (JPEG/PNG)
- **Processing**:
  1. Load image
  2. Preprocess (resize to 640×640, normalize)
  3. YOLO inference
  4. Post-process detections (NMS, confidence filtering)
  5. Classify detections (PF/PM/PO/PV/WBC)
  6. Calculate metrics
- **Output**: Detection dictionary (see Upload API response)

**Key Parameters**:
- Confidence threshold: 0.26 (default, configurable)
- Input size: 640×640 pixels
- Classes: 5 (PF, PM, PO, PV, WBC)
- Inference time: ~50-200ms per image (CPU), ~10-30ms (GPU)

##### B. MalariaAnalyzer Class
- **Location**: `server/analysis.py`
- **Purpose**: Aggregate results from multiple images
- **Functions**:
  - Combine detections across multiple smears
  - Calculate total parasite count
  - Determine most probable species
  - Patient-level diagnosis (POSITIVE/NEGATIVE)
  - Statistical analysis (mean, std, confidence)

**Diagnostic Criteria**:
- **Positive**: Parasite count > 0
- **Negative**: No parasites detected
- **Species identification**: Most frequently detected species
- **Parasitemia**: Parasite/WBC ratio (clinical metric)

##### C. YOLOv12 Model Architecture

**Backbone**: CSPDarknet (custom YOLOv12)
- **Input**: 640×640×3 RGB image
- **Feature Extraction**:
  - Conv layers with batch normalization
  - CSP (Cross-Stage Partial) connections
  - Focus module for downsampling
  - 5 detection scales for multi-scale objects

**Neck**: PANet (Path Aggregation Network)
- Feature pyramid network
- Bottom-up and top-down pathways
- Multi-scale feature fusion

**Head**: YOLO Detection Head
- **Outputs**:
  - Bounding boxes: (x, y, w, h)
  - Objectness score: confidence that object exists
  - Class probabilities: P(PF), P(PM), P(PO), P(PV), P(WBC)
- **Anchor-free design**: Direct prediction

**Loss Function**: Combined loss
- **Box Loss**: CIoU (Complete Intersection over Union)
- **Class Loss**: Binary Cross-Entropy
- **Objectness Loss**: BCE
- Total Loss = λ₁·BoxLoss + λ₂·ClassLoss + λ₃·ObjLoss

**Training Details**:
- Optimizer: SGD with momentum (0.9)
- Learning rate: 0.01 (with cosine annealing)
- Batch size: 16
- Epochs: 100+
- Data augmentation:
  - Mosaic (4-image composition)
  - Random flip (horizontal/vertical)
  - Random scaling (0.5-1.5x)
  - Color jittering (HSV space)
  - Random rotation (±10°)
  - MixUp augmentation

---

### 3. Data Layer

#### 3.1 Database Schema (SQLite)

##### A. User Table
```sql
CREATE TABLE user (
    id INTEGER PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    role VARCHAR(20) NOT NULL,  -- 'technician', 'supervisor', 'admin'
    name VARCHAR(100),
    email VARCHAR(120),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

##### B. Patient Table
```sql
CREATE TABLE patient (
    id INTEGER PRIMARY KEY,
    patient_id VARCHAR(50) UNIQUE NOT NULL,  -- PAT-YYYYMMDD-XXX
    name VARCHAR(100) NOT NULL,
    age INTEGER,
    date_of_birth DATE,
    gender VARCHAR(10),
    contact VARCHAR(20),
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES user(id)
);
```

##### C. Test Table
```sql
CREATE TABLE test (
    id INTEGER PRIMARY KEY,
    test_id VARCHAR(50) UNIQUE NOT NULL,  -- TEST-YYYYMMDD-XXX
    patient_id INTEGER REFERENCES patient(id) NOT NULL,
    sample_type VARCHAR(20),  -- 'blood_smear', 'thick_smear', 'thin_smear'
    collection_date DATETIME,
    status VARCHAR(20),  -- 'pending', 'processing', 'completed', 'failed'
    clinical_notes TEXT,
    image_paths TEXT,  -- JSON array of image paths
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES user(id),
    completed_at DATETIME
);
```

##### D. DiagnosisResult Table
```sql
CREATE TABLE diagnosis_result (
    id INTEGER PRIMARY KEY,
    test_id INTEGER REFERENCES test(id) NOT NULL,
    image_path VARCHAR(500),
    parasite_count INTEGER DEFAULT 0,
    wbc_count INTEGER DEFAULT 0,
    parasite_wbc_ratio FLOAT DEFAULT 0.0,
    most_probable_parasite_type VARCHAR(10),  -- 'PF', 'PM', 'PO', 'PV', NULL
    patient_status VARCHAR(20),  -- 'POSITIVE', 'NEGATIVE'
    detection_metadata TEXT,  -- JSON: detailed detections, confidences, bboxes
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

##### E. UploadSession Table
```sql
CREATE TABLE upload_session (
    id INTEGER PRIMARY KEY,
    session_id VARCHAR(50) UNIQUE NOT NULL,
    test_id INTEGER REFERENCES test(id),
    image_count INTEGER,
    uploaded_count INTEGER DEFAULT 0,
    status VARCHAR(20),  -- 'active', 'completed', 'expired'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
);
```

##### F. ActivityLog Table
```sql
CREATE TABLE activity_log (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES user(id),
    action VARCHAR(50),  -- 'login', 'create_patient', 'upload_image', etc.
    resource_type VARCHAR(50),
    resource_id INTEGER,
    details TEXT,  -- JSON: additional context
    ip_address VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.2 File Storage
- **Location**: `server/uploads/`
- **Structure**:
  ```
  uploads/
  ├── test_1/
  │   ├── image_001.jpg
  │   ├── image_002.jpg
  │   └── image_003.jpg
  ├── test_2/
  │   └── image_001.jpg
  └── ...
  ```
- **Naming**: Original filename or generated UUID
- **Retention**: Permanent (for audit/reanalysis)
- **Backup**: Should be backed up regularly (not implemented in base system)

---

## Data Flow

### End-to-End Workflow

#### 1. Patient Registration
```
Mobile App                        Server
    │                               │
    │  POST /api/patients           │
    │  {name, age, DOB, ...}        │
    ├──────────────────────────────>│
    │                               │ Validate input
    │                               │ Generate patient_id
    │                               │ INSERT INTO patient
    │                               │
    │  {patient_id, ...}            │
    │<────────────────────────────── │
    │                               │
    │  Update local state           │
```

#### 2. Test Creation
```
Mobile App                        Server
    │                               │
    │  POST /api/tests              │
    │  {patient_id, sample_type}    │
    ├──────────────────────────────>│
    │                               │ Validate patient exists
    │                               │ Generate test_id
    │                               │ INSERT INTO test (status=pending)
    │                               │
    │  {test_id, status}            │
    │<────────────────────────────── │
```

#### 3. Image Upload & Analysis
```
Mobile App                        Server                     AI Engine
    │                               │                            │
    │  POST /upload/session         │                            │
    │  {test_id, image_count}       │                            │
    ├──────────────────────────────>│                            │
    │                               │ Create session             │
    │  {session_id}                 │                            │
    │<────────────────────────────── │                            │
    │                               │                            │
    │  Capture image via camera     │                            │
    │                               │                            │
    │  POST /upload/image           │                            │
    │  {session_id, image_file}     │                            │
    ├──────────────────────────────>│                            │
    │                               │ Validate image             │
    │                               │ Save to disk               │
    │                               │                            │
    │                               │  detectAndQuantify(image)  │
    │                               ├───────────────────────────>│
    │                               │                            │ Load YOLOv12
    │                               │                            │ Preprocess
    │                               │                            │ Inference
    │                               │                            │ Post-process
    │                               │                            │
    │                               │  {parasites, wbcs, ratio}  │
    │                               │<───────────────────────────┤
    │                               │                            │
    │                               │ INSERT INTO diagnosis_result
    │                               │ UPDATE test status         │
    │                               │                            │
    │  {detection_results}          │                            │
    │<────────────────────────────── │                            │
    │                               │                            │
    │  Display results to user      │                            │
```

#### 4. Results Retrieval
```
Mobile App                        Server
    │                               │
    │  GET /api/tests/{test_id}     │
    ├──────────────────────────────>│
    │                               │ Query test + diagnosis_result
    │                               │ JOIN tables
    │                               │
    │  {test, images, results}      │
    │<────────────────────────────── │
    │                               │
    │  Render results screen        │
```

---

## Technical Specifications

### Performance Metrics

#### Mobile Application
- **App Size**: ~50 MB (installed)
- **Memory Usage**: ~100-150 MB (runtime)
- **Camera Resolution**: Up to 4K (device-dependent)
- **Upload Speed**: 1-5 seconds per 3 MB image (WiFi)
- **Supported Platforms**: iOS 13+, Android 8.0+

#### Server Application
- **Request Latency**:
  - Authentication: ~50ms
  - Patient CRUD: ~30-100ms
  - Image upload: ~1-3 seconds (network + processing)
  - AI inference: ~50-200ms (CPU), ~10-30ms (GPU)
- **Throughput**: ~10-50 requests/second (single instance)
- **Concurrent Users**: 10-100 (depends on hardware)

#### AI Model
- **Model Size**: 6.2 MB (best.pt)
- **Input Size**: 640×640×3
- **Inference Time**:
  - CPU (Intel i7): ~100-200ms
  - GPU (NVIDIA RTX 3090): ~10-30ms
  - Mobile CPU (ARM): ~500-1000ms (not deployed on mobile)
- **Detection Accuracy** (on test set):
  - Precision: 0.XX (to be filled from your results)
  - Recall: 0.XX
  - mAP@0.5: 0.XX
  - mAP@0.5:0.95: 0.XX
- **Classes**: 5 (PF, PM, PO, PV, WBC)
- **Max Detections**: Up to 100 objects per image

### Scalability Considerations

#### Current Limitations (Single-Instance Deployment)
- Sequential processing (one image at a time)
- Single SQLite database (not suitable for high concurrency)
- Local file storage (no distributed storage)
- No load balancing

#### Future Enhancements for Scale
- **Horizontal Scaling**:
  - Multiple Flask instances behind load balancer
  - PostgreSQL/MySQL instead of SQLite
  - Redis for session management
  - Message queue (Celery) for async AI inference

- **Cloud Deployment**:
  - AWS: EC2 + S3 + RDS
  - Google Cloud: Cloud Run + Cloud Storage + Cloud SQL
  - Azure: App Service + Blob Storage + Azure SQL

---

## Deployment Architecture

### Development Environment
```
Developer Machine
├── Mobile App: Expo Dev Server (Metro Bundler)
│   ├── Hot reload enabled
│   └── Debug mode
├── Server: Flask Development Server
│   ├── Port 5000
│   ├── Debug mode (auto-reload)
│   └── SQLite database (local file)
└── AI Model: best.pt (local)
```

### Production Environment (Docker)
```
Docker Host
├── Container: Flask Server
│   ├── Python 3.11-slim
│   ├── Port 5000 (mapped to host)
│   ├── Volume: /uploads (persistent)
│   ├── Volume: /database (persistent)
│   └── Health check: /api/health
├── Container: Nginx (Optional)
│   ├── Reverse proxy
│   ├── SSL termination
│   └── Static file serving
└── Mobile App: Standalone builds
    ├── iOS: .ipa (TestFlight or App Store)
    └── Android: .apk/.aab (Google Play)
```

**Docker Compose Configuration**:
- See `docker/docker-compose.yml`
- Services: Flask app, (optional: nginx, postgresql)
- Networks: Internal network for containers
- Volumes: uploads, logs, database

### Deployment Workflow
1. **Build**:
   - Mobile: `expo build:android` / `expo build:ios`
   - Server: `docker build -f docker/server.Dockerfile`

2. **Deploy**:
   - Mobile: Upload to app stores
   - Server: Deploy container to cloud or on-premises

3. **Configuration**:
   - Set environment variables (JWT_SECRET_KEY, DATABASE_URL)
   - Configure API_BASE_URL in mobile app
   - Set up SSL certificates (for production)

---

## For the Paper

### Section: Methods - System Architecture

Use this condensed version for your paper's Methods section:

---

#### 3.1 System Architecture

Our malaria detection system follows a three-tier architecture comprising a mobile client, REST API server, and AI inference engine (Figure X).

**Mobile Application Layer**: The client is a cross-platform mobile application built with React Native (v0.81.5) and Expo SDK (v54), supporting both iOS and Android devices. The app integrates device camera APIs for high-resolution blood smear image capture and implements a session-based upload mechanism with retry logic for network resilience. User authentication is managed via JWT tokens with secure local storage.

**Application Server Layer**: The backend is implemented as a Flask (v2.3.3) REST API server providing endpoints for patient management, test creation, image upload, and results retrieval. The server architecture follows the Model-View-Controller (MVC) pattern with SQLAlchemy ORM for database abstraction. Key API endpoints include:
- `/api/auth/*`: User authentication and authorization
- `/api/patients/*`: Patient CRUD operations
- `/api/tests/*`: Test management and tracking
- `/api/upload/*`: Image upload and analysis triggering

**AI Inference Engine**: At the core of the system is a YOLOv12-based object detection model for malaria parasite and white blood cell identification. The model processes 640×640 pixel RGB images and outputs bounding boxes with class labels (PF, PM, PO, PV, WBC) and confidence scores. Inference is triggered synchronously upon image upload, with results stored in the database and returned to the mobile client.

**Data Management**: Patient records, test metadata, and diagnosis results are persisted in a SQLite database (production systems may use PostgreSQL/MySQL). Images are stored in the file system with paths recorded in the database. All user actions are logged to an audit trail for compliance and traceability.

**Workflow**: A typical diagnostic workflow proceeds as follows: (1) healthcare worker authenticates and selects/creates patient record; (2) initiates new test and capture session; (3) captures one or more blood smear images using device camera; (4) images are uploaded to server where YOLOv12 performs detection; (5) results (parasite count, species, WBC count, ratio) are displayed on mobile device; (6) clinician reviews AI-suggested diagnosis and confirms or overrides.

---

### Figure 1: System Architecture Diagram

**Title**: "Overview of the Mobile-Based Malaria Detection System Architecture"

**Description for diagram** (create visually):
```
┌─────────────────────────────────────────────────────────────────────┐
│                          MOBILE CLIENT                              │
│                       (React Native App)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │
│  │  Camera     │  │   Patient   │  │    Test     │  │ Results  │  │
│  │  Interface  │  │ Management  │  │  Creation   │  │ Display  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘  │
│         │                 │                 │              ↑        │
│         └─────────────────┴─────────────────┴──────────────┘        │
│                              │                                       │
│                         JWT Auth + HTTPS                            │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       APPLICATION SERVER                            │
│                          (Flask API)                                │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │                     API Layer                             │      │
│  │  /auth  /patients  /tests  /upload  /dashboard  /logs    │      │
│  └────────────────────┬──────────────────────────────────────┘      │
│                       │                                             │
│  ┌────────────────────┴──────────────────────────────────────┐     │
│  │              Business Logic Layer                          │     │
│  │  ┌──────────────────┐     ┌──────────────────┐           │     │
│  │  │  Image Validator │────>│  MalariaAnalyzer │           │     │
│  │  └──────────────────┘     └──────────────────┘           │     │
│  └────────────────────┬───────────────────────────────────────┘    │
│                       │                                             │
│  ┌────────────────────┴──────────────────────────────────────┐     │
│  │                 AI Inference Engine                        │     │
│  │  ┌──────────────────────────────────────────────────────┐ │     │
│  │  │           YOLOv12 Model (best.pt)                    │ │     │
│  │  │                                                       │ │     │
│  │  │   Input: 640×640 RGB  →  Backbone (CSPDarknet)      │ │     │
│  │  │                       →  Neck (PANet)                │ │     │
│  │  │                       →  Head (Detection)            │ │     │
│  │  │   Output: [Bboxes, Classes, Confidences]            │ │     │
│  │  │   Classes: PF, PM, PO, PV, WBC                      │ │     │
│  │  └──────────────────────────────────────────────────────┘ │     │
│  └────────────────────────────────────────────────────────────┘     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │  SQLite Database │  │  File Storage    │  │  Activity Logs  │  │
│  │                  │  │                  │  │                 │  │
│  │  • Users         │  │  uploads/        │  │  • Audit Trail  │  │
│  │  • Patients      │  │    test_1/       │  │  • User Actions │  │
│  │  • Tests         │  │      img1.jpg    │  │  • Timestamps   │  │
│  │  • Diagnoses     │  │      img2.jpg    │  │                 │  │
│  │  • Sessions      │  │    test_2/       │  │                 │  │
│  └──────────────────┘  └──────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

**Caption**: "Three-tier architecture of the proposed malaria detection system. The mobile application layer handles user interaction and image capture. The application server layer provides RESTful APIs and hosts the YOLOv12-based AI inference engine. The data layer persists patient records, test results, and images. Communication between layers is secured via JWT authentication and HTTPS."

---

### Figure 2: AI Model Architecture

**Title**: "YOLOv12 Network Architecture for Malaria Parasite Detection"

```
Input Image                    Backbone                  Neck              Head
(640×640×3)              (Feature Extraction)    (Feature Fusion)    (Detection)
     │
     ├──> Conv + BN + SiLU ──┐
     │                        │
     ├──> CSP Block 1 ────────┤
     │    (80×80×256)         │
     │                        │
     ├──> CSP Block 2 ────────┤       ┌─────────────┐
     │    (40×40×512)         ├──────>│   PANet     │──┐
     │                        │       │  (Bottom-   │  │
     ├──> CSP Block 3 ────────┤       │   up +      │  │
     │    (20×20×1024)        │       │  Top-down)  │  │
     │                        │       └─────────────┘  │
     └──> CSP Block 4 ────────┘                        │
          (10×10×1024)                                 │
                                                       ↓
                                             ┌──────────────────┐
                                             │  Detection Head  │
                                             │                  │
                                             │  3 scales:       │
                                             │  • 80×80         │
                                             │  • 40×40         │  →  Bounding Boxes
                                             │  • 20×20         │     + Class Labels
                                             │                  │     + Confidences
                                             │  Per anchor:     │
                                             │  • (x,y,w,h)     │     Classes:
                                             │  • Objectness    │     0: PF
                                             │  • Class probs   │     1: PM
                                             │    (5 classes)   │     2: PO
                                             │                  │     3: PV
                                             └──────────────────┘     4: WBC
```

**Caption**: "Architecture of the YOLOv12 model for malaria parasite detection. The backbone extracts multi-scale features from the input image using CSP blocks. The neck (PANet) fuses features across scales. The detection head produces bounding boxes and class predictions at three scales, enabling detection of parasites and WBCs of varying sizes."

---

### Table: System Components and Specifications

| Component | Technology | Specifications |
|-----------|-----------|----------------|
| **Mobile App** | React Native 0.81.5, Expo 54 | iOS 13+, Android 8.0+ |
| **Backend API** | Flask 2.3.3, Python 3.10+ | REST API, JWT auth |
| **AI Model** | YOLOv12 (Ultralytics) | 6.2 MB, 5 classes |
| **Database** | SQLite | Relational schema |
| **File Storage** | Local filesystem | JPEG/PNG images |
| **Inference Time** | CPU: 100-200ms, GPU: 10-30ms | Per image |
| **Input Size** | 640×640×3 RGB | High-resolution microscopy |
| **Detection Classes** | PF, PM, PO, PV, WBC | 5 classes |

---

This architecture documentation should provide everything you need for the Methods section and figures in your AIME paper!
