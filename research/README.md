# Research Materials for AIME 2026 Submission

**Conference**: [AIME 2026 - Artificial Intelligence in Medicine Europe](https://aime26.aimedicine.info/call-for-papers/)
**Deadline**: Check conference website for exact date
**Paper Type**: Full paper (typically 10-12 pages Springer LNAI format)

---

## Directory Structure

```
research/
├── paper/              # LaTeX source, bibliography, writing
├── results/           # Training & evaluation results from external storage
│   ├── training/      # Training logs, loss curves, checkpoints
│   ├── evaluation/    # Test set metrics, confusion matrices
│   └── raw_data/      # Raw experimental data
├── figures/           # Publication-quality figures and plots
│   ├── architecture/  # Model architecture diagrams
│   ├── results/       # Performance charts, ROC curves
│   └── qualitative/   # Detection visualizations, examples
├── datasets/          # Dataset documentation and splits
│   ├── train/         # Training set info
│   ├── val/           # Validation set info
│   ├── test/          # Test set info
│   └── statistics/    # Dataset statistics and analysis
├── experiments/       # Experiment scripts and notebooks
│   ├── evaluation/    # Evaluation scripts
│   ├── baselines/     # Baseline comparison code
│   └── ablations/     # Ablation study experiments
└── baselines/         # Comparison with other methods
    ├── yolov5/        # YOLOv5 comparison
    ├── yolov8/        # YOLOv8 comparison
    └── published/     # Reproduced published methods
```

---

## AIME 2026 Requirements

### Paper Format
- **Length**: 10-12 pages (Springer LNAI format)
- **Sections**: Abstract, Introduction, Related Work, Methods, Experiments, Results, Discussion, Conclusion
- **Supplementary**: Optional supplementary materials allowed

### Key Expectations for AIME
1. **Clinical Relevance**: Clear medical impact and clinical validation
2. **Rigorous Evaluation**: Comprehensive metrics on medical datasets
3. **Comparison**: State-of-the-art baseline comparisons
4. **Statistical Analysis**: Confidence intervals, significance tests
5. **Reproducibility**: Code and model availability
6. **Real-world Validation**: Testing on clinical data (highly preferred)

---

## Checklist for Submission

### Methods Section
- [ ] Architecture details (YOLOv12 modifications if any)
- [ ] Training procedure and hyperparameters
- [ ] Dataset description and preprocessing
- [ ] Data augmentation strategy
- [ ] Loss function and optimization details

### Experimental Validation
- [ ] Test set evaluation metrics (Precision, Recall, F1, mAP)
- [ ] Per-class performance (PF, PM, PO, PV, WBC)
- [ ] Clinical metrics (Sensitivity, Specificity, PPV, NPV)
- [ ] ROC curves and AUC scores
- [ ] Confusion matrices
- [ ] Confidence intervals and error bars

### Comparison Studies
- [ ] Baseline comparison (at least 3 methods)
- [ ] YOLOv5/v8/v11 comparison
- [ ] Published method comparison (cite recent papers)
- [ ] Statistical significance tests (t-test, Wilcoxon)
- [ ] Inference speed comparison

### Ablation Studies
- [ ] Effect of confidence threshold
- [ ] Impact of data augmentation
- [ ] Pre-training vs from-scratch
- [ ] Different backbone architectures

### Clinical Validation
- [ ] Expert pathologist annotation (gold standard)
- [ ] Inter-rater agreement (Cohen's kappa)
- [ ] Real clinical samples testing
- [ ] Comparison with microscopy diagnosis

### System Validation (Optional but strong for AIME)
- [ ] Mobile app usability study
- [ ] Technician user study (SUS score)
- [ ] Deployment feasibility analysis
- [ ] Cost-effectiveness analysis

### Reproducibility
- [ ] Code repository (GitHub)
- [ ] Model weights availability
- [ ] Dataset split information
- [ ] Requirements and dependencies
- [ ] Training instructions

---

## Timeline Recommendation

1. **Week 1-2**: Organize external results, create evaluation scripts
2. **Week 3-4**: Run baseline comparisons and ablations
3. **Week 5**: Generate all figures and tables
4. **Week 6-7**: Write paper draft
5. **Week 8**: Internal review and revisions
6. **Week 9**: Final polishing and submission

---

## Next Steps

1. **Import your external results** to `research/results/`
2. **Document your training setup** in `research/results/training/TRAINING.md`
3. **Run comprehensive evaluation** using scripts in `research/experiments/`
4. **Create publication figures** and save to `research/figures/`
5. **Write the paper** in `research/paper/`

---

## Notes

- AIME emphasizes **clinical impact** - make sure to highlight real-world applicability
- Focus on **diagnostic accuracy** and how your system helps healthcare workers
- Include **failure analysis** - AIME reviewers appreciate honest limitation discussion
- Consider **ethical implications** - data privacy, diagnostic responsibility, etc.
