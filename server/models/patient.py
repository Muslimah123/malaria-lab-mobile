from datetime import datetime
import uuid

from . import db

class Patient(db.Model):
    __tablename__ = 'patients'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = db.Column(db.String(50), unique=True, nullable=False, index=True)  # PAT-YYYYMMDD-XXX
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    date_of_birth = db.Column(db.Date)
    gender = db.Column(db.String(10), default='unknown')  # male, female, other, unknown
    age = db.Column(db.Integer)
    phone_number = db.Column(db.String(20))
    email = db.Column(db.String(120))
    
    # Test statistics
    total_tests = db.Column(db.Integer, default=0)
    positive_tests = db.Column(db.Integer, default=0)
    last_test_date = db.Column(db.DateTime)
    last_test_result = db.Column(db.String(20))
    
    # User tracking for audit trail
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    updated_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tests = db.relationship('Test', back_populates='patient', lazy=True, cascade='all, delete-orphan')
    creator = db.relationship('User', foreign_keys=[created_by], lazy=True)
    updater = db.relationship('User', foreign_keys=[updated_by], lazy=True)
    
    def __init__(self, **kwargs):
        super(Patient, self).__init__(**kwargs)
        if not self.patient_id:
            self.patient_id = self.generate_patient_id()
        if self.date_of_birth:
            self.calculate_age()
    
    def generate_patient_id(self):
        """Generate a unique patient ID in format PAT-YYYYMMDD-XXX"""
        today = datetime.now()
        date_str = today.strftime('%Y%m%d')
        
        # Find the next available number for today
        existing_patients = Patient.query.filter(
            Patient.patient_id.like(f'PAT-{date_str}-%')
        ).count()
        
        return f'PAT-{date_str}-{existing_patients + 1:03d}'
    
    def calculate_age(self):
        """Calculate age from date of birth"""
        if self.date_of_birth:
            today = datetime.now().date()
            self.age = today.year - self.date_of_birth.year - (
                (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
            )
    
    def update_test_statistics(self):
        """Update test statistics based on current tests"""
        from .test import Test
        
        tests = Test.query.filter_by(patient_id=self.id).all()
        self.total_tests = len(tests)
        self.positive_tests = len([t for t in tests if t.status == 'completed' and hasattr(t, 'diagnosis_result') and t.diagnosis_result and t.diagnosis_result.status == 'POSITIVE'])
        
        if tests:
            latest_test = max(tests, key=lambda t: t.created_at if t.created_at is not None else datetime.min)
            self.last_test_date = latest_test.created_at
            if hasattr(latest_test, 'diagnosis_result') and latest_test.diagnosis_result:
                self.last_test_result = latest_test.diagnosis_result.status
    
    def to_dict(self):
        """Convert patient object to dictionary"""
        return {
            'id': self.id,
            'patientId': self.patient_id,
            'firstName': self.first_name,
            'lastName': self.last_name,
            'dateOfBirth': self.date_of_birth.isoformat() if self.date_of_birth is not None else None,
            'gender': self.gender,
            'age': self.age,
            'phoneNumber': self.phone_number,
            'email': self.email,
            'totalTests': self.total_tests,
            'positiveTests': self.positive_tests,
            'lastTestDate': self.last_test_date.isoformat() if self.last_test_date else None,
            'lastTestResult': self.last_test_result,
            'tests': [test.to_dict_summary() for test in self.tests] if hasattr(self, 'tests') and self.tests else [],
            'createdBy': self.creator.to_dict_public() if hasattr(self, 'creator') and self.creator else None,
            'updatedBy': self.updater.to_dict_public() if hasattr(self, 'updater') and self.updater else None,
            'createdAt': self.created_at.isoformat() if self.created_at is not None else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at is not None else None
        }
    
    def to_dict_summary(self):
        """Convert patient object to summary dictionary (for lists)"""
        return {
            'id': self.id,
            'patientId': self.patient_id,
            'firstName': self.first_name,
            'lastName': self.last_name,
            'dateOfBirth': self.date_of_birth.isoformat() if self.date_of_birth is not None else None,
            'age': self.age,
            'gender': self.gender,
            'phoneNumber': self.phone_number,
            'email': self.email,
            'totalTests': self.total_tests,
            'positiveTests': self.positive_tests,
            'lastTestDate': self.last_test_date.isoformat() if self.last_test_date is not None else None,
            'lastTestResult': self.last_test_result,
            'createdAt': self.created_at.isoformat() if self.created_at is not None else None
        }
    
    @staticmethod
    def search_patients(query, limit=20):
        """Search patients by name, ID, or phone number"""
        search_term = f'%{query}%'
        
        return Patient.query.filter(
            db.or_(
                Patient.patient_id.like(search_term),
                Patient.first_name.like(search_term),
                Patient.last_name.like(search_term),
                Patient.phone_number.like(search_term)
            )
        ).limit(limit).all()
    
    def get_patient_with_tests(self):
        """Get patient with all associated tests"""
        return {
            'patient': self.to_dict(),
            'tests': [test.to_dict_summary() for test in self.tests] if hasattr(self, 'tests') and self.tests else [],
            'totalTests': len(self.tests) if hasattr(self, 'tests') and self.tests else 0
        }
    
    def __repr__(self):
        return f'<Patient {self.patient_id}: {self.first_name} {self.last_name}>'
