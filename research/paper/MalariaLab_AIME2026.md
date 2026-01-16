# MalariaLab: Mobile Point-of-Care Malaria Diagnosis Using Deep Learning-Based Multi-Species Plasmodium Detection

---

## Abstract

Malaria remains a leading cause of morbidity and mortality in tropical and subtropical regions, with accurate and timely diagnosis being critical for effective treatment. Traditional microscopic examination of blood smears, while considered the gold standard, requires trained personnel and laboratory infrastructure often unavailable in resource-limited settings. We present MalariaLab, a mobile point-of-care diagnostic system that leverages deep learning for automated detection and species identification of malaria parasites in blood smear images. Our system employs a YOLOv12-based object detection model capable of identifying four *Plasmodium* species (*P. falciparum*, *P. malariae*, *P. ovale*, and *P. vivax*) alongside white blood cells for parasitemia quantification. The model achieves [XX]% precision and [XX]% recall on our test dataset, with a mean average precision (mAP@0.5) of [XX]%. Integrated into a cross-platform mobile application, MalariaLab enables healthcare workers to capture blood smear images, receive real-time AI-assisted diagnosis, and manage patient records without requiring specialized equipment beyond a smartphone. Our system demonstrates the potential for AI-powered mobile health solutions to expand access to quality malaria diagnostics in underserved communities.

**Keywords:** Malaria detection, Deep learning, YOLOv12, Mobile health, Point-of-care diagnostics, Object detection, *Plasmodium* species identification

---

## 1. Introduction

Malaria is a life-threatening parasitic disease caused by *Plasmodium* parasites transmitted through the bites of infected female *Anopheles* mosquitoes. Despite significant progress in global malaria control, the disease continues to pose a substantial public health burden, particularly in sub-Saharan Africa. According to the World Health Organization (WHO), there were an estimated 249 million malaria cases and 608,000 malaria-related deaths globally in 2022, with children under five years accounting for approximately 80% of all malaria deaths in the African region [1]. The economic impact is equally devastating, with malaria estimated to cost Africa over $12 billion annually in lost productivity and healthcare expenditures [2].

Accurate and timely diagnosis is fundamental to effective malaria case management. The WHO recommends parasitological confirmation of all suspected malaria cases before treatment initiation [3]. However, achieving universal diagnostic coverage remains challenging, particularly in rural and remote areas where the disease burden is often highest. The gold standard for malaria diagnosis—microscopic examination of Giemsa-stained blood smears—requires trained microscopists, quality reagents, and functional laboratory infrastructure [4]. In many endemic regions, these resources are scarce, leading to presumptive treatment based on clinical symptoms, which contributes to drug resistance, unnecessary treatment costs, and missed diagnoses of other febrile illnesses [5].

Rapid diagnostic tests (RDTs) have emerged as an alternative to microscopy, offering point-of-care testing without the need for laboratory equipment or specialized training [6]. While RDTs have significantly expanded diagnostic access, they have limitations including variable sensitivity at low parasitemia, inability to quantify parasite density, challenges in species differentiation beyond *P. falciparum*, and concerns about *pfhrp2/3* gene deletions causing false-negative results [7,8]. Microscopy remains essential for species identification, treatment monitoring, and quality assurance of RDT results.

The convergence of advances in artificial intelligence, particularly deep learning, with the ubiquity of smartphones presents a compelling opportunity to address the malaria diagnostic gap. Computer-aided diagnosis (CAD) systems can potentially democratize access to expert-level microscopy by automating the detection and classification of malaria parasites in blood smear images [9]. Recent years have witnessed remarkable progress in applying convolutional neural networks (CNNs) and object detection architectures to medical image analysis, achieving performance comparable to or exceeding human experts in various diagnostic tasks [10,11].

In this paper, we present MalariaLab, an end-to-end mobile point-of-care system for malaria diagnosis that integrates state-of-the-art deep learning with a user-friendly mobile application. Our system addresses several limitations of existing approaches:

**Contributions.** The main contributions of this work are:

1. **Multi-species detection capability**: Unlike most existing systems that focus solely on *P. falciparum* detection or binary (positive/negative) classification, MalariaLab identifies and differentiates four clinically relevant *Plasmodium* species (*P. falciparum*, *P. malariae*, *P. ovale*, and *P. vivax*), enabling species-appropriate treatment decisions.

2. **Parasitemia quantification**: By simultaneously detecting white blood cells (WBCs) alongside parasites, our system calculates the parasite-to-WBC ratio, providing a standardized measure of parasitemia that is clinically meaningful for disease severity assessment and treatment monitoring.

3. **YOLOv12-based real-time detection**: We employ the latest YOLO (You Only Look Once) architecture, YOLOv12, for efficient object detection, achieving a balance between accuracy and inference speed suitable for deployment on resource-constrained devices.

4. **Complete mobile health ecosystem**: Beyond the AI model, we contribute a fully functional mobile application with patient management, test tracking, and result visualization capabilities, designed for practical deployment in clinical settings.

5. **Comprehensive evaluation**: We provide rigorous evaluation including per-species performance analysis, comparison with baseline methods, and ablation studies demonstrating the contribution of key system components.

The remainder of this paper is organized as follows. Section 2 reviews related work in malaria diagnosis, deep learning for medical imaging, and mobile health applications. Section 3 describes the system architecture, including the mobile application, backend infrastructure, and AI inference engine. Section 4 details the dataset, training methodology, and experimental setup. Section 5 presents our results including quantitative metrics, baseline comparisons, and ablation studies. Section 6 discusses the clinical implications, limitations, and future directions. Section 7 concludes the paper.

---

## 2. Related Work

### 2.1 Traditional Malaria Diagnosis

Microscopic examination of Giemsa-stained blood smears has been the cornerstone of malaria diagnosis for over a century [12]. The technique involves preparing thin and thick blood films, staining with Giemsa or Wright's stain, and examining under light microscopy at 100x oil immersion magnification. Thick films offer higher sensitivity for detecting parasites due to concentration of blood components, while thin films preserve parasite morphology essential for species identification [13].

Skilled microscopists can detect parasitemia as low as 50-100 parasites/μL in thick films and accurately differentiate *Plasmodium* species based on morphological features including parasite size relative to the red blood cell, presence of Schüffner's dots or Maurer's clefts, and characteristics of different life cycle stages [14]. However, microscopy is labor-intensive, subject to reader fatigue, and requires significant training—WHO recommends 6-12 months of training for competency [4]. Studies have documented substantial inter-observer variability, particularly for species identification and low-density infections [15,16].

Rapid diagnostic tests (RDTs) detect *Plasmodium*-specific antigens in blood samples through immunochromatographic methods [6]. Most RDTs target histidine-rich protein 2 (HRP2) specific to *P. falciparum* and/or pan-*Plasmodium* lactate dehydrogenase (pLDH) or aldolase. While RDTs have revolutionized malaria diagnosis in resource-limited settings, they cannot quantify parasitemia, have reduced sensitivity below 100-200 parasites/μL, and face challenges from *pfhrp2/3* gene deletions, particularly in the Horn of Africa and South America [7,17].

Molecular methods including polymerase chain reaction (PCR) and loop-mediated isothermal amplification (LAMP) offer superior sensitivity (detecting <1 parasite/μL) and specificity for species identification [18]. However, these techniques require laboratory infrastructure, trained personnel, and have longer turnaround times, limiting their utility for routine point-of-care diagnosis in endemic settings.

### 2.2 Deep Learning for Malaria Detection

The application of deep learning to malaria diagnosis has gained substantial momentum since the seminal work demonstrating CNN-based classification of malaria-infected cells [19]. Early approaches predominantly framed malaria detection as an image classification problem, training CNNs to distinguish infected from uninfected red blood cells in segmented cell images.

Rajaraman et al. [20] evaluated multiple pre-trained CNN architectures (VGG, ResNet, DenseNet, Xception) for malaria cell classification, achieving over 95% accuracy on the NIH malaria dataset. Transfer learning from ImageNet pre-training proved effective, with customized architectures achieving 97.4% sensitivity and 99.5% specificity. Subsequent work explored attention mechanisms [21], ensemble methods [22], and lightweight architectures suitable for mobile deployment [23].

Object detection approaches have emerged as a more clinically realistic paradigm, as they operate on whole microscopy fields rather than pre-segmented cells and can simultaneously detect multiple parasites and quantify parasitemia [24]. Hung et al. [25] applied Faster R-CNN for malaria parasite detection in thick blood smears, demonstrating the feasibility of end-to-end detection without manual cell segmentation. Yang et al. [26] compared multiple object detection architectures (Faster R-CNN, SSD, YOLOv3) for malaria detection, finding YOLOv3 offered the best speed-accuracy trade-off.

The YOLO family of detectors has proven particularly suitable for malaria microscopy due to its single-stage architecture enabling real-time inference. Abdurahman et al. [27] applied YOLOv4 to malaria detection, achieving mAP of 92.5% with inference speeds suitable for clinical deployment. More recent work has explored YOLOv5 [28] and YOLOv8 [29] for malaria detection, with progressive improvements in both accuracy and efficiency.

Species identification adds complexity beyond binary detection, as morphological differences between species are subtle and require careful examination of multiple features. Vijayalakshmi and Kanna [30] developed a multi-class CNN for species classification, achieving 95% accuracy across four species. Das et al. [31] combined object detection with species classification in a two-stage pipeline. However, most existing systems either focus on single-species detection (typically *P. falciparum*) or treat species classification as a separate downstream task.

### 2.3 YOLO Architectures in Medical Imaging

The YOLO (You Only Look Once) architecture introduced by Redmon et al. [32] revolutionized object detection by framing it as a single regression problem, predicting bounding boxes and class probabilities directly from full images in one evaluation. This unified architecture enables real-time detection, making it suitable for clinical applications requiring rapid turnaround.

Subsequent versions have introduced architectural improvements enhancing both accuracy and efficiency. YOLOv4 [33] incorporated CSPDarknet backbone, PANet neck, and various "bag of freebies" training techniques. YOLOv5 [34] (Ultralytics) offered improved usability and PyTorch implementation, becoming widely adopted in medical imaging applications. YOLOv8 [35] introduced anchor-free detection and improved architecture, achieving state-of-the-art results on COCO benchmarks.

YOLOv12, the latest iteration employed in our work, introduces advanced attention mechanisms and architectural refinements building upon the Ultralytics framework. Key innovations include area-based attention (AAttn) for improved feature representation, refined CSP blocks for efficient feature extraction, and optimized detection heads for improved small object detection—particularly relevant for detecting parasites within blood smear images.

YOLO architectures have been successfully applied across medical imaging domains including tumor detection in histopathology [36], cell detection in cytology [37], lesion detection in dermatology [38], and anatomical structure localization in radiology [39]. In microscopy specifically, YOLO-based approaches have demonstrated strong performance for bacterial detection [40], blood cell counting [41], and parasitological diagnosis [42].

### 2.4 Mobile Health for Malaria

Mobile health (mHealth) interventions have shown promise for improving malaria case management in resource-limited settings [43]. Smartphone-based applications have been developed for malaria surveillance [44], treatment adherence support [45], and community health worker decision support [46].

For diagnosis specifically, several systems have explored smartphone-based microscopy using external lens attachments or adapters to convert smartphones into portable microscopes [47]. Motic's EasyScan system combines digital microscopy with AI for automated malaria detection [48]. However, most smartphone microscopy solutions require additional hardware, limiting scalability and adoption.

Software-only approaches that process images captured from conventional microscopes through smartphone cameras have been explored [49,50]. These systems offer the advantage of leveraging existing microscopy infrastructure while adding AI-assisted interpretation. However, image quality variability from different microscope-camera combinations presents challenges for robust model generalization.

Our work contributes to this domain by providing an integrated mobile health ecosystem combining AI-powered analysis with patient management functionality, designed for practical clinical deployment without requiring specialized hardware beyond standard microscopy equipment and a smartphone.

### 2.5 Gap Analysis

Despite significant progress, several gaps remain in existing malaria detection systems:

1. **Limited species coverage**: Most systems focus on *P. falciparum* detection or binary classification, neglecting the clinical importance of species identification for appropriate treatment selection.

2. **Incomplete parasitemia quantification**: Few systems simultaneously detect WBCs for standardized parasitemia calculation, which is essential for severity assessment.

3. **Research prototypes vs. deployable systems**: Many published approaches demonstrate model performance but lack the surrounding infrastructure (patient management, data persistence, user interface) necessary for clinical deployment.

4. **Outdated architectures**: Most published work employs older detection architectures (YOLOv3-v5), not leveraging recent advances in object detection.

MalariaLab addresses these gaps by combining state-of-the-art YOLOv12 detection with multi-species identification, parasitemia quantification, and a complete mobile health ecosystem designed for point-of-care deployment.

---

## 3. System Architecture

### 3.1 Overview

MalariaLab is designed as a three-tier architecture comprising a mobile client layer for user interaction and image capture, an application server layer hosting the REST API and AI inference engine, and a data layer for persistent storage (Figure 1). This architecture balances computational requirements with deployment flexibility—computationally intensive AI inference occurs on the server, while the mobile client provides a responsive user interface and offline capability for patient data management.

The system workflow proceeds as follows: (1) healthcare workers authenticate and access patient records through the mobile application; (2) upon initiating a new diagnostic test, the worker captures one or more blood smear images using the smartphone camera attached to a conventional microscope; (3) images are uploaded to the server where the YOLOv12 model performs parasite and WBC detection; (4) results including parasite counts, species identification, and parasitemia calculations are returned and displayed on the mobile device; (5) the clinician reviews the AI-suggested diagnosis and confirms or modifies based on clinical judgment; (6) all results are persisted for future reference and reporting.

### 3.2 Mobile Application Layer

The client application is developed using React Native (v0.81.5) with Expo SDK (v54), enabling cross-platform deployment on both iOS and Android devices from a single codebase. React Native was selected for its mature ecosystem, strong community support, and ability to access native device capabilities including camera hardware.

#### 3.2.1 User Interface Components

The application comprises several functional modules:

**Authentication Module**: Implements JSON Web Token (JWT) based authentication with role-based access control supporting three user roles—technician, supervisor, and administrator. Access tokens expire after 1 hour with automatic refresh using longer-lived refresh tokens stored securely in the device keychain.

**Patient Management Module**: Provides CRUD (Create, Read, Update, Delete) operations for patient records including demographic information (name, date of birth, gender, contact details) and clinical history. Patients are assigned unique identifiers (format: PAT-YYYYMMDD-XXX) for tracking across visits.

**Test Management Module**: Handles the creation and tracking of diagnostic tests associated with patient records. Each test captures sample metadata including sample type (thick smear, thin smear), collection timestamp, and clinical notes. Tests progress through defined states: pending, processing, completed, or failed.

**Image Capture Module**: Integrates device camera capabilities for blood smear image acquisition. The module supports manual focus adjustment for optimal microscopy capture, flash control, and resolution settings. Images are validated locally (format, minimum resolution, file size) before upload.

**Results Display Module**: Visualizes detection results including annotated images with bounding boxes around detected parasites and WBCs, tabulated counts by species, calculated parasitemia (parasite/WBC ratio), and diagnostic interpretation. Color-coded overlays distinguish parasite types (red) from WBCs (blue).

#### 3.2.2 State Management and Offline Capability

Application state is managed using Redux Toolkit, providing predictable state updates and middleware support for asynchronous operations. Patient and test data are cached locally using AsyncStorage, enabling offline access to previously retrieved records. Network requests implement retry logic with exponential backoff for resilience to intermittent connectivity.

### 3.3 Application Server Layer

The backend is implemented as a RESTful API using Flask (v2.3.3), a lightweight Python web framework. The server handles authentication, business logic, database operations, and orchestrates AI inference.

#### 3.3.1 API Architecture

The API follows REST conventions with the following primary endpoints:

- `/api/auth/*`: Authentication endpoints (register, login, token refresh)
- `/api/patients/*`: Patient CRUD operations with pagination and search
- `/api/tests/*`: Test creation, retrieval, and status management
- `/api/upload/*`: Session-based image upload with analysis triggering
- `/api/dashboard/*`: Aggregated statistics for administrative views

Request authentication uses JWT tokens validated via Flask-JWT-Extended. Cross-origin resource sharing (CORS) is configured to accept requests from mobile clients. All endpoints return standardized JSON responses with appropriate HTTP status codes.

#### 3.3.2 Upload and Analysis Pipeline

Image upload follows a session-based protocol to support multi-image tests reliably:

1. **Session Creation**: Client requests an upload session specifying the associated test ID and expected image count. Server generates a unique session identifier with expiration timestamp.

2. **Image Upload**: Images are uploaded individually as multipart form data referencing the session ID. Each upload triggers validation (format, size, resolution) before storage.

3. **AI Inference**: Upon successful upload, the image is passed to the MalariaDetector module for analysis. Inference is performed synchronously, with timeout handling for failed analyses.

4. **Result Persistence**: Detection results (bounding boxes, classes, confidences) are stored in the database linked to the test record. Summary statistics (parasite count, WBC count, ratio) are calculated and persisted.

5. **Session Completion**: When all expected images are uploaded, the test status is updated to completed, and aggregated results across all images are computed.

### 3.4 AI Inference Engine

The core detection capability is provided by a YOLOv12 model trained for malaria parasite and WBC detection. The model is encapsulated in the `MalariaDetector` class, which handles image loading, preprocessing, inference, and post-processing.

#### 3.4.1 Model Architecture

YOLOv12 follows the established YOLO paradigm of single-stage object detection, predicting bounding boxes and class probabilities directly from input images. The architecture comprises three main components:

**Backbone (CSPDarknet)**: Extracts hierarchical features from input images using Cross-Stage Partial connections for efficient gradient flow. The backbone produces multi-scale feature maps at resolutions of 80×80, 40×40, and 20×20 relative to the 640×640 input, capturing objects at different scales.

**Neck (PANet)**: The Path Aggregation Network fuses features across scales through bottom-up and top-down pathways, enabling the detector to leverage both fine-grained and semantic features for accurate localization and classification.

**Detection Head**: Produces predictions at three scales, each outputting bounding box coordinates (x, y, width, height), objectness score, and class probabilities for the five target classes (PF, PM, PO, PV, WBC). YOLOv12 employs anchor-free detection, directly regressing box dimensions without predefined anchor templates.

The model processes 640×640×3 RGB images, with automatic letterbox padding for non-square inputs. Inference produces variable numbers of detections filtered by confidence threshold (default: 0.26) and non-maximum suppression (NMS) for overlapping predictions.

#### 3.4.2 Detection Classes

The model distinguishes five classes representing four *Plasmodium* species and white blood cells:

- **PF** (*Plasmodium falciparum*): The most virulent species, responsible for the majority of malaria deaths. Characterized by small ring-stage trophozoites and multiple parasites per cell.

- **PM** (*Plasmodium malariae*): Causes quartan malaria with 72-hour fever cycles. Distinguished by band-form trophozoites and compact schizonts.

- **PO** (*Plasmodium ovale*): Morphologically similar to *P. vivax* but with oval-shaped infected cells. Endemic primarily in West Africa.

- **PV** (*Plasmodium vivax*): The most widespread species, characterized by enlarged infected cells with Schüffner's dots and ameboid trophozoites.

- **WBC** (White Blood Cells): Detected for parasitemia quantification. The parasite/WBC ratio provides a standardized measure independent of blood film thickness.

#### 3.4.3 Inference Pipeline

The detection pipeline processes each uploaded image as follows:

1. **Preprocessing**: Image is loaded, resized to 640×640 with letterbox padding maintaining aspect ratio, normalized to [0,1] range, and converted to tensor format.

2. **Forward Pass**: The preprocessed tensor is passed through the YOLOv12 network, producing raw predictions across three detection scales.

3. **Post-processing**: Predictions are decoded to absolute coordinates, filtered by confidence threshold, and processed through NMS to eliminate duplicate detections.

4. **Classification**: Each detection is assigned to one of the five classes based on maximum class probability. Detections are separated into parasite (PF/PM/PO/PV) and WBC categories.

5. **Quantification**: Parasite count, WBC count, and parasite/WBC ratio are calculated. The most probable species is determined by highest frequency or highest confidence among detected parasites.

### 3.5 Data Layer

Persistent storage utilizes SQLite for structured data and filesystem storage for images. SQLite was selected for deployment simplicity—requiring no separate database server—while providing ACID compliance and SQL query capability.

#### 3.5.1 Database Schema

The relational schema comprises six primary tables:

**User**: Healthcare worker accounts with hashed passwords (bcrypt), roles, and contact information.

**Patient**: Patient demographics including generated identifier, name, date of birth, gender, and contact details.

**Test**: Diagnostic test records linking to patients, capturing sample type, collection metadata, status, and image paths.

**DiagnosisResult**: AI inference results including parasite count, WBC count, species identification, and detailed detection metadata (bounding boxes, confidences) stored as JSON.

**UploadSession**: Tracks multi-image upload sessions with expiration handling.

**ActivityLog**: Audit trail recording user actions with timestamps for compliance and traceability.

#### 3.5.2 File Storage

Uploaded images are stored in hierarchical directory structure (`uploads/test_{id}/`) with original filenames or generated UUIDs. Image paths are recorded in the database for retrieval. For production deployment, integration with cloud storage (S3, GCS) is recommended for scalability and backup.

### 3.6 Deployment Architecture

The system supports multiple deployment configurations:

**Development**: Mobile app runs via Expo development server with hot reload. Flask development server handles API requests with debug mode enabled. SQLite database stored locally.

**Production**: Mobile app compiled to standalone builds for iOS (IPA) and Android (APK/AAB). Flask app containerized using Docker with Gunicorn WSGI server. Nginx reverse proxy handles SSL termination and static file serving. Database may be migrated to PostgreSQL for improved concurrency.

The containerized architecture facilitates deployment on cloud platforms (AWS, GCP, Azure) or on-premises servers depending on data sovereignty requirements. Health check endpoints enable container orchestration and load balancing.

---

## 4. Materials and Methods

### 4.1 Dataset

[DESCRIBE YOUR DATASET HERE - Include:]
- Source of images (hospital, public dataset, collaboration)
- Total number of images
- Image resolution and format
- Annotation process (who annotated, tool used)
- Class distribution (number of examples per species)
- Train/validation/test split ratios and strategy

**Example text to adapt:**

We compiled a dataset of [X,XXX] blood smear images from [source description]. Images were captured at 100x magnification using [microscope model] and [camera/smartphone]. Ground truth annotations were provided by [two/three] expert pathologists using [annotation tool], with consensus labeling for disagreements. Inter-annotator agreement was [Cohen's kappa = X.XX].

The dataset contains [X,XXX] parasite annotations across four species: *P. falciparum* (n=X,XXX), *P. malariae* (n=XXX), *P. ovale* (n=XXX), and *P. vivax* (n=XXX), along with [X,XXX] WBC annotations. Data was split into training (70%), validation (15%), and test (15%) sets with stratification ensuring proportional representation of all species across splits.

### 4.2 Training Procedure

[DESCRIBE YOUR TRAINING - Include:]
- YOLOv12 configuration (variant: n/s/m/l)
- Pre-training (ImageNet, COCO, or from scratch)
- Hyperparameters (learning rate, batch size, epochs, optimizer)
- Data augmentation techniques
- Hardware specifications
- Training time

**Example text to adapt:**

We trained the YOLOv12 model using the Ultralytics framework with the following configuration: base architecture YOLOv12-[variant], initialized with COCO pre-trained weights. Training was conducted for [XXX] epochs with batch size [XX] using SGD optimizer (momentum=0.9, weight decay=0.0005). Learning rate followed cosine annealing schedule from initial rate 0.01 to final rate 0.0001 with [X] warmup epochs.

Data augmentation included mosaic composition (probability 1.0), random horizontal/vertical flips (probability 0.5), random scaling (0.5-1.5x), HSV color jittering (hue±0.015, saturation±0.7, value±0.4), and random rotation (±10°). Images were resized to 640×640 with letterbox padding.

Training was performed on [hardware description, e.g., NVIDIA RTX 3090 GPU with 24GB VRAM] for approximately [XX] hours. The best model was selected based on highest mAP@0.5 on the validation set.

### 4.3 Evaluation Metrics

We evaluate model performance using standard object detection metrics:

**Precision**: The proportion of detected objects that are true positives, calculated per class and averaged.

**Recall (Sensitivity)**: The proportion of ground truth objects that are correctly detected.

**F1-Score**: The harmonic mean of precision and recall, providing a balanced measure.

**Mean Average Precision (mAP)**: The area under the precision-recall curve, calculated at IoU threshold 0.5 (mAP@0.5) and averaged across IoU thresholds 0.5-0.95 in 0.05 increments (mAP@0.5:0.95).

**Clinical Metrics**: For diagnostic performance, we report sensitivity, specificity, positive predictive value (PPV), and negative predictive value (NPV) for malaria detection (any parasite present vs. negative).

### 4.4 Baseline Methods

To contextualize our results, we compare against the following baseline methods:

**YOLOv5**: The widely-adopted predecessor, trained with identical dataset and augmentation settings.

**YOLOv8**: The previous generation Ultralytics detector, similarly configured.

**[Published Method]**: [If you're comparing to a published paper, describe it here]

All baselines were trained using the same data splits, augmentation pipeline, and hardware for fair comparison.

### 4.5 Ablation Studies

We conducted ablation experiments to understand the contribution of key system components:

1. **Confidence Threshold**: Varying detection threshold from 0.1 to 0.7 to characterize the precision-recall trade-off.

2. **Data Augmentation**: Comparing full augmentation pipeline against training without mosaic augmentation and without any augmentation.

3. **Pre-training**: Comparing COCO pre-trained initialization against ImageNet pre-training and random initialization.

---

## [Sections 5-7 to be continued after you provide your results]

The remaining sections (Results, Discussion, Conclusion) should be written after you import your evaluation results and run the comprehensive evaluation. These sections will contain:

**Section 5 (Results)**: Tables and figures presenting quantitative metrics, baseline comparisons, per-class analysis, and ablation study results.

**Section 6 (Discussion)**: Interpretation of results, clinical implications, comparison with related work, limitations, and future directions.

**Section 7 (Conclusion)**: Summary of contributions and significance.

---

## References

[1] World Health Organization, "World Malaria Report 2023," Geneva: WHO, 2023.

[2] Gallup, J.L. and Sachs, J.D., "The economic burden of malaria," *American Journal of Tropical Medicine and Hygiene*, vol. 64, no. 1-2, pp. 85-96, 2001.

[3] World Health Organization, "Guidelines for Malaria," 4th ed., Geneva: WHO, 2023.

[4] WHO, "Malaria Microscopy Quality Assurance Manual," Version 2, Geneva: WHO, 2016.

[5] Amexo, M., et al., "Malaria misdiagnosis: effects on the poor and vulnerable," *The Lancet*, vol. 364, no. 9448, pp. 1896-1898, 2004.

[6] Moody, A., "Rapid diagnostic tests for malaria parasites," *Clinical Microbiology Reviews*, vol. 15, no. 1, pp. 66-78, 2002.

[7] Berhane, A., et al., "Major threat to malaria control programs by *Plasmodium falciparum* lacking histidine-rich protein 2, Eritrea," *Emerging Infectious Diseases*, vol. 24, no. 3, pp. 462-470, 2018.

[8] WHO, "Response Plan to *pfhrp2* Gene Deletions," Geneva: WHO, 2019.

[9] Poostchi, M., et al., "Image analysis and machine learning for detecting malaria," *Translational Research*, vol. 194, pp. 36-55, 2018.

[10] Esteva, A., et al., "Dermatologist-level classification of skin cancer with deep neural networks," *Nature*, vol. 542, no. 7639, pp. 115-118, 2017.

[11] McKinney, S.M., et al., "International evaluation of an AI system for breast cancer screening," *Nature*, vol. 577, no. 7788, pp. 89-94, 2020.

[12] Ross, R., "On some peculiar pigmented cells found in two mosquitoes fed on malarial blood," *British Medical Journal*, vol. 2, no. 1929, pp. 1786-1788, 1897.

[13] Wongsrichanalai, C., et al., "A review of malaria diagnostic tools: microscopy and rapid diagnostic test (RDT)," *The American Journal of Tropical Medicine and Hygiene*, vol. 77, no. 6, pp. 119-127, 2007.

[14] WHO, "Basic Malaria Microscopy," 2nd ed., Geneva: WHO, 2010.

[15] Kahama-Maro, J., et al., "Low quality of routine microscopy for malaria at different levels of the health system in Dar es Salaam," *Malaria Journal*, vol. 10, no. 1, pp. 1-10, 2011.

[16] Mukadi, P., et al., "External quality assessment of reading and interpretation of malaria rapid diagnostic tests among 1849 end-users in the Democratic Republic of Congo," *Acta Tropica*, vol. 130, pp. 39-45, 2014.

[17] Gatton, M.L., et al., "Pan-Plasmodium band sensitivity for Plasmodium falciparum detection in combination malaria rapid diagnostic tests," *Malaria Journal*, vol. 14, no. 1, pp. 1-8, 2015.

[18] Cnops, L., et al., "Malaria diagnosis and the identification of the parasite species: RT-PCR," *PLoS ONE*, vol. 6, no. 3, e17737, 2011.

[19] Liang, Z., et al., "CNN-based image analysis for malaria diagnosis," in *IEEE International Conference on Bioinformatics and Biomedicine*, 2016.

[20] Rajaraman, S., et al., "Pre-trained convolutional neural networks as feature extractors toward improved malaria parasite detection," *PeerJ*, vol. 6, e4568, 2018.

[21] Fuhad, K.M., et al., "Deep learning based automatic malaria parasite detection from blood smear and its smartphone based application," *Diagnostics*, vol. 10, no. 5, p. 329, 2020.

[22] Kassim, Y.M., et al., "Clustering-based dual deep learning architecture for detecting red blood cells in malaria diagnostic smears," *IEEE Journal of Biomedical and Health Informatics*, vol. 25, no. 5, pp. 1735-1746, 2020.

[23] Masud, M., et al., "Lightweight ResNet model for automatic malaria parasite detection," *Neural Computing and Applications*, vol. 34, pp. 6751-6762, 2022.

[24] Torres, K., et al., "Automated microscopy for routine malaria diagnosis: a field comparison on Giemsa-stained blood films," *Malaria Journal*, vol. 17, no. 1, pp. 1-12, 2018.

[25] Hung, J., et al., "Applying Faster R-CNN for object detection on malaria images," in *IEEE Conference on Computer Vision and Pattern Recognition Workshops*, 2017.

[26] Yang, F., et al., "A smartphone-based automatic malaria blood smear image analysis," *Journal of Biomedical Optics*, vol. 22, no. 6, 066010, 2017.

[27] Abdurahman, F., et al., "Malaria parasite detection using deep learning methods," in *International Conference on Information and Communication Technology for Development for Africa*, 2019.

[28] Hemachandran, K., et al., "Performance analysis of deep learning algorithms in diagnosis of malaria disease," *Diagnostics*, vol. 13, no. 3, p. 534, 2023.

[29] Sultani, W., et al., "Towards robust malaria parasite detection from diverse blood smear images using object detection models," in *IEEE International Conference on Image Processing*, 2023.

[30] Vijayalakshmi, A. and Kanna, B.R., "Deep learning approach to detect malaria from microscopic images," *Multimedia Tools and Applications*, vol. 79, pp. 15297-15317, 2020.

[31] Das, D.K., et al., "Machine learning approach for automated screening of malaria parasite using light microscopic images," *Micron*, vol. 45, pp. 97-106, 2013.

[32] Redmon, J., et al., "You Only Look Once: Unified, real-time object detection," in *IEEE Conference on Computer Vision and Pattern Recognition*, 2016.

[33] Bochkovskiy, A., et al., "YOLOv4: Optimal speed and accuracy of object detection," arXiv preprint arXiv:2004.10934, 2020.

[34] Jocher, G., et al., "YOLOv5," GitHub repository, 2020.

[35] Jocher, G., et al., "YOLOv8 by Ultralytics," GitHub repository, 2023.

[36] Malik, H., et al., "YOLO based object detection for tumor detection in histopathology images," in *IEEE International Conference on Engineering Technologies and Applied Sciences*, 2023.

[37] Jiang, H., et al., "A review of YOLO algorithm developments," *Procedia Computer Science*, vol. 199, pp. 1066-1073, 2022.

[38] Maron, R.C., et al., "Skin lesion classification with YOLO architecture," *British Journal of Dermatology*, vol. 180, no. 4, pp. 934-935, 2019.

[39] Vaishnavi, D., et al., "Medical image analysis using deep learning: a review," in *IEEE International Conference on Electronics, Computing and Communication Technologies*, 2021.

[40] Ahmed, W.S., et al., "Automatic bacteria detection using deep learning," in *International Conference on Communication, Computing, and Electronics Systems*, 2021.

[41] Patil, A., et al., "Blood cell counting using YOLO and image processing," in *International Conference on Intelligent Computing and Control Systems*, 2020.

[42] Kudisthalert, W., et al., "Automatic malaria detection using YOLOv3 on thick blood smear images," in *International Conference on Digital Arts, Media and Technology*, 2021.

[43] Zurovac, D., et al., "The effect of mobile phone text-message reminders on Kenyan health workers' adherence to malaria treatment guidelines," *The Lancet*, vol. 378, no. 9793, pp. 795-803, 2011.

[44] Githinji, S., et al., "Aggregating electronic health data for malaria surveillance," *Malaria Journal*, vol. 16, no. 1, pp. 1-9, 2017.

[45] Lester, R.T., et al., "Mobile phone short message service for antiretroviral treatment adherence in Kenya," *The Lancet*, vol. 376, no. 9755, pp. 1838-1845, 2010.

[46] Thondoo, M., et al., "Mobile health interventions for malaria: a systematic review," *mHealth*, vol. 7, p. 8, 2021.

[47] Breslauer, D.N., et al., "Mobile phone based clinical microscopy for global health applications," *PLoS ONE*, vol. 4, no. 7, e6320, 2009.

[48] Motic Medical, "EasyScan Digital Microscopy Solution," Technical Documentation, 2022.

[49] Quinn, J.A., et al., "Automated blood smear analysis for mobile malaria diagnosis," in *Mobile Computing, Applications, and Services*, Springer, 2011.

[50] Tek, F.B., et al., "Computer vision for microscopy diagnosis of malaria," *Malaria Journal*, vol. 8, no. 1, pp. 1-14, 2009.

---

*Document prepared for AIME 2026 submission*
*Last updated: [DATE]*
