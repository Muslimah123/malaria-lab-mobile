
from ultralytics import YOLO
import logging
import os
from typing import Tuple, Dict, Optional, List

logger = logging.getLogger(__name__)

class MalariaDetector:
    def __init__(self, model_path: str = "best.pt"):
        """Initialize the YOLO model for malaria detection."""
        try:
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Model file not found at {model_path}")
            self.model = YOLO(model_path)
            
            
            self.valid_parasite_types = {'PF', 'PM', 'PO', 'PV'}
            self.valid_wbc_types = {'WBC', 'wbc'}  # Handle case variations
            
            logger.info(f"Successfully loaded YOLO model from {model_path}")
            logger.info(f"Valid parasite types: {self.valid_parasite_types}")
            logger.info(f"Valid WBC types: {self.valid_wbc_types}")
            
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {str(e)}")
            raise RuntimeError(f"Model initialization failed: {str(e)}")

    def detectAndQuantify(self, image_path: str, confidence_threshold: float = 0.26) -> Tuple[Optional[Dict], Optional[str]]:
        """Detect parasites and WBCs in a single image."""
        try:
            if not os.path.exists(image_path):
                raise FileNotFoundError(f"Image not found at {image_path}")
            
            logger.info(f"Starting detection for image: {image_path} with confidence threshold: {confidence_threshold}")
            
            try:
                # Method 1: Standard inference
                results = self.model([image_path])
            except AttributeError as e:
                if "'AAttn' object has no attribute 'qkv'" in str(e):
                    logger.warning("Standard inference failed, trying alternative method...")
                    try:
                        # Method 2: Use predict method with specific parameters
                        results = self.model.predict(image_path, conf=confidence_threshold, verbose=False)
                    except Exception as e2:
                        logger.warning(f"Alternative method failed: {e2}")
                        # Method 3: Try with device specification
                        results = self.model.predict(image_path, conf=confidence_threshold, device='cpu', verbose=False)
                else:
                    raise e
            
            parasites_detected: List[Dict] = []
            wbcs_detected: List[Dict] = []  # Separate array for WBCs
            wbc_count: int = 0
            
            # Debug: Count all detections before filtering
            total_detections = 0
            filtered_detections = 0

            for result in results:
                boxes = result.boxes.data.tolist()
                class_names = result.names
                logger.info(f"Raw YOLO detections for {image_path}: {len(boxes)} total boxes")
                logger.info(f"Model class names: {class_names}")
                
                for box in boxes:
                    x_min, y_min, x_max, y_max, confidence, class_id = box
                    class_name = class_names[int(class_id)]
                    total_detections += 1
                    
                    logger.info(f"Detection: {class_name} with confidence {confidence:.3f} (threshold: {confidence_threshold})")
                    
                    if confidence < confidence_threshold:
                        logger.info(f"FILTERED OUT: {class_name} confidence {confidence:.3f} below threshold {confidence_threshold}")
                        continue
                    
                    filtered_detections += 1
                    
                    # Create detection data structure
                    detection_data = {
                        "type": class_name,
                        "confidence": confidence,
                        "bbox": [x_min, y_min, x_max, y_max]
                    }
                    
                    # ✅ ROBUST CLASSIFICATION: Check what type this detection actually is
                    class_name_upper = class_name.upper()
                    
                    if class_name.lower() in ['wbc'] or class_name_upper in ['WBC']:
                        # This is a WBC (White Blood Cell)
                        wbc_count += 1
                        # Normalize the type to uppercase for consistency
                        detection_data["type"] = "WBC"  
                        wbcs_detected.append(detection_data)
                        logger.info(f"COUNTED WBC: Total WBCs now: {wbc_count}")
                        
                    elif class_name_upper in self.valid_parasite_types:
                        # This is an actual parasite
                        # Normalize to uppercase for consistency
                        detection_data["type"] = class_name_upper
                        parasites_detected.append(detection_data)
                        logger.info(f"COUNTED PARASITE: {class_name_upper} (confidence: {confidence:.3f}). Total parasites now: {len(parasites_detected)}")
                        
                    else:
                        # ⚠️ UNKNOWN CLASS TYPE - Log as warning
                        logger.warning(f"UNKNOWN CLASS TYPE DETECTED: '{class_name}' - This may need model retraining")
                        logger.warning(f"Expected parasite types: {self.valid_parasite_types}")
                        logger.warning(f"Expected WBC types: {self.valid_wbc_types}")
                        
                        # For now, skip unknown types to prevent classification errors
                        continue

            parasite_count = len(parasites_detected)
            parasite_wbc_ratio = parasite_count / wbc_count if wbc_count > 0 else 0.0

            # Debug summary
            logger.info(f"DETECTION SUMMARY for {image_path}:")
            logger.info(f"- Raw detections: {total_detections}")
            logger.info(f"- After confidence filtering: {filtered_detections}")
            logger.info(f"- Final parasite count: {parasite_count}")
            logger.info(f"- Final WBC count: {wbc_count}")
            logger.info(f"- Parasite/WBC ratio: {parasite_wbc_ratio:.3f}")

            detection_result = {
                "parasitesDetected": parasites_detected,  # ✅ FIXED: Changed to camelCase
                "wbcsDetected": wbcs_detected,  # ✅ FIXED: Changed to camelCase
                "whiteBloodCellsDetected": wbc_count,  # ✅ FIXED: Changed to camelCase
                "parasiteCount": parasite_count,  # ✅ FIXED: Changed to camelCase
                "parasiteWbcRatio": parasite_wbc_ratio  # ✅ FIXED: Changed to camelCase
            }

            # ✅ IMPROVED: Final logging with proper separation
            if parasites_detected:
                # Find most probable PARASITE (not including WBCs!)
                most_probable_parasite = max(parasites_detected, key=lambda x: x["confidence"])
                logger.info(
                    f"Detection completed for {image_path}: {parasite_count} parasites, "
                    f"Most Probable Parasite={most_probable_parasite['type']}, "
                    f"Confidence: {most_probable_parasite['confidence']:.2f}, "
                    f"{wbc_count} WBCs, ratio: {parasite_wbc_ratio:.2f}"
                )
            else:
                logger.info(f"Detection completed for {image_path}: No parasites detected, {wbc_count} WBCs")

            return detection_result, None

        except Exception as e:
            logger.error(f"Error processing image {image_path}: {str(e)}")
            return None, f"Error processing image: {str(e)}"

    def detect_and_quantify(self, image_path: str, confidence_threshold: float = 0.26) -> Tuple[Optional[Dict], Optional[str]]:
        """Alias for detectAndQuantify for backward compatibility."""
        return self.detectAndQuantify(image_path, confidence_threshold)