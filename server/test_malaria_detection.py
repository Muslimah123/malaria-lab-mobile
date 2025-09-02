#!/usr/bin/env python3
"""
Malaria Detection Test Script
Tests the YOLOv12 model on uploaded images and visualizes results
"""

import os
import cv2
import numpy as np
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import Rectangle
import logging
from datetime import datetime

# Import your malaria detection components
from malaria_detector import MalariaDetector
from analysis import MalariaAnalyzer

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MalariaDetectionVisualizer:
    def __init__(self, model_path="best.pt"):
        """Initialize the visualizer with the malaria detector"""
        try:
            self.detector = MalariaDetector(model_path)
            self.analyzer = MalariaAnalyzer()
            logger.info("✅ Malaria Detection Visualizer initialized successfully!")
        except Exception as e:
            logger.error(f"❌ Failed to initialize visualizer: {str(e)}")
            raise
    
    def process_single_image(self, image_path: str, confidence_threshold: float = 0.26):
        """Process a single image and return detection results"""
        try:
            logger.info(f"🔍 Processing image: {image_path}")
            result, error = self.detector.detectAndQuantify(image_path, confidence_threshold)
            
            if error:
                logger.error(f"❌ Error processing {image_path}: {error}")
                return None
            
            logger.info(f"✅ Detection successful for {image_path}")
            logger.info(f"   - Parasites detected: {result['parasiteCount']}")
            logger.info(f"   - WBCs detected: {result['whiteBloodCellsDetected']}")
            logger.info(f"   - Parasite/WBC ratio: {result['parasiteWbcRatio']:.3f}")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Exception processing {image_path}: {str(e)}")
            return None
    
    def visualize_detections(self, image_path: str, detection_result: dict, save_path: str = None):
        """Visualize detections on the image with bounding boxes"""
        try:
            # Read the image
            image = cv2.imread(image_path)
            if image is None:
                logger.error(f"❌ Could not read image: {image_path}")
                return None
            
            # Convert BGR to RGB for matplotlib
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Create figure and axis
            fig, ax = plt.subplots(1, 1, figsize=(12, 8))
            ax.imshow(image_rgb)
            
            # Colors for different detection types
            parasite_color = 'red'
            wbc_color = 'blue'
            
            # Draw parasite bounding boxes
            for parasite in detection_result.get('parasitesDetected', []):
                bbox = parasite['bbox']
                confidence = parasite['confidence']
                parasite_type = parasite['type']
                
                # Create rectangle
                rect = Rectangle(
                    (bbox[0], bbox[1]), 
                    bbox[2] - bbox[0], 
                    bbox[3] - bbox[1],
                    linewidth=2, 
                    edgecolor=parasite_color, 
                    facecolor='none'
                )
                ax.add_patch(rect)
                
                # Add label
                label = f"{parasite_type} ({confidence:.2f})"
                ax.text(bbox[0], bbox[1] - 10, label, 
                       color=parasite_color, fontsize=10, weight='bold',
                       bbox=dict(boxstyle="round,pad=0.3", facecolor='white', alpha=0.8))
            
            # Draw WBC bounding boxes
            for wbc in detection_result.get('wbcsDetected', []):
                bbox = wbc['bbox']
                confidence = wbc['confidence']
                
                # Create rectangle
                rect = Rectangle(
                    (bbox[0], bbox[1]), 
                    bbox[2] - bbox[0], 
                    bbox[3] - bbox[1],
                    linewidth=2, 
                    edgecolor=wbc_color, 
                    facecolor='none'
                )
                ax.add_patch(rect)
                
                # Add label
                label = f"WBC ({confidence:.2f})"
                ax.text(bbox[0], bbox[1] - 10, label, 
                       color=wbc_color, fontsize=10, weight='bold',
                       bbox=dict(boxstyle="round,pad=0.3", facecolor='white', alpha=0.8))
            
            # Set title and labels
            image_name = os.path.basename(image_path)
            ax.set_title(f"Malaria Detection Results: {image_name}\n"
                        f"Parasites: {detection_result['parasiteCount']} | "
                        f"WBCs: {detection_result['whiteBloodCellsDetected']} | "
                        f"Ratio: {detection_result['parasiteWbcRatio']:.3f}", 
                        fontsize=14, weight='bold')
            
            ax.axis('off')
            
            # Save or show
            if save_path:
                plt.savefig(save_path, dpi=300, bbox_inches='tight')
                logger.info(f"💾 Visualization saved to: {save_path}")
                plt.close()
            else:
                plt.show()
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Visualization failed for {image_path}: {str(e)}")
            return False
    
    def process_multiple_images(self, image_paths: list, confidence_threshold: float = 0.26):
        """Process multiple images and generate comprehensive report"""
        results = []
        
        for i, image_path in enumerate(image_paths, 1):
            logger.info(f"\n{'='*60}")
            logger.info(f"📸 Processing image {i}/{len(image_paths)}: {os.path.basename(image_path)}")
            logger.info(f"{'='*60}")
            
            # Process the image
            result = self.process_single_image(image_path, confidence_threshold)
            
            if result:
                # Visualize detections
                image_name = os.path.basename(image_path)
                save_path = f"detection_results_{image_name.replace('.', '_')}.png"
                
                self.visualize_detections(image_path, result, save_path)
                
                # Store results
                results.append({
                    'image_path': image_path,
                    'image_name': image_name,
                    'result': result,
                    'visualization_path': save_path
                })
            else:
                logger.warning(f"⚠️ Skipping {image_path} due to processing failure")
        
        return results
    
    def generate_summary_report(self, results: list):
        """Generate a comprehensive summary report"""
        if not results:
            logger.warning("⚠️ No results to summarize")
            return
        
        logger.info(f"\n{'='*80}")
        logger.info("📊 MALARIA DETECTION SUMMARY REPORT")
        logger.info(f"{'='*80}")
        
        total_images = len(results)
        total_parasites = sum(r['result']['parasiteCount'] for r in results)
        total_wbcs = sum(r['result']['whiteBloodCellsDetected'] for r in results)
        
        # Count by parasite type
        parasite_types = {}
        for r in results:
            for parasite in r['result'].get('parasitesDetected', []):
                p_type = parasite['type']
                parasite_types[p_type] = parasite_types.get(p_type, 0) + 1
        
        logger.info(f"📈 OVERALL STATISTICS:")
        logger.info(f"   - Total images processed: {total_images}")
        logger.info(f"   - Total parasites detected: {total_parasites}")
        logger.info(f"   - Total WBCs detected: {total_wbcs}")
        logger.info(f"   - Average parasites per image: {total_parasites/total_images:.2f}")
        logger.info(f"   - Average WBCs per image: {total_wbcs/total_images:.2f}")
        
        if total_wbcs > 0:
            logger.info(f"   - Overall parasite/WBC ratio: {total_parasites/total_wbcs:.3f}")
        
        logger.info(f"\n🔬 PARASITE TYPE BREAKDOWN:")
        for p_type, count in parasite_types.items():
            logger.info(f"   - {p_type}: {count} detections")
        
        logger.info(f"\n📁 INDIVIDUAL IMAGE RESULTS:")
        for r in results:
            result = r['result']
            logger.info(f"   - {r['image_name']}:")
            logger.info(f"     • Parasites: {result['parasiteCount']}")
            logger.info(f"     • WBCs: {result['whiteBloodCellsDetected']}")
            logger.info(f"     • Ratio: {result['parasiteWbcRatio']:.3f}")
            logger.info(f"     • Visualization: {r['visualization_path']}")
        
        logger.info(f"\n💾 VISUALIZATION FILES SAVED:")
        for r in results:
            logger.info(f"   - {r['visualization_path']}")
        
        logger.info(f"\n{'='*80}")
        logger.info("✅ SUMMARY REPORT COMPLETED")
        logger.info(f"{'='*80}")

def main():
    """Main function to run the malaria detection test"""
    try:
        logger.info("🚀 Starting Malaria Detection Test")
        
        # Initialize visualizer
        visualizer = MalariaDetectionVisualizer()
        
        # Get list of test images from uploads folder
        uploads_dir = Path("uploads")
        image_extensions = ['.jpg', '.jpeg', '.png', '.tiff', '.tif']
        
        # Find all image files
        image_paths = []
        for ext in image_extensions:
            image_paths.extend(uploads_dir.glob(f"*{ext}"))
        
        if not image_paths:
            logger.error("❌ No images found in uploads folder!")
            return
        
        # Convert to strings and sort
        image_paths = [str(p) for p in sorted(image_paths)]
        logger.info(f"📁 Found {len(image_paths)} images to process")
        
        # Process all images
        results = visualizer.process_multiple_images(image_paths, confidence_threshold=0.26)
        
        # Generate summary report
        visualizer.generate_summary_report(results)
        
        logger.info("🎉 Malaria Detection Test Completed Successfully!")
        
    except Exception as e:
        logger.error(f"❌ Test failed: {str(e)}")
        raise

if __name__ == "__main__":
    main()
