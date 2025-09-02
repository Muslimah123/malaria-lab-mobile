import os
import logging
from werkzeug.utils import secure_filename
from flask import request, jsonify
from typing import Dict, List, Tuple
import re

logger = logging.getLogger(__name__)

class FileUploadValidator:
    """File upload validation middleware for Flask - Security and format validation only"""
    
    # Environment variables with defaults
    MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE', 10 * 1024 * 1024))  # 10MB
    MAX_FILES_PER_REQUEST = int(os.getenv('MAX_FILES_PER_REQUEST', 20))
    MAX_CONCURRENT_UPLOADS = int(os.getenv('MAX_CONCURRENT_UPLOADS', 5))
    MIN_FILE_SIZE = 1024  # 1KB minimum
    
    # Allowed MIME types and extensions
    ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/tiff',
        'image/tif'
    ]
    
    ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.tiff', '.tif']
    
    # File signature validation (magic numbers)
    FILE_SIGNATURES = {
        'jpeg': [0xFF, 0xD8, 0xFF],
        'png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
        'tiff': [0x49, 0x49, 0x2A, 0x00],  # Little-endian TIFF
        'tiff_be': [0x4D, 0x4D, 0x00, 0x2A]  # Big-endian TIFF
    }
    
    def __init__(self):
        self.validation_errors = []
        self.validation_warnings = []
        self.file_metadata = {}
    
    def validate_upload_request(self, files) -> Tuple[bool, Dict, List[str], List[str]]:
        """
        Validate file upload request - Security and format validation only
        
        Args:
            files: Flask file storage object
            
        Returns:
            Tuple of (is_valid, metadata, errors, warnings)
        """
        self.validation_errors = []
        self.validation_warnings = []
        self.file_metadata = {}
        
        try:
            # Check file count
            if len(files) > self.MAX_FILES_PER_REQUEST:
                self.validation_errors.append(f"Too many files: {len(files)} (maximum: {self.MAX_FILES_PER_REQUEST})")
                return False, {}, self.validation_errors, self.validation_warnings
            
            # Validate each file
            for file in files:
                if file.filename:
                    is_valid, metadata, errors, warnings = self.validate_individual_file(file)
                    
                    if not is_valid:
                        self.validation_errors.extend([f"{file.filename}: {error}" for error in errors])
                    
                    if warnings:
                        self.validation_warnings.extend([f"{file.filename}: {warning}" for warning in warnings])
                    
                    if metadata:
                        self.file_metadata[file.filename] = metadata
            
            return len(self.validation_errors) == 0, self.file_metadata, self.validation_errors, self.validation_warnings
            
        except Exception as e:
            logger.error(f"File validation failed: {str(e)}")
            self.validation_errors.append(f"Validation error: {str(e)}")
            return False, {}, self.validation_errors, self.validation_warnings
    
    def validate_individual_file(self, file) -> Tuple[bool, Dict, List[str], List[str]]:
        """Validate individual file - Security and format validation only"""
        errors = []
        warnings = []
        metadata = {}
        
        try:
            # Check filename security
            if not self.is_filename_secure(file.filename):
                errors.append("Filename contains dangerous characters or is too long")
                return False, {}, errors, warnings
            
            # Check file extension
            if not self.has_allowed_extension(file.filename):
                errors.append(f"Invalid file extension. Allowed: {', '.join(self.ALLOWED_EXTENSIONS)}")
                return False, {}, errors, warnings
            
            # Check file size
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)
            
            if file_size < self.MIN_FILE_SIZE:
                errors.append(f"File too small: {file_size} bytes (minimum: {self.MIN_FILE_SIZE} bytes)")
            
            if file_size > self.MAX_FILE_SIZE:
                errors.append(f"File too large: {file_size} bytes (maximum: {self.MAX_FILE_SIZE})")
            
            # Store basic metadata
            metadata['size'] = file_size
            metadata['filename'] = file.filename
            
            # Read file content for signature validation
            file_content = file.read()
            file.seek(0)  # Reset file pointer
            
            # File signature validation (magic numbers)
            signature_valid = self.validate_file_signature(file_content)
            if not signature_valid['is_valid']:
                errors.append(f"Invalid file signature: {signature_valid['error']}")
            else:
                metadata['format'] = signature_valid['format']
            
            # Basic malware check
            malware_check = self.basic_malware_check(file_content)
            if not malware_check['is_clean']:
                warnings.append(f"Potential security concern: {malware_check['warning']}")
            
            return len(errors) == 0, metadata, errors, warnings
            
        except Exception as e:
            errors.append(f"Validation error: {str(e)}")
            return False, {}, errors, warnings
    
    def validate_file_signature(self, file_content: bytes) -> Dict:
        """Validate file signature (magic numbers)"""
        try:
            if len(file_content) < 8:
                return {'is_valid': False, 'error': 'File too small to validate signature'}
            
            header = list(file_content[:8])
            
            # Check JPEG
            if header[:3] == self.FILE_SIGNATURES['jpeg']:
                # Check for JPEG end marker
                end_marker = list(file_content[-2:])
                if end_marker == [0xFF, 0xD9]:
                    return {'is_valid': True, 'format': 'jpeg'}
            
            # Check PNG
            if header == self.FILE_SIGNATURES['png']:
                return {'is_valid': True, 'format': 'png'}
            
            # Check TIFF (both endianness)
            if (header[:4] == self.FILE_SIGNATURES['tiff'] or 
                header[:4] == self.FILE_SIGNATURES['tiff_be']):
                return {'is_valid': True, 'format': 'tiff'}
            
            return {'is_valid': False, 'error': 'Unrecognized file signature'}
            
        except Exception as e:
            return {'is_valid': False, 'error': f'Signature validation error: {str(e)}'}
    
    def basic_malware_check(self, file_content: bytes) -> Dict:
        """Basic malware detection"""
        try:
            suspicious_patterns = [
                # Check for executable patterns
                [0x4D, 0x5A],  # MZ header (Windows executable)
                [0x7F, 0x45, 0x4C, 0x46],  # ELF header (Linux executable)
                [0xFE, 0xED, 0xFA, 0xCE],  # Mach-O header (macOS executable)
            ]
            
            for pattern in suspicious_patterns:
                for i in range(len(file_content) - len(pattern) + 1):
                    if list(file_content[i:i+len(pattern)]) == pattern:
                        return {'is_clean': False, 'warning': 'Suspicious executable pattern detected'}
            
            # Check for script injection patterns
            content_str = file_content[:1000].decode('ascii', errors='ignore')
            if any(pattern in content_str for pattern in ['<?php', '<script', 'javascript:']):
                return {'is_clean': False, 'warning': 'Suspicious script content detected'}
            
            return {'is_clean': True, 'warning': None}
            
        except Exception as e:
            return {'is_clean': True, 'warning': f'Malware check error: {str(e)}'}
    
    def is_filename_secure(self, filename: str) -> bool:
        """Check if filename is secure"""
        if not filename or len(filename) > 255:
            return False
        
        # Check for dangerous characters
        dangerous_chars = r'[<>:"/\\|?*\x00-\x1f]'
        if re.search(dangerous_chars, filename):
            return False
        
        # Check for reserved names (Windows)
        reserved_names = r'^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)'
        if re.search(reserved_names, filename, re.IGNORECASE):
            return False
        
        # Check for double extensions
        double_ext = r'\.\w+\.\w+$'
        if re.search(double_ext, filename):
            return False
        
        return True
    
    def has_allowed_extension(self, filename: str) -> bool:
        """Check if file has allowed extension"""
        if not filename:
            return False
        
        ext = os.path.splitext(filename.lower())[1]
        return ext in self.ALLOWED_EXTENSIONS

# Flask middleware decorator
def validate_file_upload(f):
    """Decorator to validate file uploads"""
    def decorated_function(*args, **kwargs):
        try:
            # Check if files are present
            if 'images' not in request.files:
                return jsonify({'error': 'No files provided'}), 400
            
            files = request.files.getlist('images')
            if not files or all(not file.filename for file in files):
                return jsonify({'error': 'No files selected'}), 400
            
            # Validate files
            validator = FileUploadValidator()
            is_valid, metadata, errors, warnings = validator.validate_upload_request(files)
            
            if not is_valid:
                return jsonify({
                    'error': 'File validation failed',
                    'details': errors,
                    'warnings': warnings
                }), 400
            
            # Add validation results to request
            request.file_validation = {
                'isValid': is_valid,
                'metadata': metadata,
                'warnings': warnings
            }
            
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f"File upload validation error: {str(e)}")
            return jsonify({'error': 'File validation error', 'message': str(e)}), 500
    
    decorated_function.__name__ = f.__name__
    return decorated_function

# Utility functions
def save_uploaded_file(file, upload_dir: str, filename: str = None) -> str:
    """Save uploaded file to disk"""
    try:
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
        
        if not filename:
            filename = secure_filename(file.filename)
        
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)
        
        return file_path
        
    except Exception as e:
        logger.error(f"Failed to save file: {str(e)}")
        raise

def cleanup_temp_files(file_paths: List[str]):
    """Clean up temporary files"""
    for file_path in file_paths:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            logger.warning(f"Failed to cleanup file {file_path}: {str(e)}")
