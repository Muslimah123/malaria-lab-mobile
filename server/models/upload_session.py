from datetime import datetime, timedelta
import uuid

from . import db

class UploadSession(db.Model):
    __tablename__ = 'upload_sessions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    test_id = db.Column(db.String(36), db.ForeignKey('tests.id'))
    patient_id = db.Column(db.String(36), db.ForeignKey('patients.id'))
    status = db.Column(db.String(20), default='active', nullable=False)  # active, uploaded, processing, completed, failed, cancelled, expired
    
    # Files as JSON array
    files = db.Column(db.JSON, default=[])  # Array of file objects
    
    # Progress tracking
    total_files = db.Column(db.Integer, default=0)
    uploaded_files = db.Column(db.Integer, default=0)
    failed_files = db.Column(db.Integer, default=0)
    percent_complete = db.Column(db.Float, default=0.0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='upload_sessions', lazy=True)
    test = db.relationship('Test', back_populates='upload_session', uselist=False, lazy=True)
    patient = db.relationship('Patient', backref='upload_sessions', lazy=True)
    
    def __init__(self, **kwargs):
        super(UploadSession, self).__init__(**kwargs)
        if not self.session_id:
            self.session_id = self.generate_session_id()
    
    def generate_session_id(self):
        """Generate a unique session ID in format SESS-YYYYMMDD-XXX"""
        today = datetime.now()
        date_str = today.strftime('%Y%m%d')
        
        # Find the next available number for today
        existing_sessions = UploadSession.query.filter(
            UploadSession.session_id.like(f'SESS-{date_str}-%')
        ).count()
        
        return f'SESS-{date_str}-{existing_sessions + 1:03d}'
    
    def add_file(self, filename, original_name, path, size, mimetype):
        """Add a file to the upload session"""
        if not self.files:
            self.files = []
        
        file_data = {
            'filename': filename,
            'originalName': original_name,
            'path': path,
            'size': size,
            'mimetype': mimetype,
            'uploadedAt': datetime.utcnow().isoformat(),
            'status': 'uploading',
            'errorMessage': None,
            'isValid': True,
            'validationErrors': [],
            'imageMetadata': {
                'width': 0,
                'height': 0,
                'format': '',
                'quality': 0,
                'fileSize': size
            }
        }
        
        self.files.append(file_data)
        self.total_files = len(self.files)
        self.update_progress()
    
    def update_file_status(self, filename, status, error_message=None, validation_errors=None):
        """Update the status of a specific file"""
        for file_data in self.files:
            if file_data['filename'] == filename:
                file_data['status'] = status
                if error_message:
                    file_data['errorMessage'] = error_message
                if validation_errors:
                    file_data['validationErrors'] = validation_errors
                    file_data['isValid'] = len(validation_errors) == 0
                break
        
        self.update_progress()
    
    def set_file_image_metadata(self, filename, width, height, format_type, quality):
        """Set image metadata for a file"""
        for file_data in self.files:
            if file_data['filename'] == filename:
                file_data['imageMetadata'] = {
                    'width': width,
                    'height': height,
                    'format': format_type,
                    'quality': quality,
                    'fileSize': file_data['size']
                }
                break
    
    def update_progress(self):
        """Update progress statistics"""
        self.uploaded_files = len([f for f in self.files if f['status'] == 'completed'])
        self.failed_files = len([f for f in self.files if f['status'] == 'failed'])
        
        if self.total_files > 0:
            self.percent_complete = (self.uploaded_files / self.total_files) * 100
        else:
            self.percent_complete = 0
        
        # Update session status based on progress
        if self.failed_files == self.total_files and self.total_files > 0:
            self.status = 'failed'
        elif self.uploaded_files == self.total_files and self.total_files > 0:
            self.status = 'completed'
    
    def mark_as_completed(self):
        """Mark the upload session as completed"""
        self.status = 'completed'
        self.updated_at = datetime.utcnow()
    
    def mark_as_failed(self, error_message=None):
        """Mark the upload session as failed"""
        self.status = 'failed'
        if error_message:
            # Add error message to the session
            if not hasattr(self, 'error_message'):
                self.error_message = error_message
        self.updated_at = datetime.utcnow()
    
    def cancel(self):
        """Cancel the upload session"""
        self.status = 'cancelled'
        self.updated_at = datetime.utcnow()
    
    def is_expired(self, expiry_hours=24):
        """Check if the session has expired"""
        if self.status in ['completed', 'failed', 'cancelled']:
            return False
        
        time_diff = datetime.utcnow() - self.created_at
        return time_diff.total_seconds() > (expiry_hours * 3600)
    
    def get_valid_files(self):
        """Get all valid files from the session"""
        return [f for f in self.files if f['isValid'] and f['status'] == 'completed']
    
    def get_failed_files(self):
        """Get all failed files from the session"""
        return [f for f in self.files if f['status'] == 'failed']
    
    def to_dict(self):
        """Convert upload session object to dictionary"""
        return {
            'id': self.id,
            'sessionId': self.session_id,
            'user': self.user.to_dict_public() if self.user else None,
            'test': self.test.to_dict_summary() if self.test else None,
            'testId': self.test_id,
            'patientId': self.patient_id,
            'status': self.status,
            'files': self.files or [],
            'progress': {
                'totalFiles': self.total_files,
                'uploadedFiles': self.uploaded_files,
                'failedFiles': self.failed_files,
                'percentComplete': self.percent_complete
            },
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }
    
    def to_dict_summary(self):
        """Convert upload session object to summary dictionary (for lists)"""
        return {
            'id': self.id,
            'sessionId': self.session_id,
            'status': self.status,
            'totalFiles': self.total_files,
            'uploadedFiles': self.uploaded_files,
            'percentComplete': self.percent_complete,
            'createdAt': self.created_at.isoformat()
        }
    
    @staticmethod
    def get_active_sessions_by_user(user_id, limit=20):
        """Get active upload sessions for a specific user"""
        return UploadSession.query.filter_by(
            user_id=user_id, 
            status='active'
        ).order_by(UploadSession.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def get_sessions_by_status(status, limit=50):
        """Get upload sessions by status"""
        return UploadSession.query.filter_by(status=status).order_by(UploadSession.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def cleanup_expired_sessions(expiry_hours=24):
        """Clean up expired upload sessions"""
        expired_sessions = UploadSession.query.filter(
            UploadSession.status == 'active',
            UploadSession.created_at < datetime.utcnow() - timedelta(hours=expiry_hours)
        ).all()
        
        for session in expired_sessions:
            session.status = 'expired'
            session.updated_at = datetime.utcnow()
        
        db.session.commit()
        return len(expired_sessions)
    
    def __repr__(self):
        return f'<UploadSession {self.session_id}: {self.status}>'
