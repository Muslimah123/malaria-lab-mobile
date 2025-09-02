from flask import request
from models.activity_log import ActivityLog
from models.user import User

class AuditService:
    """Service for logging user activities and maintaining audit trail"""
    
    @staticmethod
    def get_request_info():
        """Extract request context information"""
        return {
            'ipAddress': request.remote_addr,
            'userAgent': request.headers.get('User-Agent', 'Unknown'),
            'method': request.method,
            'endpoint': request.endpoint or request.path
        }
    
    @staticmethod
    def get_user_info(user):
        """Extract user information for audit trail"""
        if not user:
            return None
            
        return {
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'department': user.department,
            'permissions': user.permissions
        }
    
    @staticmethod
    def log_activity(action, user_id, user_info, resource_type, resource_id=None, 
                    resource_name=None, details=None, status='success', risk_level='low'):
        """Log an activity with comprehensive information"""
        try:
            request_info = AuditService.get_request_info()
            
            log = ActivityLog.log_activity(
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
            
            return log
            
        except Exception as e:
            print(f"Error in audit service: {e}")
            return None
    
    @staticmethod
    def log_patient_activity(action, user, patient, details=None, status='success'):
        """Log patient-related activities"""
        user_info = AuditService.get_user_info(user)
        
        return AuditService.log_activity(
            action=action,
            user_id=user.id,
            user_info=user_info,
            resource_type='patient',
            resource_id=patient.patient_id,
            resource_name=f"Patient {patient.patient_id}: {patient.first_name} {patient.last_name}",
            details=details,
            status=status,
            risk_level='low' if action in ['patient_viewed'] else 'medium'
        )
    
    @staticmethod
    def log_test_activity(action, user, test, details=None, status='success'):
        """Log test-related activities"""
        user_info = AuditService.get_user_info(user)
        
        return AuditService.log_activity(
            action=action,
            user_id=user.id,
            user_info=user_info,
            resource_type='test',
            resource_id=test.test_id,
            resource_name=f"Test {test.test_id} for Patient {test.patient_id}",
            details=details,
            status=status,
            risk_level='low' if action in ['test_viewed'] else 'medium'
        )
    
    @staticmethod
    def log_upload_activity(action, user, upload_session, details=None, status='success'):
        """Log upload-related activities"""
        user_info = AuditService.get_user_info(user)
        
        return AuditService.log_activity(
            action=action,
            user_id=user.id,
            user_info=user_info,
            resource_type='upload',
            resource_id=upload_session.session_id,
            resource_name=f"Upload session {upload_session.session_id}",
            details=details,
            status=status,
            risk_level='medium'
        )
    
    @staticmethod
    def log_diagnosis_activity(action, user, diagnosis_result, details=None, status='success'):
        """Log diagnosis-related activities"""
        user_info = AuditService.get_user_info(user)
        
        return AuditService.log_activity(
            action=action,
            user_id=user.id,
            user_info=user_info,
            resource_type='diagnosis',
            resource_id=diagnosis_result.id,
            resource_name=f"Diagnosis for Test {diagnosis_result.test_id}",
            details=details,
            status=status,
            risk_level='high' if action in ['diagnosis_overridden'] else 'medium'
        )
    
    @staticmethod
    def log_user_activity(action, user, target_user=None, details=None, status='success'):
        """Log user management activities"""
        user_info = AuditService.get_user_info(user)
        
        if target_user:
            resource_name = f"User {target_user.username}"
            resource_id = target_user.id
        else:
            resource_name = f"User {user.username}"
            resource_id = user.id
        
        return AuditService.log_activity(
            action=action,
            user_id=user.id,
            user_info=user_info,
            resource_type='user',
            resource_id=resource_id,
            resource_name=resource_name,
            details=details,
            status=status,
            risk_level='high' if action in ['user_deleted', 'user_deactivated'] else 'medium'
        )
    
    @staticmethod
    def log_auth_activity(action, user, details=None, status='success'):
        """Log authentication activities"""
        user_info = AuditService.get_user_info(user) if user else None
        
        return AuditService.log_activity(
            action=action,
            user_id=user.id if user else None,
            user_info=user_info or {'username': 'unknown', 'email': 'unknown', 'role': 'unknown'},
            resource_type='authentication',
            resource_id=None,
            resource_name=f"Authentication: {action}",
            details=details,
            status=status,
            risk_level='critical' if action in ['failed_login', 'unauthorized_access_attempt'] else 'low'
        )
    
    @staticmethod
    def log_system_activity(action, user, details=None, status='success'):
        """Log system-level activities"""
        user_info = AuditService.get_user_info(user) if user else None
        
        return AuditService.log_activity(
            action=action,
            user_id=user.id if user else None,
            user_info=user_info or {'username': 'system', 'email': 'system', 'role': 'system'},
            resource_type='system',
            resource_id=None,
            resource_name=f"System: {action}",
            details=details,
            status=status,
            risk_level='high' if action in ['system_backup', 'database_cleanup'] else 'medium'
        )
    
    @staticmethod
    def get_user_activity_summary(user_id, days=30):
        """Get activity summary for a user over specified days"""
        from datetime import datetime, timedelta
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        activities = ActivityLog.query.filter(
            ActivityLog.user_id == user_id,
            ActivityLog.created_at >= cutoff_date
        ).order_by(ActivityLog.created_at.desc()).all()
        
        summary = {
            'totalActivities': len(activities),
            'byAction': {},
            'byResource': {},
            'byStatus': {},
            'recentActivities': [activity.to_dict() for activity in activities[:10]]
        }
        
        for activity in activities:
            # Count by action
            action = activity.action
            summary['byAction'][action] = summary['byAction'].get(action, 0) + 1
            
            # Count by resource type
            resource_type = activity.resource_type
            summary['byResource'][resource_type] = summary['byResource'].get(resource_type, 0) + 1
            
            # Count by status
            status = activity.status
            summary['byStatus'][status] = summary['byStatus'].get(status, 0) + 1
        
        return summary
