from datetime import datetime
import uuid

from . import db

class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Action Information
    action = db.Column(db.String(100), nullable=False, index=True)
    status = db.Column(db.String(20), default='success', nullable=False)  # success, failed, pending
    risk_level = db.Column(db.String(20), default='low', nullable=False)  # low, medium, high, critical
    
    # User Information
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    user_info = db.Column(db.JSON, nullable=False)  # {username, email, role, permissions}
    
    # Resource Information
    resource_type = db.Column(db.String(50), nullable=False)  # patient, test, upload, diagnosis, etc.
    resource_id = db.Column(db.String(100))  # ID of the affected resource
    resource_name = db.Column(db.String(255))  # Human-readable description
    
    # Action Details
    details = db.Column(db.JSON)  # Specific data about what was done
    
    # Request Context
    request_info = db.Column(db.JSON, nullable=False)  # {ipAddress, userAgent, method, endpoint}
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', backref='activity_logs', lazy=True)
    
    # Valid actions list
    VALID_ACTIONS = [
        # Authentication
        'login', 'logout', 'failed_login', 'password_change',
        # User management
        'user_created', 'user_updated', 'user_deleted', 'user_activated', 'user_deactivated',
        # Patient management
        'patient_created', 'patient_updated', 'patient_deleted', 'patient_viewed',
        # Test operations
        'test_created', 'test_updated', 'test_deleted', 'test_started', 'test_completed', 'test_cancelled',
        # Sample operations
        'sample_uploaded', 'sample_deleted', 'sample_downloaded', 'upload',
        # Diagnosis operations
        'diagnosis_completed', 'diagnosis_reviewed', 'diagnosis_overridden', 'diagnosis_viewed',
        # Report operations
        'report_generated', 'report_exported', 'report_printed', 'report_shared',
        # Integration operations
        'data_exported_to_hospital', 'api_call_made', 'integration_failed',
        # System operations
        'system_backup', 'system_maintenance', 'database_cleanup',
        # Security events
        'unauthorized_access_attempt', 'data_breach_detected', 'suspicious_activity',
        # Custom upload session events
        'upload_session_created', 'files_uploaded', 'socket_disconnected'
    ]
    
    def __init__(self, **kwargs):
        super(ActivityLog, self).__init__(**kwargs)
        
        # Validate action
        if self.action not in self.VALID_ACTIONS:
            raise ValueError(f'Invalid action: {self.action}')
    
    def to_dict(self):
        """Convert activity log to dictionary"""
        return {
            'id': self.id,
            'action': self.action,
            'status': self.status,
            'riskLevel': self.risk_level,
            'userId': self.user_id,
            'userInfo': self.user_info,
            'resourceType': self.resource_type,
            'resourceId': self.resource_id,
            'resourceName': self.resource_name,
            'details': self.details,
            'requestInfo': self.request_info,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
    
    @staticmethod
    def log_activity(action, user_id, user_info, resource_type, resource_id=None, 
                    resource_name=None, details=None, request_info=None, 
                    status='success', risk_level='low'):
        """Static method to create and save an activity log"""
        try:
            log = ActivityLog(
                action=action,
                user_id=user_id,
                user_info=user_info,
                resource_type=resource_type,
                resource_id=resource_id,
                resource_name=resource_name,
                details=details,
                request_info=request_info,
                status=status,
                risk_level=risk_level
            )
            
            db.session.add(log)
            db.session.commit()
            return log
            
        except Exception as e:
            db.session.rollback()
            print(f"Error logging activity: {e}")
            return None
    
    @staticmethod
    def get_user_activities(user_id, limit=50):
        """Get all activities for a specific user"""
        return ActivityLog.query.filter_by(user_id=user_id)\
            .order_by(ActivityLog.created_at.desc())\
            .limit(limit).all()
    
    @staticmethod
    def get_resource_activities(resource_type, resource_id, limit=50):
        """Get all activities for a specific resource"""
        return ActivityLog.query.filter_by(
            resource_type=resource_type, 
            resource_id=resource_id
        ).order_by(ActivityLog.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def get_activities_by_action(action, limit=50):
        """Get all activities of a specific type"""
        return ActivityLog.query.filter_by(action=action)\
            .order_by(ActivityLog.created_at.desc())\
            .limit(limit).all()
    
    def __repr__(self):
        return f'<ActivityLog {self.action} by {self.user_info.get("username", "unknown")} on {self.resource_type}>'
