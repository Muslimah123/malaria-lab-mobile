import os
import logging
from typing import Dict, List, Tuple

logger = logging.getLogger(__name__)

class MalariaImageValidator:
    """Basic image validation for malaria sample images - Security validation only"""
    
    # Basic file size limits
    MIN_FILE_SIZE = 1024  # 1KB minimum
    MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB maximum (for very high-res images)
    
    def __init__(self):
        self.validation_errors = []
        self.image_metadata = {}
    
    def validate_malaria_image(self, image_path: str, original_filename: str) -> Tuple[bool, Dict, List[str]]:
        """
        Basic validation for malaria sample images - Security and format only
        
        Args:
            image_path: Path to the image file
            original_filename: Original filename
            
        Returns:
            Tuple of (is_valid, metadata, errors)
        """
        self.validation_errors = []
        self.image_metadata = {}
        
        try:
            # Basic file validation
            if not self._validate_file_basics(image_path, original_filename):
                return False, {}, self.validation_errors
            
            # Basic image format validation
            if not self._validate_image_format(image_path):
                return False, {}, self.validation_errors
            
            return True, self.image_metadata, []
            
        except Exception as e:
            logger.error(f"Image validation failed for {image_path}: {str(e)}")
            self.validation_errors.append(f"Validation error: {str(e)}")
            return False, {}, self.validation_errors
    
    def _validate_file_basics(self, image_path: str, original_filename: str) -> bool:
        """Validate basic file properties"""
        try:
            # Check if file exists
            if not os.path.exists(image_path):
                self.validation_errors.append("Image file not found")
                return False
            
            # Check file size
            file_size = os.path.getsize(image_path)
            if file_size < self.MIN_FILE_SIZE:
                self.validation_errors.append(f"File too small: {file_size} bytes (minimum: {self.MIN_FILE_SIZE})")
                return False
            
            if file_size > self.MAX_FILE_SIZE:
                self.validation_errors.append(f"File too large: {file_size} bytes (maximum: {self.MAX_FILE_SIZE})")
                return False
            
            # Store metadata
            self.image_metadata['fileSize'] = file_size
            self.image_metadata['filename'] = original_filename
            
            return True
            
        except Exception as e:
            self.validation_errors.append(f"File validation error: {str(e)}")
            return False
    
    def _validate_image_format(self, image_path: str) -> bool:
        """Basic image format validation"""
        try:
            # Check file extension
            _, ext = os.path.splitext(image_path.lower())
            allowed_extensions = ['.jpg', '.jpeg', '.png', '.tiff', '.tif']
            
            if ext not in allowed_extensions:
                self.validation_errors.append(f"Unsupported file format: {ext}")
                return False
            
            # Store format info
            self.image_metadata['format'] = ext[1:]  # Remove the dot
            
            return True
            
        except Exception as e:
            self.validation_errors.append(f"Format validation error: {str(e)}")
            return False
    
    def get_validation_summary(self) -> Dict:
        """Get summary of validation results"""
        return {
            'isValid': len(self.validation_errors) == 0,
            'errors': self.validation_errors,
            'metadata': self.image_metadata
        }

def validate_image_buffer(image_buffer: bytes, filename: str) -> Tuple[bool, Dict, List[str]]:
    """Basic validation for image buffer - Security and format only"""
    try:
        # Check file size
        if len(image_buffer) < 1024:  # 1KB minimum
            return False, {}, ["File too small (minimum 1KB)"]
        
        if len(image_buffer) > 100 * 1024 * 1024:  # 100MB maximum
            return False, {}, ["File too large (maximum 100MB)"]
        
        # Check file extension
        _, ext = os.path.splitext(filename.lower())
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.tiff', '.tif']
        
        if ext not in allowed_extensions:
            return False, {}, [f"Unsupported file format: {ext}"]
        
        # Basic metadata
        metadata = {
            'size': len(image_buffer),
            'filename': filename,
            'format': ext[1:]
        }
        
        return True, metadata, []
        
    except Exception as e:
        logger.error(f"Buffer validation failed: {str(e)}")
        return False, {}, [f"Buffer validation error: {str(e)}"]
