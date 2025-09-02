import os
import logging
import json
from datetime import datetime
import cv2
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend for server
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import Rectangle
import numpy as np
from typing import Dict, List, Optional, Tuple
import asyncio
from concurrent.futures import ThreadPoolExecutor
import threading

# Import your existing malaria detection components
import sys
import os

# Add the server directory to Python path to ensure imports work
server_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)

# Initialize logger first
try:
    logger = logging.getLogger(__name__)
except Exception:
    # Fallback logger if logging fails
    class FallbackLogger:
        def info(self, msg): print(f"[INFO] {msg}")
        def error(self, msg): print(f"[ERROR] {msg}")
        def warning(self, msg): print(f"[WARNING] {msg}")
        def debug(self, msg): print(f"[DEBUG] {msg}")
    
    logger = FallbackLogger()

# Try to import malaria detection components with fallback
malaria_detector_available = False
malaria_analyzer_available = False

try:
    from malaria_detector import MalariaDetector
    malaria_detector_available = True
    logger.info("MalariaDetector imported successfully")
except ImportError as e:
    logger.warning(f"MalariaDetector not available: {e}")
    MalariaDetector = None

try:
    from analysis import MalariaAnalyzer
    malaria_analyzer_available = True
    logger.info("MalariaAnalyzer imported successfully")
except ImportError as e:
    logger.warning(f"MalariaAnalyzer not available: {e}")
    MalariaAnalyzer = None

class AIAnalysisService:
    """Service for handling AI analysis of uploaded images"""
    
    def __init__(self):
        self.detector = MalariaDetector() if malaria_detector_available else None
        self.analyzer = MalariaAnalyzer() if malaria_analyzer_available else None
        self.processing_queue = []
        self.is_processing = False
        self.processing_lock = threading.Lock()
        
        # Configuration
        self.max_concurrent_processes = 3
        self.executor = ThreadPoolExecutor(max_workers=self.max_concurrent_processes)
        
        if not malaria_detector_available or not malaria_analyzer_available:
            logger.warning("AI analysis components not fully available - some functionality may be limited")
    
    def add_to_processing_queue(self, session_id: str, test_id: str, image_paths: List[str]) -> bool:
        """Add a processing job to the queue"""
        try:
            # Check if AI components are available
            if not malaria_detector_available or not malaria_analyzer_available:
                logger.warning("AI components not available - cannot process images")
                return False
            
            job = {
                'session_id': session_id,
                'test_id': test_id,
                'image_paths': image_paths,
                'status': 'queued',
                'created_at': datetime.utcnow(),
                'progress': 0,
                'result': None,
                'error': None
            }
            
            with self.processing_lock:
                self.processing_queue.append(job)
                logger.info(f"Added job to queue: {session_id} with {len(image_paths)} images")
            
            # Start processing if not already running
            if not self.is_processing:
                self._start_processing()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to add job to queue: {str(e)}")
            return False
    
    def _start_processing(self):
        """Start the processing loop"""
        if self.is_processing:
            return
        
        self.is_processing = True
        threading.Thread(target=self._processing_loop, daemon=True).start()
        logger.info("AI processing loop started")
    
    def _processing_loop(self):
        """Main processing loop"""
        while self.is_processing:
            try:
                with self.processing_lock:
                    if not self.processing_queue:
                        self.is_processing = False
                        break
                    
                    # Get next job
                    job = self.processing_queue.pop(0)
                
                # Process the job
                self._process_job(job)
                
            except Exception as e:
                logger.error(f"Error in processing loop: {str(e)}")
                continue
    
    def _process_job(self, job: Dict):
        """Process a single job"""
        try:
            session_id = job['session_id']
            test_id = job['test_id']
            image_paths = job['image_paths']
            
            logger.info(f"Processing job: {session_id} with {len(image_paths)} images")
            
            # Update job status
            job['status'] = 'processing'
            job['progress'] = 10
            
            # Create Flask application context for database operations
            from app import create_app
            app = create_app()
            with app.app_context():
                self._process_job_with_context(job)
            
        except Exception as e:
            logger.error(f"Job processing failed: {str(e)}")
            job['status'] = 'failed'
            job['error'] = str(e)
    
    def _store_analysis_results(self, test_id: str, all_results: List[Dict]) -> bool:
        """Store analysis results in the database"""
        try:
            from models import db
            from models.test import Test
            from models.diagnosis_result import DiagnosisResult
            
            # Get the test
            test = Test.query.get(test_id)
            if not test:
                logger.error(f"Test not found: {test_id}")
                return False
            
            # Check if diagnosis result already exists
            existing_result = DiagnosisResult.query.filter_by(test_id=test_id).first()
            if existing_result:
                logger.warning(f"Diagnosis result already exists for test: {test_id}")
                return False
            
            # Calculate overall statistics from all images with robust None handling
            total_parasites = 0
            total_wbcs = 0
            
            for r in all_results:
                # FIXED: Safe aggregation with explicit None handling and type conversion
                parasite_count = r.get('parasiteCount', 0)
                wbc_count = r.get('whiteBloodCellsDetected', 0)
                
                # Ensure we have integers, not None
                if parasite_count is None:
                    parasite_count = 0
                if wbc_count is None:
                    wbc_count = 0
                    
                # Convert to int to be extra safe
                try:
                    parasite_count = int(parasite_count)
                    wbc_count = int(wbc_count)
                except (ValueError, TypeError):
                    logger.warning(f"Invalid count values: parasite_count={parasite_count}, wbc_count={wbc_count}")
                    parasite_count = 0
                    wbc_count = 0
                
                # Safe addition
                total_parasites += parasite_count
                total_wbcs += wbc_count
            
            # Determine overall status
            overall_status = 'POSITIVE' if total_parasites > 0 else 'NEGATIVE'
            
            # Create diagnosis result with explicit initialization
            diagnosis_result = DiagnosisResult(
                test_id=test_id,
                status=overall_status,
                model_version='YOLOv12-1.0',
                processing_time=0,  # TODO: Calculate actual processing time
                total_parasites=0,  # Initialize explicitly
                total_wbcs=0        # Initialize explicitly
            )
            
            # Find the most probable parasite (highest confidence)
            most_probable_parasite = None
            highest_confidence = 0
            
            for result in all_results:
                parasites_detected = result.get('parasitesDetected', []) or []
                if parasites_detected:  # Check if not None and not empty
                    for parasite in parasites_detected:
                        confidence = parasite.get('confidence', 0) or 0
                        if confidence > highest_confidence:
                            highest_confidence = confidence
                            most_probable_parasite = parasite
            
            # Set most probable parasite if found
            if most_probable_parasite:
                diagnosis_result.set_most_probable_parasite(
                    parasite_type=most_probable_parasite.get('type'),
                    confidence=most_probable_parasite.get('confidence', 0),
                    full_name=most_probable_parasite.get('type', 'Unknown')
                )
            
            # Add detections for each image with safe values
            for i, result in enumerate(all_results):
                # Ensure we have valid values, with safe defaults
                parasites_detected = result.get('parasitesDetected', []) or []
                wbcs_detected = result.get('wbcsDetected', []) or []
                white_blood_cells_count = result.get('whiteBloodCellsDetected', 0) or 0
                total_parasites_count = result.get('parasiteCount', 0) or 0
                image_quality = result.get('imageQuality', 0) or 0
                
                # Convert to safe integers
                try:
                    white_blood_cells_count = int(white_blood_cells_count)
                    total_parasites_count = int(total_parasites_count)
                    image_quality = int(image_quality)
                except (ValueError, TypeError):
                    white_blood_cells_count = 0
                    total_parasites_count = 0
                    image_quality = 0
                
                # Build annotated image URL if annotation exists
                annotated_url = None
                try:
                    base_name = os.path.basename(result.get('originalFilename', ''))
                    logger.info(f"Processing annotation for: {base_name}")
                    
                    # Prefer test-script matplotlib file in project root
                    test_file = f"detection_results_{base_name.replace('.', '_')}.png"
                    root_candidate = os.path.join(os.path.abspath(''), test_file)
                    logger.info(f"Checking for existing annotation: {root_candidate}")
                    
                    if os.path.exists(root_candidate):
                        annotated_url = "/annotated/" + test_file
                        logger.info(f"Found existing annotation: {annotated_url}")
                    else:
                        # Generate annotated image using matplotlib (same as test script)
                        img_path = result.get('imagePath', '')
                        logger.info(f"Attempting to generate annotation from: {img_path}")
                        logger.info(f"Image path exists: {os.path.exists(img_path) if img_path else 'No path provided'}")
                        
                        if img_path and os.path.exists(img_path):
                            # Read image using OpenCV and convert to RGB
                            img = cv2.imread(img_path)
                            if img is not None:
                                image_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                                
                                # Create figure and axis (same as test script)
                                fig, ax = plt.subplots(1, 1, figsize=(12, 8))
                                ax.imshow(image_rgb)
                                
                                # Colors for different detection types
                                parasite_color = 'red'
                                wbc_color = 'blue'
                                
                                # Draw parasite bounding boxes (same as test script)
                                for parasite in parasites_detected:
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
                                    
                                    # Add label (same as test script)
                                    label = f"{parasite_type} ({confidence:.2f})"
                                    ax.text(bbox[0], bbox[1] - 10, label, 
                                           color=parasite_color, fontsize=10, weight='bold',
                                           bbox=dict(boxstyle="round,pad=0.3", facecolor='white', alpha=0.8))
                                
                                # Draw WBC bounding boxes (same as test script)
                                for wbc in wbcs_detected:
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
                                    
                                    # Add label (same as test script)
                                    label = f"WBC ({confidence:.2f})"
                                    ax.text(bbox[0], bbox[1] - 10, label, 
                                           color=wbc_color, fontsize=10, weight='bold',
                                           bbox=dict(boxstyle="round,pad=0.3", facecolor='white', alpha=0.8))
                                
                                # Set title and labels (same as test script)
                                parasite_count = len(parasites_detected)
                                wbc_count = len(wbcs_detected)
                                ratio = parasite_count / wbc_count if wbc_count > 0 else 0
                                
                                ax.set_title(f"Malaria Detection Results: {base_name}\n"
                                            f"Parasites: {parasite_count} | "
                                            f"WBCs: {wbc_count} | "
                                            f"Ratio: {ratio:.3f}", 
                                            fontsize=14, weight='bold')
                                
                                ax.axis('off')
                                
                                # Save the figure to uploads directory for proper serving
                                upload_dir = os.path.join(os.getcwd(), 'uploads')
                                if '/uploads/' in img_path:
                                    # Extract session directory from img_path
                                    session_dir = os.path.basename(os.path.dirname(img_path))
                                    annotated_dir = os.path.join(upload_dir, session_dir)
                                else:
                                    annotated_dir = upload_dir
                                
                                os.makedirs(annotated_dir, exist_ok=True)
                                annotated_filename = f"annotated_{base_name}"
                                annotated_path = os.path.join(annotated_dir, annotated_filename)
                                
                                logger.info(f"Saving annotated image to: {annotated_path}")
                                
                                plt.savefig(annotated_path, dpi=300, bbox_inches='tight')
                                plt.close()  # Important: close to free memory
                                
                                # Generate URL for frontend (relative to uploads)
                                if '/uploads/' in img_path:
                                    session_dir = os.path.basename(os.path.dirname(img_path))
                                    annotated_url = f"/uploads/{session_dir}/{annotated_filename}"
                                else:
                                    annotated_url = f"/uploads/{annotated_filename}"
                                
                                logger.info(f"Generated annotation URL: {annotated_url}")
                                
                                # Verify file was created
                                if os.path.exists(annotated_path):
                                    logger.info(f"Annotation file successfully created: {annotated_path}")
                                else:
                                    logger.error(f"Failed to create annotation file: {annotated_path}")
                                    annotated_url = None
                            else:
                                logger.warning(f"Could not read image from: {img_path}")
                        else:
                            logger.warning(f"Image path does not exist or is empty: {img_path}")
                except Exception as e:
                    logger.error(f"Error generating annotation: {str(e)}")
                    import traceback
                    logger.error(f"Full traceback: {traceback.format_exc()}")
                    annotated_url = None

                diagnosis_result.add_detection(
                    image_id=str(i),
                    original_filename=result.get('originalFilename', ''),
                    parasites_detected=parasites_detected,
                    wbcs_detected=wbcs_detected,
                    white_blood_cells_count=white_blood_cells_count,
                    total_parasites=total_parasites_count,
                    image_quality=image_quality,
                    annotated_image_url=annotated_url
                )
            
            # Set the final totals explicitly (overriding any None values)
            diagnosis_result.total_parasites = total_parasites
            diagnosis_result.total_wbcs = total_wbcs
            
            # Calculate severity and confidence
            diagnosis_result.calculate_severity()
            diagnosis_result.calculate_overall_confidence()
            
            # Add to database
            db.session.add(diagnosis_result)
            
            # Update test status to completed
            test.update_status('completed')
            
            # Update upload session status to completed
            from models.upload_session import UploadSession
            upload_session = UploadSession.query.filter_by(session_id=test.upload_session.session_id).first()
            if upload_session:
                upload_session.status = 'completed'
                upload_session.updated_at = datetime.utcnow()
                logger.info(f"Upload session {upload_session.session_id} marked as completed")
            
            # Update patient test statistics
            test.patient.update_test_statistics()
            
            db.session.commit()
            
            logger.info(f"Analysis results stored successfully for test: {test_id}")
            logger.info(f"Total parasites detected: {total_parasites}, Total WBCs: {total_wbcs}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store analysis results: {str(e)}")
            if 'db' in locals():
                db.session.rollback()
            return False
    
    def get_job_status(self, session_id: str) -> Optional[Dict]:
        """Get the status of a processing job"""
        with self.processing_lock:
            for job in self.processing_queue:
                if job['session_id'] == session_id:
                    return job
        return None
    
    def cancel_job(self, session_id: str) -> bool:
        """Cancel a processing job"""
        try:
            with self.processing_lock:
                for i, job in enumerate(self.processing_queue):
                    if job['session_id'] == session_id and job['status'] == 'queued':
                        cancelled_job = self.processing_queue.pop(i)
                        cancelled_job['status'] = 'cancelled'
                        logger.info(f"Job cancelled: {session_id}")
                        return True
            return False
        except Exception as e:
            logger.error(f"Failed to cancel job: {str(e)}")
            return False
    
    def get_queue_status(self) -> Dict:
        """Get the current status of the processing queue"""
        with self.processing_lock:
            return {
                'isProcessing': self.is_processing,
                'queueLength': len(self.processing_queue),
                'activeJobs': [job for job in self.processing_queue if job['status'] == 'processing'],
                'queuedJobs': [job for job in self.processing_queue if job['status'] == 'queued']
            }
    
    def process_single_image(self, image_path: str, confidence_threshold: float = 0.26) -> Tuple[Optional[Dict], Optional[str]]:
        """Process a single image (for testing/debugging)"""
        try:
            if not os.path.exists(image_path):
                return None, f"Image not found: {image_path}"
            
            result, error = self.detector.detectAndQuantify(image_path, confidence_threshold)
            return result, error
            
        except Exception as e:
            logger.error(f"Single image processing failed: {str(e)}")
            return None, str(e)
    
    def cleanup(self):
        """Cleanup resources"""
        try:
            self.executor.shutdown(wait=True)
            logger.info("AI analysis service cleaned up")
        except Exception as e:
            logger.error(f"Cleanup failed: {str(e)}")
    
    def _process_job_with_context(self, job: Dict):
        """Process a single job within Flask application context"""
        try:
            session_id = job['session_id']
            test_id = job['test_id']
            image_paths = job['image_paths']
            
            logger.info(f"Processing job with context: {session_id} with {len(image_paths)} images")
            
            # Validate image paths
            valid_paths = []
            for path in image_paths:
                if os.path.exists(path):
                    valid_paths.append(path)
                else:
                    logger.warning(f"Image path not found: {path}")
            
            if not valid_paths:
                job['status'] = 'failed'
                job['error'] = 'No valid image paths found'
                return
            
            # Update progress
            job['progress'] = 20
            
            # Process each image
            all_results = []
            for i, image_path in enumerate(valid_paths):
                try:
                    logger.info(f"Processing image {i+1}/{len(valid_paths)}: {os.path.basename(image_path)}")
                    
                    # Process the image
                    result, error = self.detector.detectAndQuantify(image_path)
                    
                    if error:
                        logger.error(f"Failed to process {image_path}: {error}")
                        continue
                    
                    # Add image metadata
                    result['imagePath'] = image_path
                    result['originalFilename'] = os.path.basename(image_path)
                    all_results.append(result)
                    
                    # Update progress
                    progress = 20 + ((i + 1) / len(valid_paths)) * 60
                    job['progress'] = int(progress)
                    
                except Exception as e:
                    logger.error(f"Error processing {image_path}: {str(e)}")
                    continue
            
            if not all_results:
                job['status'] = 'failed'
                job['error'] = 'No images were processed successfully'
                return
            
            # Update progress
            job['progress'] = 80
            
            # Store results in database
            success = self._store_analysis_results(test_id, all_results)
            
            if success:
                job['status'] = 'completed'
                job['progress'] = 100
                job['result'] = all_results
                logger.info(f"Job completed successfully: {session_id}")
            else:
                job['status'] = 'failed'
                job['error'] = 'Failed to store analysis results'
                logger.error(f"Job failed: {session_id}")
                
        except Exception as e:
            logger.error(f"Job processing failed: {str(e)}")
            job['status'] = 'failed'
            job['error'] = str(e)

# Global instance
ai_service = AIAnalysisService()
