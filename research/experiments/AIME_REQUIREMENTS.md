# AIME 2026 Specific Requirements

Based on [AIME 2026 Call for Papers](https://aime26.aimedicine.info/call-for-papers/), here's what you need for a strong submission.

---

## Conference Focus

AIME (Artificial Intelligence in Medicine Europe) emphasizes:
- **Clinical applicability** of AI methods
- **Validation** on real medical data
- **Interpretability** and explainability
- **Ethical considerations** in medical AI
- **Real-world deployment** potential

---

## Paper Requirements

### Format
- **Template**: Springer LNAI (Lecture Notes in Artificial Intelligence)
- **Page Limit**: 10-12 pages (including references)
- **Anonymization**: Double-blind review (remove author names, affiliations, acknowledgments)
- **Supplementary**: Optional supplementary materials allowed

### Mandatory Sections

#### 1. Introduction (1-2 pages)
- **Problem**: Malaria diagnosis challenges in resource-limited settings
- **Motivation**: Why automated detection matters clinically
- **Contributions**: List 3-5 clear contributions
  - Example: "First YOLOv12 application to multi-species malaria detection"
  - "Mobile-first system for point-of-care diagnosis"
  - "Comprehensive evaluation on X images from clinical settings"

#### 2. Related Work (1.5-2 pages)
Must cover:
- **Traditional malaria diagnosis**: Microscopy, RDTs, limitations
- **Deep learning for malaria**: Recent papers (2020-2025)
- **Object detection in medical imaging**: YOLO, R-CNN family applied to microscopy
- **Mobile health systems**: Deployment studies
- **Critical gap**: What existing work doesn't do that yours does

**Key papers to cite**:
- YOLOv5/v8 medical imaging applications
- Malaria detection papers from MICCAI, ISBI, IEEE TMI
- Mobile health interventions in malaria-endemic regions

#### 3. Methods (3-4 pages)

##### 3.1 Dataset
- **Source**: Where images come from (hospital, public dataset, both)
- **Size**: Total images, per-class distribution
- **Annotation**: Who labeled (expert pathologists), inter-rater agreement
- **Preprocessing**: Image normalization, resizing
- **Splits**: Train/val/test percentages, stratification strategy
- **Ethics**: IRB approval, patient consent (if applicable)

##### 3.2 Model Architecture
- **Base model**: YOLOv12 details
- **Modifications**: Any architecture changes you made
- **Input/output**: Image size, output format (bounding boxes + classes)
- **Backbone**: Feature extraction network
- **Detection head**: Configuration

##### 3.3 Training Procedure
- **Hyperparameters**: Learning rate, batch size, epochs, optimizer
- **Data augmentation**: All techniques used (critical for medical imaging)
- **Loss function**: Detection loss + classification loss
- **Hardware**: GPU specs, training time
- **Model selection**: Validation metric used (mAP@0.5)

##### 3.4 Mobile App System (if including system paper aspect)
- **Architecture**: React Native + Flask backend
- **Workflow**: Capture → Upload → Detect → Display
- **Offline capability**: Can it work without internet?
- **User interface**: Design for healthcare workers

#### 4. Experiments (2-3 pages)

##### 4.1 Experimental Setup
- **Test set**: Size, composition, independence from training
- **Metrics**:
  - Object detection: Precision, Recall, F1, mAP@0.5, mAP@0.5:0.95
  - Clinical: Sensitivity, Specificity, PPV, NPV, AUC-ROC
  - Per-class: Individual performance for PF, PM, PO, PV, WBC
- **Statistical analysis**: Confidence intervals, significance tests
- **Implementation**: Hardware, software versions

##### 4.2 Results - Quantitative
- **Overall performance**: Table with all metrics
- **Per-class performance**: Breakdown by parasite species
- **Confusion matrix**: Show classification errors
- **ROC curves**: For clinical diagnosis (positive/negative)
- **Comparison with baselines**: YOLOv5, YOLOv8, published methods

##### 4.3 Results - Qualitative
- **Success cases**: Examples of correct detections
- **Failure cases**: Where model fails and why
- **Visualization**: Bounding boxes on example images
- **GradCAM**: What regions model focuses on (optional but strong)

##### 4.4 Ablation Studies
- **Confidence threshold**: Effect of 0.1, 0.26, 0.5, 0.7
- **Data augmentation**: With vs without
- **Pre-training**: ImageNet vs medical dataset vs from scratch
- **Architecture**: Different backbones if tested

##### 4.5 Clinical Validation (HIGHLY RECOMMENDED for AIME)
- **Expert comparison**: Model vs pathologists
- **Inter-rater agreement**: Cohen's kappa between model and experts
- **Real clinical samples**: Not just benchmark datasets
- **Diagnostic concordance**: How often model agrees with gold standard

##### 4.6 System Evaluation (if including mobile app)
- **User study**: Healthcare workers using the app
- **Usability**: SUS (System Usability Scale) score
- **Time to diagnosis**: App vs traditional microscopy
- **Deployment feasibility**: In low-resource settings

#### 5. Discussion (1-2 pages)
- **Interpretation**: What results mean clinically
- **Comparison**: How you compare to state-of-the-art
- **Clinical impact**: Real-world benefits for malaria diagnosis
- **Limitations**:
  - Dataset limitations (size, diversity)
  - Model limitations (failure cases)
  - Deployment challenges
- **Future work**: Next steps for improvement

#### 6. Conclusion (0.5 page)
- Summarize contributions
- Restate clinical significance
- Mention availability of code/model

---

## Critical Success Factors for AIME

### 1. Clinical Validation ⭐⭐⭐ (MOST IMPORTANT)
AIME strongly prefers papers with real clinical validation:
- **Gold standard comparison**: Expert pathologist annotations
- **Clinical samples**: Real patient data (not just public benchmarks)
- **Diagnostic metrics**: Sensitivity/Specificity for malaria diagnosis
- **Clinical workflow**: How it fits into existing diagnostic process

**Action**: If possible, get expert pathologist to annotate your test set

### 2. Statistical Rigor
- **Confidence intervals**: Use bootstrapping or cross-validation
- **Significance testing**: t-tests, Wilcoxon for comparisons
- **Multiple runs**: Report mean ± std over multiple training runs
- **Bonferroni correction**: If multiple comparisons

**Action**: Re-run experiments 3-5 times with different seeds

### 3. Baseline Comparisons
Must compare against at least 2-3 methods:
- **Recent YOLO versions**: YOLOv5, YOLOv8
- **Published malaria detection**: Find 1-2 papers with code
- **Classical methods**: (Optional) Traditional computer vision

**Action**: Implement YOLOv5 and YOLOv8 on your dataset

### 4. Interpretability/Explainability
AIME values understanding *why* models work:
- **Attention visualization**: GradCAM, attention maps
- **Feature analysis**: What features distinguish species?
- **Error analysis**: Why does model fail on certain cases?

**Action**: Generate GradCAM visualizations for key examples

### 5. Ethical Considerations
Address:
- **Data privacy**: How patient data is protected
- **Bias**: Dataset representation of diverse populations
- **Clinical responsibility**: Model as decision support, not replacement
- **Transparency**: Explaining predictions to clinicians

**Action**: Add ethics subsection in Discussion

### 6. Reproducibility
AIME encourages reproducible research:
- **Code availability**: GitHub repository
- **Model weights**: Publicly available (or upon request)
- **Dataset description**: Detailed enough to recreate
- **Hyperparameters**: All settings documented

**Action**: Create clean GitHub repo, add to camera-ready version

---

## Figures for AIME Paper

### Required Figures (4-6 total)

1. **System Overview** (Figure 1)
   - Workflow: Image capture → Detection → Diagnosis
   - Mobile app + server architecture

2. **Model Architecture** (Figure 2)
   - YOLOv12 diagram showing backbone, neck, head
   - Input/output examples

3. **Qualitative Results** (Figure 3)
   - Grid of detection examples
   - Show different parasite species
   - Include success and failure cases

4. **Quantitative Results** (Figure 4)
   - Confusion matrix
   - Per-class precision/recall bar chart
   - OR ROC curves

5. **Comparison Plot** (Figure 5)
   - Bar chart comparing your method vs baselines
   - Metrics: Precision, Recall, F1, mAP

6. **Ablation Study** (Figure 6, optional)
   - Effect of confidence threshold
   - OR effect of data augmentation

### Figure Quality Standards
- **Resolution**: 300 DPI minimum
- **Format**: Vector (PDF, SVG) preferred for plots
- **Font size**: 8-10pt minimum (readable when printed)
- **Color**: Use colorblind-friendly palette
- **Captions**: Detailed, self-contained

---

## Tables for AIME Paper

### Required Tables (3-4 total)

1. **Dataset Statistics** (Table 1)
   - Train/val/test split sizes
   - Per-class image counts
   - Annotation details

2. **Overall Performance** (Table 2)
   - All metrics on test set
   - With confidence intervals

3. **Per-Class Results** (Table 3)
   - Precision, Recall, F1 for each class
   - PF, PM, PO, PV, WBC

4. **Comparison with Baselines** (Table 4)
   - Your method vs YOLOv5, YOLOv8, published methods
   - Statistical significance indicators

---

## Timeline for AIME 2026 Submission

Assuming 8-10 weeks to submission:

### Week 1-2: Results Organization
- [ ] Import all external results
- [ ] Document training procedure
- [ ] Organize dataset information
- [ ] Create evaluation scripts

### Week 3-4: Additional Experiments
- [ ] Run baseline comparisons (YOLOv5, YOLOv8)
- [ ] Conduct ablation studies
- [ ] Generate all metrics with confidence intervals
- [ ] Statistical significance testing

### Week 5: Figures & Tables
- [ ] Create all publication-quality figures
- [ ] Generate LaTeX tables
- [ ] Qualitative examples (best/worst cases)
- [ ] GradCAM visualizations (optional)

### Week 6-7: Writing
- [ ] Draft all sections
- [ ] Introduction & related work
- [ ] Methods section
- [ ] Results section
- [ ] Discussion & conclusion

### Week 8: Review & Revision
- [ ] Internal review (advisor, colleagues)
- [ ] Address feedback
- [ ] Polish writing
- [ ] Check formatting

### Week 9: Final Polish
- [ ] Proofread carefully
- [ ] Verify anonymization (double-blind)
- [ ] Check page limit
- [ ] Prepare supplementary materials

### Week 10: Submission
- [ ] Submit to AIME portal
- [ ] Upload camera-ready if accepted

---

## Supplementary Materials (Optional)

Can include:
- Additional experimental results
- More qualitative examples
- Detailed architecture diagrams
- Hyperparameter sensitivity analysis
- User study details
- Additional ablation studies

**Note**: Supplementary materials are **not reviewed** as rigorously, so put critical content in main paper.

---

## Common AIME Rejection Reasons

Avoid these pitfalls:

1. ❌ **Insufficient clinical validation** - Only tested on public benchmarks
2. ❌ **Weak baselines** - No comparison with recent methods
3. ❌ **Limited novelty** - Just applying existing method without innovation
4. ❌ **Small dataset** - Not enough data to be convincing
5. ❌ **No statistical analysis** - Single numbers without confidence intervals
6. ❌ **Unclear clinical impact** - Doesn't explain why it matters
7. ❌ **Poor writing** - Hard to understand, grammatical errors
8. ❌ **Missing ablations** - Unclear what contributes to performance

---

## Questions to Answer Before Submitting

- [ ] **Clinical relevance**: Why does this matter for malaria diagnosis?
- [ ] **Novel contribution**: What's new compared to existing work?
- [ ] **Validation**: Is evaluation rigorous and convincing?
- [ ] **Comparison**: How does it compare to state-of-the-art?
- [ ] **Reproducibility**: Can others reproduce your results?
- [ ] **Real-world**: Can this actually be deployed in clinics?
- [ ] **Limitations**: Are you honest about what doesn't work?
- [ ] **Ethics**: Have you addressed ethical considerations?

---

## Recommended Structure Outline

```
Abstract (200-250 words)
├── Problem: Malaria diagnosis challenges
├── Solution: YOLOv12-based mobile detection system
├── Methods: Dataset, training, evaluation
├── Results: X% precision, Y% recall, outperforms baselines
└── Impact: Enables point-of-care diagnosis

1. Introduction (1.5-2 pages)
├── 1.1 Background & Motivation
├── 1.2 Clinical Challenge
├── 1.3 Contributions (3-5 bullet points)
└── 1.4 Paper Organization

2. Related Work (1.5-2 pages)
├── 2.1 Traditional Malaria Diagnosis
├── 2.2 Deep Learning for Malaria
├── 2.3 Object Detection in Medical Imaging
├── 2.4 Mobile Health Systems
└── 2.5 Gap Analysis

3. Methods (3-4 pages)
├── 3.1 Dataset Collection & Annotation
├── 3.2 YOLOv12 Architecture
├── 3.3 Training Procedure
├── 3.4 Mobile Application System
└── 3.5 Evaluation Metrics

4. Experiments & Results (2.5-3 pages)
├── 4.1 Experimental Setup
├── 4.2 Overall Performance
├── 4.3 Per-Class Analysis
├── 4.4 Comparison with Baselines
├── 4.5 Ablation Studies
├── 4.6 Clinical Validation
├── 4.7 Qualitative Analysis
└── 4.8 System Evaluation (usability)

5. Discussion (1.5-2 pages)
├── 5.1 Interpretation of Results
├── 5.2 Clinical Implications
├── 5.3 Limitations
├── 5.4 Ethical Considerations
└── 5.5 Future Work

6. Conclusion (0.5 page)

References (1-2 pages, 30-50 references)

Appendix/Supplementary (optional)
```

---

## Next Steps

1. **Import your external results** to `research/results/`
2. **Run comprehensive evaluation** using the script I created
3. **Implement baseline comparisons** (YOLOv5, YOLOv8)
4. **Generate all figures and tables**
5. **Start writing** the paper

Let me know when you're ready, and I can help with any of these steps!
