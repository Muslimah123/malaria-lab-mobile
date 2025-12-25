import os
import logging
import json
from datetime import datetime
import cv2
import numpy as np
from typing import Dict, List, Optional, Tuple
import asyncio
from concurrent.futures import ThreadPoolExecutor
import threading
import sys

# ============================================================================
# CUSTOM YOLOV12 PATH SETUP
# ============================================================================
os.environ['ULTRALYTICS_DICT_SYNC'] = 'False'
os.environ['YOLO_VERBOSE'] = 'False'

current_file = os.path.abspath(__file__)
services_dir = os.path.dirname(current_file)
server_dir = os.path.dirname(services_dir)
project_root = os.path.dirname(server_dir)
yolov12_path = os.path.join(project_root, 'yolov12')

if os.path.exists(yolov12_path):
    if yolov12_path not in sys.path:
        sys.path.append(yolov12_path) 
    print(f"✓ [ai_analysis] Using custom YOLOv12 from: {yolov12_path}")

if server_dir not in sys.path:
    sys.path.insert(0, server_dir)
# ============================================================================

logger = logging.getLogger(__name__)

# Fallback imports
malaria_detector_available = False
try:
    from malaria_detector import MalariaDetector
    logger.info("MalariaDetector imported successfully")
    malaria_detector_available = True
except ImportError as e:
    logger.warning(f"MalariaDetector not available: {e}")
    MalariaDetector = None

malaria_analyzer_available = False
try:
    from analysis import MalariaAnalyzer
    logger.info("MalariaAnalyzer imported successfully")
    malaria_analyzer_available = True
except ImportError as e:
    logger.warning(f"MalariaAnalyzer not available: {e}")
    MalariaAnalyzer = None

class AIAnalysisService:
    def __init__(self):
        self.detector = MalariaDetector() if malaria_detector_available else None
        self.processing_queue = []
        self.is_processing = False
        self.processing_lock = threading.Lock()
        self.executor = ThreadPoolExecutor(max_workers=3)
        logger.info("AI processing loop started")

    def add_to_processing_queue(self, session_id: str, test_id: str, image_paths: List[str]) -> bool:
        """Add a job to the processing queue"""
        if not malaria_detector_available:
            logger.error("MalariaDetector not available, cannot queue job")
            return False
        
        logger.info(f"Adding job to queue: {session_id} with {len(image_paths)} images")
        
        job = {
            'session_id': session_id,
            'test_id': test_id,
            'image_paths': image_paths,
            'status': 'queued',
            'created_at': datetime.utcnow(),
            'progress': 0
        }
        
        with self.processing_lock:
            self.processing_queue.append(job)
            logger.info(f"Added job to queue: {session_id} with {len(image_paths)} images")
        
        if not self.is_processing:
            logger.info("Starting processing loop")
            self._start_processing()
        
        return True

    def get_job_status(self, session_id: str) -> Optional[Dict]:
        """Get the status of a job in the queue"""
        with self.processing_lock:
            for job in self.processing_queue:
                if job['session_id'] == session_id:
                    return {
                        'status': job['status'],
                        'progress': job['progress']
                    }
        return None

    def _start_processing(self):
        """Start the background processing thread"""
        self.is_processing = True
        processing_thread = threading.Thread(target=self._processing_loop, daemon=True)
        processing_thread.start()

    def _processing_loop(self):
        """Main processing loop that runs in background thread"""
        logger.info("Processing loop started")
        
        while self.is_processing:
            job = None
            with self.processing_lock:
                if not self.processing_queue:
                    self.is_processing = False
                    logger.info("No more jobs in queue, stopping processing loop")
                    break
                job = self.processing_queue.pop(0)
            
            if job:
                logger.info(f"Processing job: {job['session_id']} with {len(job['image_paths'])} images")
                self._process_job(job)

    def _process_job(self, job: Dict):
        """Process a single job with Flask app context"""
        from app import create_app
        app = create_app()
        
        with app.app_context():
            self._process_job_with_context(job)

    def _store_analysis_results(self, test_id: str, all_results: List[Dict]) -> bool:
        """Stores results and generates annotated images using YOLO native plot"""
        try:
            from models import db
            from models.test import Test
            from models.diagnosis_result import DiagnosisResult
            
            test = Test.query.get(test_id)
            if not test:
                logger.error(f"Test {test_id} not found")
                return False

            # NOTE: do not pre-sum totals here because each call to
            # DiagnosisResult.add_detection will increment the stored
            # totals. We'll allow add_detection to accumulate per-image
            # values and compute overall totals after adding detections
            # to avoid double-counting.
            logger.info("=== DIAGNOSIS RESULT DEBUG ===")
            
            # ✅ CALCULATE MOST PROBABLE PARASITE
            most_probable = None
            max_confidence = 0
            parasite_names = {
                'PF': 'Plasmodium Falciparum',
                'PM': 'Plasmodium Malariae',
                'PO': 'Plasmodium Ovale',
                'PV': 'Plasmodium Vivax'
            }
            
            for result in all_results:
                for parasite in result.get('parasitesDetected', []):
                    if parasite['confidence'] > max_confidence:
                        max_confidence = parasite['confidence']
                        most_probable = parasite['type']
            
            logger.info(f"Most probable parasite: {most_probable} with confidence {max_confidence}")
            
            # Do not pre-calculate totals here; create a DiagnosisResult
            # with zeroed totals and let per-image add_detection calls
            # accumulate the totals. We'll compute the final ratio after
            # all detections have been added.
            has_parasites = any(len(r.get('parasitesDetected', [])) > 0 for r in all_results)
            diagnosis_result = DiagnosisResult(
                test_id=test_id,
                status='POSITIVE' if has_parasites else 'NEGATIVE',
                model_version='YOLOv12-1.0',
                total_parasites=0,
                total_wbcs=0,
                parasite_wbc_ratio=0.0
            )
            
            # ✅ SET MOST PROBABLE PARASITE
            if most_probable:
                diagnosis_result.set_most_probable_parasite(
                    most_probable, 
                    max_confidence,
                    parasite_names.get(most_probable, most_probable)
                )
                logger.info(f"Set most probable parasite: {most_probable} ({parasite_names.get(most_probable)})")
            else:
                logger.info("No parasites detected, most probable parasite is None")

            # Process each image and add detections
            for i, result in enumerate(all_results):
                annotated_url = None
                img_path = result.get('imagePath', '')
                
                if img_path and os.path.exists(img_path):
                    try:
                        # Use YOLO's built-in plotting
                        yolo_results = self.detector.model.predict(img_path, conf=0.26, verbose=False)
                        annotated_frame = yolo_results[0].plot(labels=True, conf=True, boxes=True)

                        # Set up directory
                        upload_dir = os.path.join(server_dir, 'uploads')
                        session_dir = os.path.basename(os.path.dirname(img_path))
                        annotated_dir = os.path.join(upload_dir, session_dir)
                        os.makedirs(annotated_dir, exist_ok=True)
                        
                        annotated_filename = f"annotated_{os.path.basename(img_path)}"
                        annotated_path = os.path.join(annotated_dir, annotated_filename)
                        
                        cv2.imwrite(annotated_path, annotated_frame)
                        annotated_url = f"/uploads/{session_dir}/{annotated_filename}"
                        logger.info(f"Generated annotated image: {annotated_url}")
                    except Exception as e:
                        logger.error(f"Error generating annotated image: {e}")

                # Add detection to diagnosis result
                diagnosis_result.add_detection(
                    image_id=str(i),
                    original_filename=result.get('originalFilename', ''),
                    parasites_detected=result.get('parasitesDetected', []),
                    wbcs_detected=result.get('wbcsDetected', []),
                    white_blood_cells_count=result.get('whiteBloodCellsDetected', 0),
                    total_parasites=result.get('parasiteCount', 0),
                    image_quality=result.get('imageQuality', 0),
                    annotated_image_url=annotated_url
                )

            # Compute final parasite/WBC ratio from accumulated totals
            try:
                if diagnosis_result.total_wbcs and diagnosis_result.total_wbcs > 0:
                    diagnosis_result.parasite_wbc_ratio = diagnosis_result.total_parasites / diagnosis_result.total_wbcs
                else:
                    diagnosis_result.parasite_wbc_ratio = 0.0
            except Exception:
                diagnosis_result.parasite_wbc_ratio = 0.0

            # Calculate severity and confidence
            diagnosis_result.calculate_severity()
            diagnosis_result.calculate_overall_confidence()  # ✅ CALCULATE CONFIDENCE
            
            logger.info(f"Diagnosis result created:")
            logger.info(f"  - Status: {diagnosis_result.status}")
            logger.info(f"  - Total Parasites: {diagnosis_result.total_parasites}")
            logger.info(f"  - Total WBCs: {diagnosis_result.total_wbcs}")
            logger.info(f"  - Ratio: {diagnosis_result.parasite_wbc_ratio}")
            logger.info(f"  - Severity: {diagnosis_result.severity_level}")
            logger.info(f"  - Confidence: {diagnosis_result.confidence}")
            
            # Save to database
            db.session.add(diagnosis_result)
            # Recalculate and persist test quality score so API responses include it
            try:
                test.calculate_quality_score()
                db.session.add(test)
            except Exception as e:
                logger.warning(f"Failed to calculate/persist test quality score: {e}")

            test.update_status('completed')
            db.session.commit()
            
            logger.info(f"Successfully stored analysis results for test {test_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error storing analysis results: {e}", exc_info=True)
            db.session.rollback()
            return False

    def _process_job_with_context(self, job: Dict):
        """Process job with database context"""
        try:
            job['status'] = 'processing'
            job['progress'] = 10
            
            # Filter valid image paths
            valid_paths = [p for p in job['image_paths'] if os.path.exists(p)]
            logger.info(f"Processing {len(valid_paths)} valid images out of {len(job['image_paths'])} total")
            
            if not valid_paths:
                logger.error("No valid image paths found")
                job['status'] = 'failed'
                job['error'] = 'No valid image paths'
                return
            
            job['progress'] = 20
            
            # Process each image
            all_results = []
            for i, image_path in enumerate(valid_paths):
                logger.info(f"Processing image {i+1}/{len(valid_paths)}: {image_path}")
                
                result, error = self.detector.detectAndQuantify(image_path)
                
                if error:
                    logger.error(f"Error processing {image_path}: {error}")
                    continue
                
                # Add metadata to result
                result['imagePath'] = image_path
                result['originalFilename'] = os.path.basename(image_path)
                result['imageQuality'] = 1.0  # Default quality
                
                all_results.append(result)
                
                # Update progress
                progress_percent = 20 + ((i + 1) / len(valid_paths)) * 60
                job['progress'] = int(progress_percent)
                logger.info(f"Progress: {job['progress']}%")
            
            if not all_results:
                logger.error("No images were successfully processed")
                job['status'] = 'failed'
                job['error'] = 'No images processed successfully'
                return
            
            job['progress'] = 80
            
            # Store results in database
            logger.info(f"Storing {len(all_results)} results in database")
            success = self._store_analysis_results(job['test_id'], all_results)
            
            if success:
                job['status'] = 'completed'
                job['progress'] = 100
                logger.info(f"Job completed successfully: {job['session_id']}")
            else:
                job['status'] = 'failed'
                job['error'] = 'Failed to store results'
                logger.error(f"Failed to store results for job: {job['session_id']}")
                
        except Exception as e:
            logger.error(f"Error processing job: {e}", exc_info=True)
            job['status'] = 'failed'
            job['error'] = str(e)

# Create singleton instance
ai_service = AIAnalysisService()