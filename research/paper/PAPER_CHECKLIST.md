# AIME 2026 Paper Submission Checklist

Use this checklist to ensure your paper is complete and ready for submission.

---

## Pre-Submission Checklist

### Content Completeness

#### Abstract ✅
- [ ] Clearly states the clinical problem
- [ ] Describes your solution approach
- [ ] Includes key quantitative results
- [ ] Mentions clinical significance
- [ ] Within 200-250 words
- [ ] Self-contained (readable without rest of paper)

#### Introduction ✅
- [ ] Motivates the problem with statistics (malaria burden)
- [ ] Explains current diagnostic limitations
- [ ] States research gap clearly
- [ ] Lists 3-5 specific contributions
- [ ] Roadmap paragraph at end
- [ ] No results or methods details (save for later sections)

#### Related Work ✅
- [ ] Covers traditional malaria diagnosis methods
- [ ] Reviews deep learning for malaria (2020-2025 papers)
- [ ] Discusses object detection in medical imaging
- [ ] Mentions mobile health systems
- [ ] Clearly identifies gap your work fills
- [ ] 30-50 relevant citations
- [ ] Critical analysis, not just listing papers
- [ ] Comparison table summarizing related methods (optional)

#### Methods ✅
- [ ] **Dataset**:
  - [ ] Source and collection process described
  - [ ] Total size and per-class distribution
  - [ ] Annotation protocol (who, how, inter-rater agreement)
  - [ ] Train/val/test split clearly specified
  - [ ] Preprocessing steps listed
  - [ ] Ethics approval mentioned (if applicable)

- [ ] **Model Architecture**:
  - [ ] YOLOv12 architecture explained
  - [ ] Any modifications clearly stated
  - [ ] Input size and output format
  - [ ] Architecture diagram included (Figure)

- [ ] **Training**:
  - [ ] All hyperparameters listed (learning rate, batch size, epochs)
  - [ ] Optimizer specified (SGD, Adam, etc.)
  - [ ] Data augmentation techniques enumerated
  - [ ] Loss function described
  - [ ] Hardware specs (GPU, training time)
  - [ ] Model selection criterion (validation metric)

- [ ] **Mobile System** (if included):
  - [ ] Architecture overview
  - [ ] User workflow
  - [ ] Technical implementation details

- [ ] **Evaluation Metrics**:
  - [ ] All metrics defined (Precision, Recall, F1, mAP, etc.)
  - [ ] Clinical metrics explained (Sensitivity, Specificity)
  - [ ] Statistical analysis methods described

#### Experiments & Results ✅
- [ ] **Experimental Setup**:
  - [ ] Test set size and composition
  - [ ] Evaluation protocol
  - [ ] Implementation details
  - [ ] Baseline methods described

- [ ] **Quantitative Results**:
  - [ ] Overall performance table with all metrics
  - [ ] Per-class performance breakdown
  - [ ] Confidence intervals or error bars
  - [ ] Statistical significance tests
  - [ ] Comparison table with baselines
  - [ ] Confusion matrix

- [ ] **Qualitative Results**:
  - [ ] Detection examples (success cases)
  - [ ] Failure case analysis
  - [ ] Visualization of detections

- [ ] **Ablation Studies**:
  - [ ] At least 2-3 ablations conducted
  - [ ] Clear methodology for each ablation
  - [ ] Results show contribution of each component

- [ ] **Clinical Validation** (strongly recommended):
  - [ ] Expert pathologist comparison
  - [ ] Real clinical samples tested
  - [ ] Diagnostic concordance analysis

#### Discussion ✅
- [ ] Interprets main results
- [ ] Explains clinical significance
- [ ] Compares with state-of-the-art honestly
- [ ] **Limitations** clearly stated:
  - [ ] Dataset limitations
  - [ ] Model limitations
  - [ ] Deployment challenges
- [ ] Ethical considerations addressed
- [ ] Future work directions
- [ ] No new results introduced

#### Conclusion ✅
- [ ] Summarizes main contributions (3-5 points)
- [ ] Restates clinical impact
- [ ] Mentions code/model availability
- [ ] No new information (only summary)
- [ ] 0.5 page maximum

#### References ✅
- [ ] 30-50 references (appropriate for 10-page paper)
- [ ] Recent papers (majority from 2020-2025)
- [ ] Diverse sources (conferences, journals, preprints)
- [ ] Properly formatted (Springer style)
- [ ] All citations have corresponding references
- [ ] All references are cited in text

---

### Figures & Tables

#### Figures (4-6 recommended)
- [ ] **Figure 1**: System overview/workflow
  - [ ] High-quality diagram
  - [ ] Clear labels
  - [ ] Self-explanatory caption

- [ ] **Figure 2**: Model architecture
  - [ ] Professional diagram
  - [ ] Shows key components
  - [ ] Input/output illustrated

- [ ] **Figure 3**: Qualitative results
  - [ ] Multiple example images
  - [ ] Bounding boxes visible
  - [ ] Different parasite species shown
  - [ ] Success and failure cases

- [ ] **Figure 4**: Performance visualization
  - [ ] Confusion matrix OR ROC curves
  - [ ] Clear axes and labels
  - [ ] Legend included

- [ ] **Figure 5**: Comparison plot
  - [ ] Bar chart or line plot
  - [ ] Your method vs baselines
  - [ ] Error bars if applicable

- [ ] All figures:
  - [ ] 300 DPI minimum resolution
  - [ ] Readable font sizes (8-10pt minimum)
  - [ ] Colorblind-friendly palette
  - [ ] Referenced in text before appearance
  - [ ] Captions are detailed and self-contained
  - [ ] Vector format for plots (PDF/SVG preferred)

#### Tables (3-4 recommended)
- [ ] **Table 1**: Dataset statistics
- [ ] **Table 2**: Overall performance metrics
- [ ] **Table 3**: Per-class results
- [ ] **Table 4**: Baseline comparison
- [ ] All tables:
  - [ ] Clear column headers
  - [ ] Units specified
  - [ ] Best results highlighted (bold)
  - [ ] Statistical significance indicated
  - [ ] Referenced in text before appearance
  - [ ] Captions above table (Springer style)

---

### Formatting & Style

#### Springer LNAI Format
- [ ] Correct LaTeX template used
- [ ] 10-12 pages (including references)
- [ ] Times or similar serif font
- [ ] Single column format
- [ ] Proper section numbering
- [ ] Figures and tables properly placed

#### Double-Blind Review
- [ ] **No author names** in paper
- [ ] **No affiliations**
- [ ] **No acknowledgments**
- [ ] Self-citations written in third person ("Smith et al. [X] proposed...")
- [ ] No identifying information in:
  - [ ] Headers/footers
  - [ ] File metadata
  - [ ] URLs or links
  - [ ] Code repositories mentioned (remove or anonymize)

#### Writing Quality
- [ ] Clear, concise scientific writing
- [ ] No grammatical errors (run through Grammarly/similar)
- [ ] No spelling mistakes (US or UK English consistently)
- [ ] No overly casual language
- [ ] Technical terms defined on first use
- [ ] Abbreviations defined (PF, PM, etc.)
- [ ] Past tense for your work ("We trained...", "We evaluated...")
- [ ] Present tense for general facts ("Malaria is...")
- [ ] Consistent terminology throughout
- [ ] No ambiguous pronouns ("it", "this", "that" without clear referent)

#### Mathematical Notation
- [ ] All equations numbered
- [ ] Symbols defined
- [ ] Consistent notation
- [ ] Proper math mode in LaTeX

---

### Technical Validation

#### Reproducibility
- [ ] All hyperparameters documented
- [ ] Dataset splits specified
- [ ] Random seeds mentioned
- [ ] Software versions listed (Python, PyTorch, etc.)
- [ ] Hardware specifications provided
- [ ] Training time reported
- [ ] Code availability statement (can be anonymous GitHub for review)

#### Statistical Rigor
- [ ] Confidence intervals computed
- [ ] Statistical significance tests performed
- [ ] Multiple runs conducted (report mean ± std)
- [ ] Appropriate statistical methods used
- [ ] No cherry-picking results

#### Baseline Comparisons
- [ ] At least 2-3 baseline methods
- [ ] Fair comparison (same dataset, same evaluation protocol)
- [ ] Baseline implementations described
- [ ] Hyperparameters for baselines documented
- [ ] Statistical comparison (not just absolute numbers)

---

### Ethical & Clinical Considerations

#### Ethics
- [ ] Data privacy addressed
- [ ] IRB approval obtained (if using patient data)
- [ ] Patient consent discussed
- [ ] Data anonymization explained
- [ ] Potential biases acknowledged

#### Clinical Relevance
- [ ] Clinical problem clearly motivated
- [ ] Clinical metrics included (not just ML metrics)
- [ ] Real-world applicability discussed
- [ ] Limitations for clinical use stated
- [ ] Model positioned as decision support (not replacement)

---

### Submission Preparation

#### Files to Prepare
- [ ] Main paper PDF (anonymized)
- [ ] Supplementary materials (if any)
- [ ] LaTeX source files (some conferences require)
- [ ] Conflict of interest statement
- [ ] Copyright form (if required)

#### Pre-Submission Checks
- [ ] PDF renders correctly (no missing fonts, figures)
- [ ] All links work (if any)
- [ ] Page limit satisfied (10-12 pages)
- [ ] File size within limits (usually <10MB)
- [ ] Submitted to correct track/topic area

#### Post-Submission
- [ ] Confirmation email received
- [ ] Paper ID noted
- [ ] Calendar reminder for camera-ready deadline
- [ ] Prepare rebuttal strategy (for reviewer responses)

---

## Review Criteria (What Reviewers Look For)

### Novelty & Significance (30%)
- [ ] Clear novel contribution
- [ ] Significant advance over state-of-the-art
- [ ] Clinical/practical impact

### Technical Quality (30%)
- [ ] Sound methodology
- [ ] Rigorous evaluation
- [ ] Appropriate baselines
- [ ] Statistical analysis

### Clarity & Presentation (20%)
- [ ] Well-written and organized
- [ ] Clear figures and tables
- [ ] Reproducible

### Clinical Relevance (20% - important for AIME)
- [ ] Addresses real clinical need
- [ ] Validated on clinical data
- [ ] Practical deployment considerations

---

## Common Mistakes to Avoid

❌ **Don't**:
- Over-claim ("best ever", "revolutionary")
- Hide limitations
- Compare only to weak baselines
- Use test set for any decisions (model selection, hyperparameter tuning)
- Introduce new concepts in conclusion
- Include author-identifying information (double-blind!)
- Submit without proofreading
- Ignore ethical considerations
- Use low-quality screenshots for figures
- Exceed page limit

✅ **Do**:
- Be honest about limitations
- Use strong, recent baselines
- Separate train/val/test clearly
- Keep conclusion as summary only
- Thoroughly anonymize
- Have colleagues review
- Address ethics explicitly
- Create publication-quality figures
- Stay within page limit
- Highlight clinical impact

---

## Final Check (Day Before Submission)

- [ ] Read entire paper aloud (catches awkward phrasing)
- [ ] Verify all figures/tables referenced in text
- [ ] Check all citations have references
- [ ] Spell-check one more time
- [ ] Verify anonymization (CTRL+F for "we", "our", author names)
- [ ] Generate PDF and check visually
- [ ] Have someone else read abstract and introduction
- [ ] Backup all files
- [ ] Submit 1-2 hours before deadline (not last minute!)

---

## After Submission

### If Accepted ✅
- [ ] Prepare camera-ready version
- [ ] De-anonymize (add authors, affiliations)
- [ ] Add acknowledgments
- [ ] Address reviewer comments
- [ ] Proofread again
- [ ] Submit final version
- [ ] Register for conference
- [ ] Prepare presentation

### If Rejected ❌
- [ ] Read reviews carefully
- [ ] Don't take it personally (50-70% rejection rate is normal)
- [ ] Identify weaknesses to address
- [ ] Improve paper based on feedback
- [ ] Submit to another venue
- [ ] Learn and iterate

---

## Useful Resources

- **LaTeX Template**: [Springer LNCS/LNAI](https://www.springer.com/gp/computer-science/lncs/conference-proceedings-guidelines)
- **Overleaf Template**: Search "Springer LNCS" on Overleaf
- **Writing Guide**: "How to Write a Good Scientific Paper" (Springer)
- **Grammar**: Grammarly, LanguageTool
- **Figures**: Inkscape (vector graphics), matplotlib (plots)
- **Citation Management**: Zotero, Mendeley, BibTeX

---

Good luck with your AIME 2026 submission! 🍀

**Remember**: Quality > Speed. Take time to do rigorous experiments and write clearly.
