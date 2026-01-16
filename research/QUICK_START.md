# Quick Start Guide for AIME 2026 Paper

This guide will help you go from your current state (code + external results) to a complete AIME 2026 submission.

---

## Current Status ✅

✅ **You have**:
- Working malaria detection system (YOLOv12 + mobile app)
- Trained model recovered: [server/best.pt](../server/best.pt) (6.2 MB)
- Training and evaluation results (stored externally)
- Architecture details documented

✅ **I've set up for you**:
- Research directory structure in `research/`
- Evaluation scripts and templates
- AIME-specific requirements documentation
- Paper writing checklist
- Import instructions for your external results

---

## Next Steps (Action Plan)

### Phase 1: Import & Organize (Days 1-3)

#### Step 1.1: Import Your External Results
1. Download all training/evaluation results from Drive/cloud
2. Follow instructions in [research/results/IMPORT_INSTRUCTIONS.md](results/IMPORT_INSTRUCTIONS.md)
3. Organize into:
   - `research/results/training/` - Training logs, curves, checkpoints
   - `research/results/evaluation/` - Test metrics, confusion matrix, predictions
   - `research/datasets/` - Dataset info, splits, statistics

#### Step 1.2: Document Training
Create `research/results/training/TRAINING.md` with:
- Dataset source and size
- Model architecture details
- All hyperparameters
- Training procedure
- Hardware used
- Final results summary

**Template provided in**: [research/results/IMPORT_INSTRUCTIONS.md](results/IMPORT_INSTRUCTIONS.md) (search for "Template: Training Documentation")

#### Step 1.3: Verify Model
```bash
cd research/experiments/evaluation
python3 -c "from malaria_detector import MalariaDetector; m = MalariaDetector('../../../server/best.pt'); print('Model loaded successfully!')"
```

---

### Phase 2: Comprehensive Evaluation (Days 4-7)

#### Step 2.1: Prepare Test Set
Organize your test set:
```
research/datasets/test/
├── images/           # Test images
├── annotations.json  # Ground truth (bounding boxes + classes)
└── image_list.txt    # List of test image filenames
```

**Ground truth format** (JSON):
```json
{
  "image1.jpg": {
    "parasites": [
      {"type": "PF", "bbox": [x1, y1, x2, y2]},
      {"type": "PM", "bbox": [x1, y1, x2, y2]}
    ],
    "wbcs": [
      {"bbox": [x1, y1, x2, y2]}
    ]
  }
}
```

#### Step 2.2: Run Comprehensive Evaluation
```bash
cd research/experiments/evaluation
python comprehensive_evaluation.py ../../datasets/test/images/ ../../datasets/test/annotations.json
```

This generates:
- Test metrics (Precision, Recall, F1, mAP)
- Per-class performance
- Confusion matrix
- LaTeX tables for paper

---

### Phase 3: Baseline Comparisons (Days 8-12)

You need to compare with at least 2-3 baseline methods for AIME.

#### Option A: Compare with Other YOLO Versions

**YOLOv8** (recommended first):
```bash
# Install YOLOv8
pip install ultralytics==8.0.196

# Train YOLOv8 on your dataset
from ultralytics import YOLO
model = YOLO('yolov8n.pt')
results = model.train(data='your_data.yaml', epochs=100, imgsz=640)

# Evaluate
model.val()
```

**YOLOv5** (if needed):
```bash
# Clone YOLOv5
git clone https://github.com/ultralytics/yolov5
cd yolov5
pip install -r requirements.txt

# Train
python train.py --data ../your_data.yaml --weights yolov5n.pt --epochs 100
```

Store baseline results in:
```
research/baselines/
├── yolov5/
│   ├── results.json
│   └── confusion_matrix.png
├── yolov8/
│   ├── results.json
│   └── confusion_matrix.png
```

#### Option B: Reproduce Published Method

Find a recent malaria detection paper with available code:
1. Search GitHub for "malaria detection yolo" or similar
2. Clone and run on your test set
3. Document results

---

### Phase 4: Ablation Studies (Days 13-15)

Run experiments to show what contributes to performance:

#### Ablation 1: Confidence Threshold
```python
# Test different thresholds
for threshold in [0.1, 0.26, 0.5, 0.7]:
    results = detector.detectAndQuantify(image, confidence_threshold=threshold)
    # Save results
```

#### Ablation 2: Data Augmentation
Re-train model:
- With augmentation (your current model)
- Without augmentation
- Compare performance

#### Ablation 3: Pre-training (if applicable)
Compare:
- Model trained from scratch
- Model pre-trained on ImageNet
- Model pre-trained on medical images (if you used this)

Save ablation results in `research/results/ablations/`

---

### Phase 5: Generate Figures (Days 16-18)

Create publication-quality figures in `research/figures/`:

#### Figure 1: System Overview
Create a diagram showing:
- Mobile app → Capture image
- Upload to server
- YOLOv12 detection
- Results displayed

**Tools**: PowerPoint, draw.io, Adobe Illustrator, or Python (matplotlib)

#### Figure 2: Model Architecture
Show YOLOv12 architecture:
- Input image (640x640)
- Backbone (feature extraction)
- Neck (feature fusion)
- Head (detection + classification)
- Output (bounding boxes + classes)

#### Figure 3: Qualitative Results
Grid of detection examples:
- 2-3 success cases (correct detections)
- 1-2 failure cases (missed or wrong)
- Show different parasite species
- Overlay bounding boxes with labels

```python
# Use your existing test_malaria_detection.py
# Or create custom visualization script
```

#### Figure 4: Confusion Matrix
```python
import seaborn as sns
import matplotlib.pyplot as plt

# Load your confusion matrix
cm = ...  # from evaluation results

plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=['PF', 'PM', 'PO', 'PV', 'WBC'],
            yticklabels=['PF', 'PM', 'PO', 'PV', 'WBC'])
plt.ylabel('True Label')
plt.xlabel('Predicted Label')
plt.title('Confusion Matrix on Test Set')
plt.tight_layout()
plt.savefig('research/figures/results/confusion_matrix.pdf', dpi=300)
```

#### Figure 5: Baseline Comparison
Bar chart comparing methods:
```python
methods = ['YOLOv5', 'YOLOv8', 'Ours (YOLOv12)']
precision = [0.XX, 0.XX, 0.XX]
recall = [0.XX, 0.XX, 0.XX]
f1 = [0.XX, 0.XX, 0.XX]

# Create grouped bar chart
```

---

### Phase 6: Write Paper (Days 19-35)

Follow the structure in [research/experiments/AIME_REQUIREMENTS.md](experiments/AIME_REQUIREMENTS.md)

#### LaTeX Setup
1. Download Springer LNAI template: https://www.springer.com/gp/computer-science/lncs
2. Or use Overleaf template: Search "Springer LNCS"
3. Create `research/paper/main.tex`

#### Writing Schedule
- **Days 19-21**: Introduction + Related Work
- **Days 22-25**: Methods section
- **Days 26-28**: Experiments & Results
- **Days 29-31**: Discussion + Conclusion
- **Days 32-33**: Abstract + polish
- **Days 34-35**: Internal review + revisions

#### Use the Checklist
Work through [research/paper/PAPER_CHECKLIST.md](paper/PAPER_CHECKLIST.md) as you write.

---

### Phase 7: Final Review (Days 36-38)

- **Day 36**: Complete first draft, send to advisor/colleagues
- **Day 37**: Address feedback, revise
- **Day 38**: Final proofread, verify anonymization

---

### Phase 8: Submit (Day 39-40)

- **Day 39**: Generate final PDF, verify format
- **Day 40**: Submit to AIME portal (don't wait until last minute!)

---

## Key Files Reference

| File | Purpose |
|------|---------|
| [research/README.md](README.md) | Overview of research directory |
| [research/results/IMPORT_INSTRUCTIONS.md](results/IMPORT_INSTRUCTIONS.md) | How to import your external results |
| [research/experiments/AIME_REQUIREMENTS.md](experiments/AIME_REQUIREMENTS.md) | Detailed AIME submission requirements |
| [research/paper/PAPER_CHECKLIST.md](paper/PAPER_CHECKLIST.md) | Complete submission checklist |
| [research/experiments/evaluation/comprehensive_evaluation.py](experiments/evaluation/comprehensive_evaluation.py) | Evaluation script |

---

## Common Questions

### Q: What if I don't have ground truth annotations?
**A**: You'll need to create them. Options:
1. Manually annotate test set using LabelImg or CVAT
2. Have expert pathologist annotate
3. Use existing annotations if dataset is public

### Q: How do I know if my results are good enough for AIME?
**A**: Competitive baselines for malaria detection:
- **Precision/Recall**: > 0.85 is good, > 0.90 is strong
- **mAP@0.5**: > 0.80 is acceptable, > 0.85 is competitive
- **Clinical Sensitivity**: > 0.90 for malaria detection

Compare with recent papers in related work section.

### Q: What if I can't implement all baselines?
**A**: Minimum for AIME:
- At least 1 baseline (YOLOv8 recommended - easy to run)
- Comparison with published method if code available
- Focus on thorough evaluation of your method

### Q: Do I need a user study?
**A**: Not mandatory, but **highly valuable** for AIME:
- Makes paper stronger for healthcare-focused venue
- Can be small scale (5-10 healthcare workers)
- Measures usability and real-world feasibility

---

## Emergency Shortcuts (If Time is Limited)

If you're running short on time, prioritize:

### Must Have (Can't submit without)
1. ✅ Comprehensive evaluation on test set
2. ✅ At least 1 baseline comparison (YOLOv8)
3. ✅ All figures (3-5 minimum)
4. ✅ All tables (2-3 minimum)
5. ✅ Complete written paper

### Should Have (Strengthens paper)
6. ⭐ Multiple baselines (YOLOv5, YOLOv8, published method)
7. ⭐ Ablation studies (2-3 experiments)
8. ⭐ Statistical significance tests
9. ⭐ Failure case analysis

### Nice to Have (Bonus points)
10. 💎 Clinical validation with expert pathologist
11. 💎 User study
12. 💎 GradCAM visualizations
13. 💎 Inference speed benchmarks

---

## Getting Help

When stuck:
1. Check the detailed guides in `research/experiments/AIME_REQUIREMENTS.md`
2. Review checklist in `research/paper/PAPER_CHECKLIST.md`
3. Look at recent AIME papers for examples: https://link.springer.com/conference/aime
4. Ask me for help with specific tasks!

---

## Timeline Summary

| Week | Tasks |
|------|-------|
| 1 | Import results, document training, organize datasets |
| 2 | Run comprehensive evaluation, verify metrics |
| 3-4 | Baseline comparisons, ablation studies |
| 5 | Generate all figures and tables |
| 6-7 | Write paper draft |
| 8 | Internal review and revisions |
| 9 | Final polish and submission |

**Total**: ~9 weeks to submission

---

## You've Got This! 💪

Remember:
- **Quality > Speed**: Rigorous experiments beat rushed work
- **Be Honest**: Acknowledge limitations, don't oversell
- **Clinical Focus**: AIME values real-world impact
- **Iterative**: Get feedback early and often

Good luck with AIME 2026! 🚀
