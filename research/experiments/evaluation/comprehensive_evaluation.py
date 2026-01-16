#!/usr/bin/env python3
"""
Comprehensive Evaluation Script for AIME 2026 Paper
Generates all metrics, plots, and tables needed for publication
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../server'))

import json
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from collections import defaultdict
from sklearn.metrics import (
    precision_recall_fscore_support,
    confusion_matrix,
    roc_curve,
    auc,
    classification_report
)
import pandas as pd

from malaria_detector import MalariaDetector
from analysis import MalariaAnalyzer

# Set style for publication-quality plots
plt.style.use('seaborn-v0_8-paper')
sns.set_palette("husl")

class ComprehensiveEvaluator:
    """
    Comprehensive evaluation for malaria detection system
    Generates all metrics and visualizations for AIME paper
    """

    def __init__(self, model_path="best.pt", results_dir="../../results/evaluation"):
        self.detector = MalariaDetector(model_path)
        self.analyzer = MalariaAnalyzer()
        self.results_dir = Path(results_dir)
        self.results_dir.mkdir(parents=True, exist_ok=True)

        # Class names
        self.parasite_classes = ['PF', 'PM', 'PO', 'PV']
        self.all_classes = self.parasite_classes + ['WBC']

    def evaluate_test_set(self, test_images_dir, ground_truth_file, confidence_threshold=0.26):
        """
        Evaluate model on test set with ground truth annotations

        Args:
            test_images_dir: Directory containing test images
            ground_truth_file: JSON file with ground truth annotations
                Format: {
                    "image1.jpg": {
                        "parasites": [{"type": "PF", "bbox": [x1,y1,x2,y2]}, ...],
                        "wbcs": [{"bbox": [x1,y1,x2,y2]}, ...]
                    },
                    ...
                }
            confidence_threshold: Detection confidence threshold
        """
        print(f"📊 Starting Comprehensive Evaluation")
        print(f"=" * 80)

        # Load ground truth
        with open(ground_truth_file, 'r') as f:
            ground_truth = json.load(f)

        results = {
            'predictions': [],
            'ground_truth': [],
            'per_image': []
        }

        # Evaluate each image
        for image_name, gt_data in ground_truth.items():
            image_path = os.path.join(test_images_dir, image_name)

            if not os.path.exists(image_path):
                print(f"⚠️  Warning: {image_name} not found, skipping")
                continue

            print(f"Processing {image_name}...")

            # Get predictions
            pred_result, error = self.detector.detectAndQuantify(image_path, confidence_threshold)

            if error:
                print(f"❌ Error on {image_name}: {error}")
                continue

            # Store results
            results['per_image'].append({
                'image': image_name,
                'predictions': pred_result,
                'ground_truth': gt_data
            })

        # Calculate metrics
        metrics = self._calculate_all_metrics(results)

        # Save results
        self._save_results(metrics, results)

        # Generate visualizations
        self._generate_visualizations(metrics, results)

        print(f"\n✅ Evaluation Complete!")
        print(f"📁 Results saved to: {self.results_dir}")

        return metrics, results

    def _calculate_all_metrics(self, results):
        """Calculate all metrics needed for AIME paper"""

        metrics = {
            'detection': {},  # Object detection metrics
            'classification': {},  # Classification metrics per class
            'clinical': {},  # Clinical diagnostic metrics
            'overall': {}
        }

        # TODO: Implement metric calculations
        # This is a template - you'll need to implement based on your ground truth format

        # 1. Detection Metrics (mAP, precision, recall per IoU threshold)
        # 2. Per-class metrics (for PF, PM, PO, PV, WBC)
        # 3. Clinical metrics (sensitivity, specificity for malaria diagnosis)
        # 4. Confusion matrix

        print("⚠️  Note: Implement metric calculations based on your ground truth format")

        return metrics

    def _save_results(self, metrics, results):
        """Save all results to files"""

        # Save metrics as JSON
        metrics_file = self.results_dir / 'test_metrics.json'
        with open(metrics_file, 'w') as f:
            json.dump(metrics, f, indent=2)
        print(f"💾 Saved metrics to {metrics_file}")

        # Save per-image results
        per_image_file = self.results_dir / 'per_image_results.json'
        with open(per_image_file, 'w') as f:
            json.dump(results['per_image'], f, indent=2)
        print(f"💾 Saved per-image results to {per_image_file}")

    def _generate_visualizations(self, metrics, results):
        """Generate all publication-quality visualizations"""

        figures_dir = Path("../../figures/results")
        figures_dir.mkdir(parents=True, exist_ok=True)

        print(f"\n📈 Generating visualizations...")

        # 1. Confusion Matrix
        # self._plot_confusion_matrix(metrics, figures_dir)

        # 2. ROC Curves
        # self._plot_roc_curves(metrics, figures_dir)

        # 3. Precision-Recall Curves
        # self._plot_pr_curves(metrics, figures_dir)

        # 4. Per-class Performance Bar Chart
        # self._plot_per_class_performance(metrics, figures_dir)

        # 5. Detection Examples (Best and Worst)
        # self._plot_detection_examples(results, figures_dir)

        print(f"📁 Figures saved to {figures_dir}")

    def generate_paper_tables(self, metrics):
        """Generate LaTeX tables for the paper"""

        tables_dir = Path("../../paper/tables")
        tables_dir.mkdir(parents=True, exist_ok=True)

        # Table 1: Overall Performance Metrics
        table1 = self._create_performance_table(metrics)

        # Table 2: Per-Class Results
        table2 = self._create_per_class_table(metrics)

        # Table 3: Comparison with Baselines (placeholder)
        table3 = self._create_comparison_table(metrics)

        # Save tables
        with open(tables_dir / 'table1_performance.tex', 'w') as f:
            f.write(table1)

        with open(tables_dir / 'table2_per_class.tex', 'w') as f:
            f.write(table2)

        with open(tables_dir / 'table3_comparison.tex', 'w') as f:
            f.write(table3)

        print(f"📊 LaTeX tables saved to {tables_dir}")

    def _create_performance_table(self, metrics):
        """Create LaTeX table for overall performance"""

        table = r"""
\begin{table}[htbp]
\centering
\caption{Overall Performance Metrics on Test Set}
\label{tab:overall_performance}
\begin{tabular}{lc}
\toprule
\textbf{Metric} & \textbf{Value} \\
\midrule
Precision & 0.XX $\pm$ 0.XX \\
Recall & 0.XX $\pm$ 0.XX \\
F1-Score & 0.XX $\pm$ 0.XX \\
mAP@0.5 & 0.XX \\
mAP@0.5:0.95 & 0.XX \\
Sensitivity & 0.XX \\
Specificity & 0.XX \\
AUC-ROC & 0.XX \\
\bottomrule
\end{tabular}
\end{table}
"""
        return table

    def _create_per_class_table(self, metrics):
        """Create LaTeX table for per-class results"""

        table = r"""
\begin{table}[htbp]
\centering
\caption{Per-Class Detection Performance}
\label{tab:per_class}
\begin{tabular}{lccc}
\toprule
\textbf{Class} & \textbf{Precision} & \textbf{Recall} & \textbf{F1-Score} \\
\midrule
\textit{P. falciparum} (PF) & 0.XX & 0.XX & 0.XX \\
\textit{P. malariae} (PM) & 0.XX & 0.XX & 0.XX \\
\textit{P. ovale} (PO) & 0.XX & 0.XX & 0.XX \\
\textit{P. vivax} (PV) & 0.XX & 0.XX & 0.XX \\
White Blood Cell (WBC) & 0.XX & 0.XX & 0.XX \\
\midrule
\textbf{Average} & \textbf{0.XX} & \textbf{0.XX} & \textbf{0.XX} \\
\bottomrule
\end{tabular}
\end{table}
"""
        return table

    def _create_comparison_table(self, metrics):
        """Create LaTeX table comparing with baseline methods"""

        table = r"""
\begin{table}[htbp]
\centering
\caption{Comparison with State-of-the-Art Methods}
\label{tab:comparison}
\begin{tabular}{lcccc}
\toprule
\textbf{Method} & \textbf{Precision} & \textbf{Recall} & \textbf{F1} & \textbf{mAP@0.5} \\
\midrule
YOLOv5 \cite{yolov5} & 0.XX & 0.XX & 0.XX & 0.XX \\
YOLOv8 \cite{yolov8} & 0.XX & 0.XX & 0.XX & 0.XX \\
Faster R-CNN \cite{fasterrcnn} & 0.XX & 0.XX & 0.XX & 0.XX \\
Method X \cite{recentpaper} & 0.XX & 0.XX & 0.XX & 0.XX \\
\midrule
\textbf{Ours (YOLOv12)} & \textbf{0.XX} & \textbf{0.XX} & \textbf{0.XX} & \textbf{0.XX} \\
\bottomrule
\end{tabular}
\end{table}
"""
        return table


def main():
    """
    Main evaluation script

    Usage:
        python comprehensive_evaluation.py /path/to/test/images /path/to/ground_truth.json
    """

    if len(sys.argv) < 3:
        print("Usage: python comprehensive_evaluation.py <test_images_dir> <ground_truth_file>")
        print("\nExample:")
        print("  python comprehensive_evaluation.py ../../datasets/test/ ../../datasets/test_annotations.json")
        sys.exit(1)

    test_images_dir = sys.argv[1]
    ground_truth_file = sys.argv[2]

    # Run evaluation
    evaluator = ComprehensiveEvaluator(
        model_path="../../../server/best.pt",
        results_dir="../../results/evaluation"
    )

    metrics, results = evaluator.evaluate_test_set(
        test_images_dir=test_images_dir,
        ground_truth_file=ground_truth_file,
        confidence_threshold=0.26
    )

    # Generate paper tables
    evaluator.generate_paper_tables(metrics)

    print("\n" + "="*80)
    print("✅ All evaluation complete!")
    print("="*80)
    print("\nNext steps:")
    print("1. Review results in research/results/evaluation/")
    print("2. Check figures in research/figures/results/")
    print("3. Use LaTeX tables in research/paper/tables/")
    print("4. Run baseline comparisons")
    print("5. Conduct ablation studies")


if __name__ == "__main__":
    main()
