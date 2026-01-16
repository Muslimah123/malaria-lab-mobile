#!/usr/bin/env python3
"""
Generate publication-quality architecture diagrams for AIME 2026 paper
Requires: matplotlib, graphviz (optional), pillow
Install: pip install matplotlib pillow
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle
import matplotlib.lines as mlines
import numpy as np

# Set publication style
plt.rcParams['font.family'] = 'serif'
plt.rcParams['font.size'] = 10
plt.rcParams['figure.dpi'] = 300

def create_system_architecture_diagram():
    """
    Create Figure 1: System Architecture Overview
    """
    fig, ax = plt.subplots(figsize=(12, 10))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 10)
    ax.axis('off')

    # Color scheme (professional, colorblind-friendly)
    color_mobile = '#4A90E2'      # Blue
    color_server = '#50C878'      # Green
    color_ai = '#F5A623'          # Orange
    color_data = '#9013FE'        # Purple

    # ===== MOBILE APPLICATION LAYER (Top) =====
    # Main container
    mobile_box = FancyBboxPatch(
        (0.5, 7.5), 11, 2,
        boxstyle="round,pad=0.1",
        edgecolor=color_mobile,
        facecolor=color_mobile,
        alpha=0.2,
        linewidth=2
    )
    ax.add_patch(mobile_box)
    ax.text(6, 9.3, 'MOBILE APPLICATION LAYER', ha='center', va='center',
            fontsize=12, fontweight='bold', color=color_mobile)
    ax.text(6, 9.0, '(React Native + Expo)', ha='center', va='center',
            fontsize=9, style='italic')

    # Mobile components
    mobile_components = [
        (1.5, 7.8, 'Camera\nCapture'),
        (3.5, 7.8, 'Patient\nManagement'),
        (5.5, 7.8, 'Test\nCreation'),
        (7.5, 7.8, 'Image\nUpload'),
        (9.5, 7.8, 'Results\nDisplay')
    ]

    for x, y, label in mobile_components:
        box = FancyBboxPatch(
            (x-0.6, y), 1.2, 0.8,
            boxstyle="round,pad=0.05",
            edgecolor=color_mobile,
            facecolor='white',
            linewidth=1.5
        )
        ax.add_patch(box)
        ax.text(x, y+0.4, label, ha='center', va='center', fontsize=8)

    # ===== CONNECTION: Mobile → Server =====
    arrow = FancyArrowPatch(
        (6, 7.3), (6, 6.2),
        arrowstyle='->,head_width=0.3,head_length=0.3',
        color='black',
        linewidth=2
    )
    ax.add_patch(arrow)
    ax.text(6.5, 6.75, 'JWT + HTTPS\nREST API', ha='left', va='center',
            fontsize=8, bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))

    # ===== APPLICATION SERVER LAYER (Middle) =====
    server_box = FancyBboxPatch(
        (0.5, 3.8), 11, 2.2,
        boxstyle="round,pad=0.1",
        edgecolor=color_server,
        facecolor=color_server,
        alpha=0.2,
        linewidth=2
    )
    ax.add_patch(server_box)
    ax.text(6, 5.8, 'APPLICATION SERVER LAYER', ha='center', va='center',
            fontsize=12, fontweight='bold', color=color_server)
    ax.text(6, 5.5, '(Flask REST API)', ha='center', va='center',
            fontsize=9, style='italic')

    # API Endpoints layer
    api_box = FancyBboxPatch(
        (1, 5.0), 10, 0.4,
        boxstyle="round,pad=0.03",
        edgecolor=color_server,
        facecolor='white',
        linewidth=1.5
    )
    ax.add_patch(api_box)
    ax.text(6, 5.2, '/auth  |  /patients  |  /tests  |  /upload  |  /dashboard',
            ha='center', va='center', fontsize=8, family='monospace')

    # Business Logic
    biz_box = FancyBboxPatch(
        (1, 4.3), 4, 0.5,
        boxstyle="round,pad=0.03",
        edgecolor=color_server,
        facecolor='white',
        linewidth=1.5
    )
    ax.add_patch(biz_box)
    ax.text(3, 4.55, 'Business Logic\n(Validation, Analysis)',
            ha='center', va='center', fontsize=8)

    # AI Inference box
    ai_box = FancyBboxPatch(
        (6, 4.0), 4.5, 1.2,
        boxstyle="round,pad=0.05",
        edgecolor=color_ai,
        facecolor=color_ai,
        alpha=0.3,
        linewidth=2
    )
    ax.add_patch(ai_box)
    ax.text(8.25, 5.0, 'AI INFERENCE ENGINE', ha='center', va='center',
            fontsize=10, fontweight='bold', color=color_ai)

    # YOLOv12 model
    yolo_box = FancyBboxPatch(
        (6.3, 4.1), 3.8, 0.85,
        boxstyle="round,pad=0.03",
        edgecolor=color_ai,
        facecolor='white',
        linewidth=1.5
    )
    ax.add_patch(yolo_box)
    ax.text(8.2, 4.8, 'YOLOv12 Model (best.pt)', ha='center', va='center',
            fontsize=9, fontweight='bold')
    ax.text(8.2, 4.6, 'Input: 640×640 RGB', ha='center', va='center', fontsize=7)
    ax.text(8.2, 4.4, 'Output: Bboxes + Classes', ha='center', va='center', fontsize=7)
    ax.text(8.2, 4.2, 'Classes: PF, PM, PO, PV, WBC', ha='center', va='center', fontsize=7)

    # ===== CONNECTION: Server → Data =====
    arrow2 = FancyArrowPatch(
        (6, 3.7), (6, 2.5),
        arrowstyle='<->,head_width=0.3,head_length=0.3',
        color='black',
        linewidth=2
    )
    ax.add_patch(arrow2)
    ax.text(6.5, 3.1, 'SQL Queries\n& File I/O', ha='left', va='center',
            fontsize=8, bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))

    # ===== DATA LAYER (Bottom) =====
    data_box = FancyBboxPatch(
        (0.5, 0.3), 11, 2,
        boxstyle="round,pad=0.1",
        edgecolor=color_data,
        facecolor=color_data,
        alpha=0.2,
        linewidth=2
    )
    ax.add_patch(data_box)
    ax.text(6, 2.1, 'DATA LAYER', ha='center', va='center',
            fontsize=12, fontweight='bold', color=color_data)

    # Data components
    data_components = [
        (2, 0.5, 'SQLite Database\n────────\n• Users\n• Patients\n• Tests\n• Diagnoses'),
        (6, 0.5, 'File Storage\n────────\nuploads/\n  test_1/\n    img1.jpg'),
        (10, 0.5, 'Activity Logs\n────────\n• Audit Trail\n• User Actions')
    ]

    for x, y, label in data_components:
        box = FancyBboxPatch(
            (x-1.3, y), 2.6, 1.4,
            boxstyle="round,pad=0.05",
            edgecolor=color_data,
            facecolor='white',
            linewidth=1.5
        )
        ax.add_patch(box)
        ax.text(x, y+0.7, label, ha='center', va='center', fontsize=7, family='monospace')

    plt.tight_layout()
    plt.savefig('architecture/figure1_system_architecture.pdf', dpi=300, bbox_inches='tight')
    plt.savefig('architecture/figure1_system_architecture.png', dpi=300, bbox_inches='tight')
    print("✅ Generated: figure1_system_architecture.pdf/png")
    plt.close()


def create_yolo_architecture_diagram():
    """
    Create Figure 2: YOLOv12 Model Architecture
    """
    fig, ax = plt.subplots(figsize=(14, 6))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 6)
    ax.axis('off')

    # Colors
    color_input = '#4A90E2'
    color_backbone = '#50C878'
    color_neck = '#F5A623'
    color_head = '#9013FE'

    # ===== INPUT =====
    input_box = FancyBboxPatch(
        (0.5, 2), 1.2, 2,
        boxstyle="round,pad=0.05",
        edgecolor=color_input,
        facecolor=color_input,
        alpha=0.3,
        linewidth=2
    )
    ax.add_patch(input_box)
    ax.text(1.1, 5, 'INPUT', ha='center', va='center', fontsize=10, fontweight='bold')
    ax.text(1.1, 3.0, 'Image\n640×640×3\nRGB', ha='center', va='center', fontsize=8)

    # Arrow: Input → Backbone
    ax.arrow(1.8, 3.0, 0.5, 0, head_width=0.2, head_length=0.2, fc='black', ec='black')

    # ===== BACKBONE =====
    backbone_box = FancyBboxPatch(
        (2.5, 1.5), 4, 3,
        boxstyle="round,pad=0.1",
        edgecolor=color_backbone,
        facecolor=color_backbone,
        alpha=0.2,
        linewidth=2
    )
    ax.add_patch(backbone_box)
    ax.text(4.5, 5.2, 'BACKBONE (CSPDarknet)', ha='center', va='center',
            fontsize=10, fontweight='bold', color=color_backbone)

    # Backbone blocks
    backbone_blocks = [
        (3, 3.8, 'Conv + BN\n+ SiLU'),
        (3, 3.2, 'CSP Block 1\n80×80×256'),
        (3, 2.6, 'CSP Block 2\n40×40×512'),
        (3, 2.0, 'CSP Block 3\n20×20×1024'),
        (5.5, 2.0, 'CSP Block 4\n10×10×1024')
    ]

    for x, y, label in backbone_blocks:
        w = 1.8 if 'Block' in label else 1.5
        box = FancyBboxPatch(
            (x-w/2, y-0.2), w, 0.5,
            boxstyle="round,pad=0.03",
            edgecolor=color_backbone,
            facecolor='white',
            linewidth=1
        )
        ax.add_patch(box)
        ax.text(x, y+0.05, label, ha='center', va='center', fontsize=7)

    # Arrows between blocks
    for i in range(len(backbone_blocks)-2):
        ax.arrow(3, backbone_blocks[i][1]-0.25, 0, -0.35,
                head_width=0.1, head_length=0.1, fc='gray', ec='gray', linewidth=0.5)
    ax.arrow(3, 2.3, 2.1, -0.15, head_width=0.1, head_length=0.1,
            fc='gray', ec='gray', linewidth=0.5)

    # Arrow: Backbone → Neck
    ax.arrow(6.6, 3.0, 0.5, 0, head_width=0.2, head_length=0.2, fc='black', ec='black')

    # ===== NECK =====
    neck_box = FancyBboxPatch(
        (7.3, 1.8), 2.5, 2.4,
        boxstyle="round,pad=0.1",
        edgecolor=color_neck,
        facecolor=color_neck,
        alpha=0.2,
        linewidth=2
    )
    ax.add_patch(neck_box)
    ax.text(8.55, 4.8, 'NECK', ha='center', va='center',
            fontsize=10, fontweight='bold', color=color_neck)
    ax.text(8.55, 4.5, '(PANet)', ha='center', va='center',
            fontsize=9, style='italic')

    # PANet components
    panet_box = FancyBboxPatch(
        (7.5, 2.0), 2.1, 2.0,
        boxstyle="round,pad=0.03",
        edgecolor=color_neck,
        facecolor='white',
        linewidth=1.5
    )
    ax.add_patch(panet_box)
    ax.text(8.55, 3.5, 'Feature\nAggregation', ha='center', va='center', fontsize=8)
    ax.text(8.55, 2.9, '────────', ha='center', va='center', fontsize=6)
    ax.text(8.55, 2.6, 'Bottom-up\nPathway', ha='center', va='center', fontsize=7)
    ax.text(8.55, 2.2, 'Top-down\nPathway', ha='center', va='center', fontsize=7)

    # Arrow: Neck → Head
    ax.arrow(9.9, 3.0, 0.5, 0, head_width=0.2, head_length=0.2, fc='black', ec='black')

    # ===== HEAD =====
    head_box = FancyBboxPatch(
        (10.5, 1.0), 3, 4,
        boxstyle="round,pad=0.1",
        edgecolor=color_head,
        facecolor=color_head,
        alpha=0.2,
        linewidth=2
    )
    ax.add_patch(head_box)
    ax.text(12, 5.5, 'DETECTION HEAD', ha='center', va='center',
            fontsize=10, fontweight='bold', color=color_head)

    # Detection scales
    scales = [
        (11.2, 4.2, '80×80\nScale'),
        (11.2, 3.4, '40×40\nScale'),
        (11.2, 2.6, '20×20\nScale')
    ]

    for x, y, label in scales:
        box = FancyBboxPatch(
            (x-0.5, y-0.25), 1.0, 0.5,
            boxstyle="round,pad=0.03",
            edgecolor=color_head,
            facecolor='white',
            linewidth=1
        )
        ax.add_patch(box)
        ax.text(x, y, label, ha='center', va='center', fontsize=7)

    # Per-anchor predictions
    anchor_box = FancyBboxPatch(
        (10.7, 1.2), 2.5, 1.2,
        boxstyle="round,pad=0.05",
        edgecolor=color_head,
        facecolor='white',
        linewidth=1.5
    )
    ax.add_patch(anchor_box)
    ax.text(11.95, 2.2, 'Per Anchor:', ha='center', va='center', fontsize=8, fontweight='bold')
    ax.text(11.95, 1.95, '• Bounding box (x,y,w,h)', ha='center', va='center', fontsize=7)
    ax.text(11.95, 1.75, '• Objectness score', ha='center', va='center', fontsize=7)
    ax.text(11.95, 1.55, '• Class probabilities (5)', ha='center', va='center', fontsize=7)
    ax.text(11.95, 1.35, '  PF, PM, PO, PV, WBC', ha='center', va='center', fontsize=6, style='italic')

    # Final output indicator
    output_arrow = FancyArrowPatch(
        (12, 0.9), (12, 0.3),
        arrowstyle='->,head_width=0.3,head_length=0.3',
        color='black',
        linewidth=2
    )
    ax.add_patch(output_arrow)
    ax.text(12, 0.1, 'Detections: Bboxes + Labels + Confidences',
            ha='center', va='center', fontsize=8, fontweight='bold',
            bbox=dict(boxstyle='round', facecolor='yellow', alpha=0.3))

    plt.tight_layout()
    plt.savefig('architecture/figure2_yolo_architecture.pdf', dpi=300, bbox_inches='tight')
    plt.savefig('architecture/figure2_yolo_architecture.png', dpi=300, bbox_inches='tight')
    print("✅ Generated: figure2_yolo_architecture.pdf/png")
    plt.close()


def create_workflow_diagram():
    """
    Create Figure: Diagnostic Workflow
    """
    fig, ax = plt.subplots(figsize=(10, 12))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 12)
    ax.axis('off')

    color_step = '#4A90E2'
    step_height = 1.2

    steps = [
        (11.0, '1. Healthcare Worker Login', 'Authenticate via JWT'),
        (9.5, '2. Select/Create Patient', 'Enter demographics'),
        (8.0, '3. Create New Test', 'Specify sample type'),
        (6.5, '4. Capture Blood Smear', 'Use device camera'),
        (5.0, '5. Upload to Server', 'HTTPS transfer'),
        (3.5, '6. AI Analysis', 'YOLOv12 inference'),
        (2.0, '7. Results Display', 'View detections'),
        (0.5, '8. Diagnosis Confirmation', 'Clinician review')
    ]

    for y, title, desc in steps:
        # Main box
        box = FancyBboxPatch(
            (1, y), 8, step_height,
            boxstyle="round,pad=0.1",
            edgecolor=color_step,
            facecolor=color_step,
            alpha=0.2,
            linewidth=2
        )
        ax.add_patch(box)

        # Title
        ax.text(5, y + 0.7, title, ha='center', va='center',
                fontsize=11, fontweight='bold')

        # Description
        ax.text(5, y + 0.3, desc, ha='center', va='center',
                fontsize=9, style='italic', color='gray')

        # Arrow to next step (except last)
        if y > 0.5:
            arrow = FancyArrowPatch(
                (5, y - 0.05), (5, y - 0.45),
                arrowstyle='->,head_width=0.4,head_length=0.4',
                color=color_step,
                linewidth=2.5
            )
            ax.add_patch(arrow)

    # Title
    ax.text(5, 11.8, 'Diagnostic Workflow', ha='center', va='center',
            fontsize=14, fontweight='bold')

    plt.tight_layout()
    plt.savefig('architecture/figure3_workflow.pdf', dpi=300, bbox_inches='tight')
    plt.savefig('architecture/figure3_workflow.png', dpi=300, bbox_inches='tight')
    print("✅ Generated: figure3_workflow.pdf/png")
    plt.close()


def main():
    """Generate all architecture diagrams"""
    import os

    # Create output directory
    os.makedirs('architecture', exist_ok=True)

    print("🎨 Generating architecture diagrams for AIME 2026 paper...")
    print("="*60)

    # Generate diagrams
    create_system_architecture_diagram()
    create_yolo_architecture_diagram()
    create_workflow_diagram()

    print("="*60)
    print("✅ All diagrams generated successfully!")
    print("\nOutput files:")
    print("  📁 research/figures/architecture/")
    print("     • figure1_system_architecture.pdf/png")
    print("     • figure2_yolo_architecture.pdf/png")
    print("     • figure3_workflow.pdf/png")
    print("\nUse the PDF versions in your LaTeX paper for best quality.")
    print("Use the PNG versions for presentations or preview.")


if __name__ == "__main__":
    main()
