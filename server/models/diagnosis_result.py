from datetime import datetime
import uuid

from . import db

class DiagnosisResult(db.Model):
    __tablename__ = 'diagnosis_results'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    test_id = db.Column(db.String(36), db.ForeignKey('tests.id'), nullable=False, unique=True)
    status = db.Column(db.String(20), nullable=False)  # POSITIVE, NEGATIVE
    
    # Most probable parasite information
    most_probable_parasite_type = db.Column(db.String(10))  # PF, PM, PO, PV
    most_probable_parasite_confidence = db.Column(db.Float)  # 0-1
    most_probable_parasite_full_name = db.Column(db.String(100))
    
    parasite_wbc_ratio = db.Column(db.Float)
    
    # Detections as JSON array
    detections = db.Column(db.JSON, default=[])  # Array of detection objects
    
    total_parasites = db.Column(db.Integer, default=0)
    total_wbcs = db.Column(db.Integer, default=0)
    
    # Severity information
    severity_level = db.Column(db.String(20))  # low, moderate, high, critical
    severity_score = db.Column(db.Float)  # 0-100
    severity_description = db.Column(db.Text)
    
    confidence = db.Column(db.Float)  # Overall confidence 0-1
    processing_time = db.Column(db.Float)  # in seconds
    model_version = db.Column(db.String(50))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    test = db.relationship('Test', back_populates='diagnosis_result', uselist=False, lazy=True)
    
    def __init__(self, **kwargs):
        super(DiagnosisResult, self).__init__(**kwargs)
    
    def add_detection(self, image_id, original_filename, parasites_detected, wbcs_detected, 
                      white_blood_cells_count, total_parasites, image_quality, annotated_image_url=None):
        """Add a detection result for an image"""
        if not self.detections:
            self.detections = []
        
        detection = {
            'imageId': image_id,
            'originalFilename': original_filename,
            'parasitesDetected': parasites_detected or [],
            'wbcsDetected': wbcs_detected or [],
            'whiteBloodCellsDetected': white_blood_cells_count,
            'totalParasites': total_parasites,
            'imageQuality': image_quality
        }
        if annotated_image_url:
            detection['annotatedImageUrl'] = annotated_image_url
        
        self.detections.append(detection)
        
        # FIXED: Safe aggregation with None handling
        # Initialize totals if they are None
        if self.total_parasites is None:
            self.total_parasites = 0
        if self.total_wbcs is None:
            self.total_wbcs = 0
        
        # Ensure input values are not None
        safe_total_parasites = total_parasites if total_parasites is not None else 0
        safe_white_blood_cells_count = white_blood_cells_count if white_blood_cells_count is not None else 0
        
        # Convert to int to be extra safe
        try:
            safe_total_parasites = int(safe_total_parasites)
            safe_white_blood_cells_count = int(safe_white_blood_cells_count)
        except (ValueError, TypeError):
            safe_total_parasites = 0
            safe_white_blood_cells_count = 0
        
        # Update totals safely
        self.total_parasites += safe_total_parasites
        self.total_wbcs += safe_white_blood_cells_count
    
    def set_most_probable_parasite(self, parasite_type, confidence, full_name):
        """Set the most probable parasite information"""
        self.most_probable_parasite_type = parasite_type
        self.most_probable_parasite_confidence = confidence
        self.most_probable_parasite_full_name = full_name
    
    def calculate_severity(self):
        """Calculate severity based on parasite count and ratio"""
        if self.total_parasites == 0:
            self.severity_level = 'low'
            self.severity_score = 0
            self.severity_description = 'No parasites detected'
            return
        
        # Calculate parasite density (parasites per 100 WBCs)
        if self.total_wbcs > 0:
            parasite_density = (self.total_parasites / self.total_wbcs) * 100
        else:
            parasite_density = 0
        
        # Determine severity based on parasite density
        if parasite_density < 1:
            self.severity_level = 'low'
            self.severity_score = 25
            self.severity_description = 'Low parasite density'
        elif parasite_density < 5:
            self.severity_level = 'moderate'
            self.severity_score = 50
            self.severity_description = 'Moderate parasite density'
        elif parasite_density < 10:
            self.severity_level = 'high'
            self.severity_score = 75
            self.severity_description = 'High parasite density'
        else:
            self.severity_level = 'critical'
            self.severity_score = 100
            self.severity_description = 'Critical parasite density'
    
    def calculate_overall_confidence(self):
        """Overall confidence equals the most probable parasite confidence.
        If no parasites detected, confidence is 0."""
        if self.most_probable_parasite_confidence is not None:
            self.confidence = float(self.most_probable_parasite_confidence)
        else:
            self.confidence = 0
    
    def to_dict(self):
        """Convert diagnosis result object to dictionary"""
        return {
            'id': self.id,
            'test': self.test.to_dict() if self.test else None,
            'testId': self.test_id,
            'status': self.status,
            'mostProbableParasite': {
                'type': self.most_probable_parasite_type,
                'confidence': self.most_probable_parasite_confidence,
                'fullName': self.most_probable_parasite_full_name
            } if self.most_probable_parasite_type else None,
            'parasiteWbcRatio': self.parasite_wbc_ratio,
            'detections': self.detections or [],
            'totalParasites': self.total_parasites,
            'totalWbcs': self.total_wbcs,
            'severity': {
                'level': self.severity_level,
                'score': self.severity_score,
                'description': self.severity_description
            } if self.severity_level else None,
            'confidence': self.confidence,
            'processingTime': self.processing_time,
            'modelVersion': self.model_version,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }
    
    def to_dict_summary(self):
        """Convert diagnosis result object to summary dictionary (for lists)"""
        return {
            'id': self.id,
            'testId': self.test_id,
            'status': self.status,
            'mostProbableParasite': {
                'type': self.most_probable_parasite_type,
                'confidence': self.most_probable_parasite_confidence
            } if self.most_probable_parasite_type else None,
            'totalParasites': self.total_parasites,
            'severity': {
                'level': self.severity_level,
                'score': self.severity_score
            } if self.severity_level else None,
            'confidence': self.confidence,
            'createdAt': self.created_at.isoformat()
        }
    
    @staticmethod
    def get_results_by_status(status, limit=50):
        """Get diagnosis results by status"""
        return DiagnosisResult.query.filter_by(status=status).order_by(DiagnosisResult.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def get_results_by_test(test_id):
        """Get diagnosis result for a specific test"""
        return DiagnosisResult.query.filter_by(test_id=test_id).first()
    
    def __repr__(self):
        return f'<DiagnosisResult {self.id}: {self.status}>'
