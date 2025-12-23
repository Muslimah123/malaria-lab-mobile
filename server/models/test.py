from datetime import datetime
import uuid

from . import db

class Test(db.Model):
    __tablename__ = 'tests'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    test_id = db.Column(db.String(50), unique=True, nullable=False, index=True)  # TEST-YYYYMMDD-XXX
    patient_id = db.Column(db.String(36), db.ForeignKey('patients.id'), nullable=False)
    test_type = db.Column(db.String(50), default='malaria_detection', nullable=False)
    status = db.Column(db.String(20), default='pending', nullable=False)  # pending, uploaded, processing, completed, failed, cancelled
    priority = db.Column(db.String(20), default='normal', nullable=False)  # low, normal, high, urgent
    sample_type = db.Column(db.String(20), nullable=False)  # blood_smear, thick_smear, thin_smear
    sample_collection_date = db.Column(db.DateTime, nullable=False)
    sample_collected_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    # Images as JSON array
    images = db.Column(db.JSON, default=[])  # Array of image objects
    
    processed_at = db.Column(db.DateTime)
    processing_time = db.Column(db.Float)  # in seconds
    
    # Foreign Keys
    technician_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    reviewed_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    reviewed_at = db.Column(db.DateTime)
    
    # User tracking for audit trail
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    updated_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    
    # Clinical notes as JSON
    clinical_notes = db.Column(db.JSON, default={
        'symptoms': [],
        'duration': '',
        'severity': '',
        'previousTreatment': '',
        'additionalNotes': ''
    })
    
    quality_score = db.Column(db.Float)  # 0-100
    
    created_at = db.Column(db.DateTime, default=datetime.now, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    patient = db.relationship('Patient', back_populates='tests', lazy=True)
    technician = db.relationship('User', foreign_keys=[technician_id], lazy=True)
    reviewer = db.relationship('User', foreign_keys=[reviewed_by], lazy=True)
    creator = db.relationship('User', foreign_keys=[created_by], lazy=True)
    updater = db.relationship('User', foreign_keys=[updated_by], lazy=True)
    diagnosis_result = db.relationship('DiagnosisResult', back_populates='test', uselist=False, lazy=True)
    upload_session = db.relationship('UploadSession', back_populates='test', uselist=False, lazy=True)
    
    def __init__(self, **kwargs):
        super(Test, self).__init__(**kwargs)
        if not self.test_id:
            self.test_id = self.generate_test_id()
    
    def ensure_unique_test_id(self):
        """Ensure the test_id is unique, regenerate if necessary"""
        max_attempts = 10
        attempts = 0
        
        while attempts < max_attempts:
            # Check if this test_id already exists
            existing_test = Test.query.filter_by(test_id=self.test_id).first()
            if existing_test and existing_test.id != self.id:
                # Regenerate test_id
                self.test_id = self.generate_test_id()
                attempts += 1
            else:
                break
        
        if attempts >= max_attempts:
            raise ValueError(f"Could not generate unique test_id after {max_attempts} attempts")
    
    @staticmethod
    def get_or_create_test_for_patient(patient_id, user_id, test_data):
        """Get existing pending test or create new one to prevent duplicates"""
        from datetime import timedelta
        
        # Check for existing pending test within last 5 minutes
        recent_time = datetime.utcnow() - timedelta(minutes=5)
        
        existing_test = Test.query.filter(
            Test.patient_id == patient_id,
            Test.status == 'pending',
            Test.created_at >= recent_time,
            Test.created_by == user_id
        ).first()
        
        if existing_test:
            return existing_test, False  # Return existing test, not created
        
        # Create new test
        new_test = Test(
            patient_id=patient_id,
            sample_type=test_data['sampleType'],
            sample_collection_date=test_data['sampleCollectionDate'],
            sample_collected_by=user_id,
            technician_id=user_id,
            created_by=user_id,
            priority=test_data.get('priority', 'normal'),
            test_type=test_data.get('testType', 'malaria_detection')
        )
        
        # Set clinical notes if provided
        if 'clinicalNotes' in test_data:
            new_test.set_clinical_notes(
                symptoms=test_data['clinicalNotes'].get('symptoms', []),
                duration=test_data['clinicalNotes'].get('duration', ''),
                severity=test_data['clinicalNotes'].get('severity', ''),
                previous_treatment=test_data['clinicalNotes'].get('previousTreatment', ''),
                additional_notes=test_data['clinicalNotes'].get('additionalNotes', '')
            )
        
        # Ensure unique test_id
        new_test.ensure_unique_test_id()
        
        return new_test, True  # Return new test, created
    
    def generate_test_id(self):
        """Generate a unique test ID in format TEST-YYYYMMDD-XXX"""
        today = datetime.now()
        date_str = today.strftime('%Y%m%d')
        
        # Find the highest number for today to avoid conflicts
        existing_tests = Test.query.filter(
            Test.test_id.like(f'TEST-{date_str}-%')
        ).all()
        
        if not existing_tests:
            return f'TEST-{date_str}-001'
        
        # Extract numbers from existing test IDs and find the highest
        numbers = []
        for test in existing_tests:
            try:
                if test.test_id and '-' in test.test_id:
                    num_part = test.test_id.split('-')[-1]
                    if num_part.isdigit():
                        numbers.append(int(num_part))
            except (ValueError, IndexError):
                continue
        
        if not numbers:
            return f'TEST-{date_str}-001'
        
        next_number = max(numbers) + 1
        return f'TEST-{date_str}-{next_number:03d}'
    
    def add_image(self, filename, original_name, path, size, mimetype):
        """Add an image to the test"""
        # Initialize images if it's None
        if self.images is None:
            self.images = []
        
        image_data = {
            'filename': filename,
            'originalName': original_name,
            'path': path,
            'size': size,
            'mimetype': mimetype,
            'uploadedAt': datetime.utcnow().isoformat()
        }
        
        self.images.append(image_data)
    
    def update_status(self, new_status):
        """Update test status and set timestamps"""
        self.status = new_status
        
        if new_status == 'processing':
            self.processed_at = datetime.now()
        elif new_status == 'completed':
            if self.processed_at is not None:
                self.processing_time = (datetime.now() - self.processed_at).total_seconds()
    
    def set_clinical_notes(self, symptoms=None, duration=None, severity=None, previous_treatment=None, additional_notes=None):
        """Set clinical notes for the test"""
        # Initialize clinical_notes if it's None
        if self.clinical_notes is None:
            self.clinical_notes = {
                'symptoms': [],
                'duration': '',
                'severity': '',
                'previousTreatment': '',
                'additionalNotes': ''
            }
        
        if symptoms is not None:
            self.clinical_notes['symptoms'] = symptoms
        if duration is not None:
            self.clinical_notes['duration'] = duration
        if severity is not None:
            self.clinical_notes['severity'] = severity
        if previous_treatment is not None:
            self.clinical_notes['previousTreatment'] = previous_treatment
        if additional_notes is not None:
            self.clinical_notes['additionalNotes'] = additional_notes
    
    def calculate_quality_score(self):
        """Calculate quality score based on various factors"""
        score = 100.0
        
        # Deduct points for missing information
        if not self.clinical_notes or not self.clinical_notes.get('symptoms'):
            score -= 10
        if not self.clinical_notes or not self.clinical_notes.get('duration'):
            score -= 5
        if not self.images:
            score -= 20
        elif len(self.images) < 2:
            score -= 10
        
        # Deduct points for poor image quality (if we have image metadata)
        if self.images:
            for image in self.images:
                if 'imageMetadata' in image:
                    metadata = image['imageMetadata']
                    if metadata.get('width', 0) < 800 or metadata.get('height', 0) < 600:
                        score -= 5
                    if metadata.get('fileSize', 0) < 50000:  # Less than 50KB
                        score -= 5
        
        self.quality_score = max(0, score)
        return self.quality_score
    
    def to_dict(self):
        """Convert test object to dictionary"""
        return {
            'id': self.id,
            'testId': self.test_id,
            'patientId': self.patient_id,
            'patient': self.patient.to_dict_summary() if hasattr(self, 'patient') and self.patient else None,
            'testType': self.test_type,
            'status': self.status,
            'priority': self.priority,
            'sampleType': self.sample_type,
            'sampleCollectionDate': self.sample_collection_date.isoformat() if self.sample_collection_date is not None else None,
            'sampleCollectedBy': self.sample_collected_by,
            'images': self.images if self.images is not None else [],
            'processedAt': self.processed_at.isoformat() if self.processed_at is not None else None,
            'processingTime': self.processing_time if self.processing_time is not None else 0,
            'technician': self.technician.to_dict_public() if hasattr(self, 'technician') and self.technician else None,
            'reviewedBy': self.reviewer.to_dict_public() if hasattr(self, 'reviewer') and self.reviewer else None,
            'reviewedAt': self.reviewed_at.isoformat() if self.reviewed_at is not None else None,
            'createdBy': self.creator.to_dict_public() if hasattr(self, 'creator') and self.creator else None,
            'updatedBy': self.updater.to_dict_public() if hasattr(self, 'updater') and self.updater else None,
            'clinicalNotes': self.clinical_notes if self.clinical_notes is not None else {},
            'qualityScore': self.quality_score if self.quality_score is not None else 0,
            'createdAt': self.created_at.isoformat() if self.created_at is not None else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at is not None else None
        }
    
    def to_dict_summary(self):
        """Convert test object to summary dictionary (for lists)"""
        return {
            'id': self.id,
            'testId': self.test_id,
            'patientId': self.patient_id,
            'patient': self.patient.to_dict_summary() if hasattr(self, 'patient') and self.patient else None,
            'status': self.status,
            'priority': self.priority,
            'sampleType': self.sample_type,
            'sampleCollectionDate': self.sample_collection_date.isoformat() if self.sample_collection_date is not None else None,
            'technician': self.technician.to_dict_public() if hasattr(self, 'technician') and self.technician else None,
            'qualityScore': self.quality_score if self.quality_score is not None else 0,
            'createdAt': self.created_at.isoformat() if self.created_at is not None else None
        }
    
    @staticmethod
    def get_tests_by_status(status, limit=50):
        """Get tests by status"""
        return Test.query.filter_by(status=status).order_by(Test.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def get_tests_by_patient(patient_id, limit=50):
        """Get all tests for a specific patient"""
        return Test.query.filter_by(patient_id=patient_id).order_by(Test.created_at.desc()).limit(limit).all()
    
    def get_test_with_patient(self):
        """Get test with patient details"""
        return {
            'test': self.to_dict(),
            'patient': self.patient.to_dict_summary() if hasattr(self, 'patient') and self.patient else None
        }
    
    def __repr__(self):
        return f'<Test {self.test_id}: {self.status}>'
