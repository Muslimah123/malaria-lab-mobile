from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta

from models.activity_log import ActivityLog
from models.user import User
from services.audit_service import AuditService

activity_logs_bp = Blueprint('activity_logs', __name__)

@activity_logs_bp.route('/', methods=['GET'])
@jwt_required()
def get_activity_logs():
    """Get activity logs with filtering and pagination"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.filter_by(id=current_user_id).first()
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user has permission to view logs
        if not current_user.has_permission('canViewAllTests'):  # Using existing permission
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        action = request.args.get('action', '')
        resource_type = request.args.get('resourceType', '')
        user_id = request.args.get('userId', '')
        status = request.args.get('status', '')
        risk_level = request.args.get('riskLevel', '')
        start_date = request.args.get('startDate', '')
        end_date = request.args.get('endDate', '')
        
        # Build query
        query = ActivityLog.query
        
        # Apply filters
        if action:
            query = query.filter_by(action=action)
        if resource_type:
            query = query.filter_by(resource_type=resource_type)
        if user_id:
            query = query.filter_by(user_id=user_id)
        if status:
            query = query.filter_by(status=status)
        if risk_level:
            query = query.filter_by(risk_level=risk_level)
        
        # Date range filter
        if start_date:
            try:
                start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(ActivityLog.created_at >= start_datetime)
            except ValueError:
                return jsonify({'error': 'Invalid startDate format'}), 400
        
        if end_date:
            try:
                end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(ActivityLog.created_at <= end_datetime)
            except ValueError:
                return jsonify({'error': 'Invalid endDate format'}), 400
        
        # Apply pagination
        pagination = query.order_by(ActivityLog.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        logs = pagination.items
        
        return jsonify({
            'logs': [log.to_dict() for log in logs],
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch activity logs', 'details': str(e)}), 500

@activity_logs_bp.route('/user/<user_id>', methods=['GET'])
@jwt_required()
def get_user_activities(user_id):
    """Get all activities for a specific user"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.filter_by(id=current_user_id).first()
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user has permission or is viewing their own activities
        if not current_user.has_permission('canViewAllTests') and current_user_id != user_id:
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        # Get query parameters
        days = request.args.get('days', 30, type=int)
        limit = request.args.get('limit', 50, type=int)
        
        # Get user activities
        activities = ActivityLog.get_user_activities(user_id, limit)
        
        # Get activity summary
        summary = AuditService.get_user_activity_summary(user_id, days)
        
        return jsonify({
            'activities': [activity.to_dict() for activity in activities],
            'summary': summary
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch user activities', 'details': str(e)}), 500

@activity_logs_bp.route('/resource/<resource_type>/<resource_id>', methods=['GET'])
@jwt_required()
def get_resource_activities(resource_type, resource_id):
    """Get all activities for a specific resource"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.filter_by(id=current_user_id).first()
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user has permission
        if not current_user.has_permission('canViewAllTests'):
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        # Get query parameters
        limit = request.args.get('limit', 50, type=int)
        
        # Get resource activities
        activities = ActivityLog.get_resource_activities(resource_type, resource_id, limit)
        
        return jsonify({
            'activities': [activity.to_dict() for activity in activities],
            'resourceType': resource_type,
            'resourceId': resource_id,
            'total': len(activities)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch resource activities', 'details': str(e)}), 500

@activity_logs_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_activity_summary():
    """Get overall activity summary"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.filter_by(id=current_user_id).first()
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user has permission
        if not current_user.has_permission('canViewAllTests'):
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        # Get query parameters
        days = request.args.get('days', 30, type=int)
        
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Get summary statistics
        total_activities = ActivityLog.query.filter(
            ActivityLog.created_at >= start_date
        ).count()
        
        # Get activities by action
        actions = db.session.query(
            ActivityLog.action,
            db.func.count(ActivityLog.id).label('count')
        ).filter(
            ActivityLog.created_at >= start_date
        ).group_by(ActivityLog.action).all()
        
        # Get activities by resource type
        resources = db.session.query(
            ActivityLog.resource_type,
            db.func.count(ActivityLog.id).label('count')
        ).filter(
            ActivityLog.created_at >= start_date
        ).group_by(ActivityLog.resource_type).all()
        
        # Get activities by status
        statuses = db.session.query(
            ActivityLog.status,
            db.func.count(ActivityLog.id).label('count')
        ).filter(
            ActivityLog.created_at >= start_date
        ).group_by(ActivityLog.status).all()
        
        # Get activities by risk level
        risk_levels = db.session.query(
            ActivityLog.risk_level,
            db.func.count(ActivityLog.id).label('count')
        ).filter(
            ActivityLog.created_at >= start_date
        ).group_by(ActivityLog.risk_level).all()
        
        # Get recent high-risk activities
        recent_high_risk = ActivityLog.query.filter(
            ActivityLog.risk_level.in_(['high', 'critical']),
            ActivityLog.created_at >= start_date
        ).order_by(ActivityLog.created_at.desc()).limit(10).all()
        
        summary = {
            'period': {
                'startDate': start_date.isoformat(),
                'endDate': end_date.isoformat(),
                'days': days
            },
            'totalActivities': total_activities,
            'byAction': {action: count for action, count in actions},
            'byResource': {resource: count for resource, count in resources},
            'byStatus': {status: count for status, count in statuses},
            'byRiskLevel': {risk: count for risk, count in risk_levels},
            'recentHighRisk': [activity.to_dict() for activity in recent_high_risk]
        }
        
        return jsonify(summary), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch activity summary', 'details': str(e)}), 500

@activity_logs_bp.route('/export', methods=['GET'])
@jwt_required()
def export_activity_logs():
    """Export activity logs for compliance reporting"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.filter_by(id=current_user_id).first()
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user has permission
        if not current_user.has_permission('canExportReports'):
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        # Get query parameters
        start_date = request.args.get('startDate', '')
        end_date = request.args.get('endDate', '')
        format_type = request.args.get('format', 'json')  # json, csv
        
        if not start_date or not end_date:
            return jsonify({'error': 'startDate and endDate are required'}), 400
        
        try:
            start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
        
        # Get logs for the date range
        logs = ActivityLog.query.filter(
            ActivityLog.created_at >= start_datetime,
            ActivityLog.created_at <= end_datetime
        ).order_by(ActivityLog.created_at.desc()).all()
        
        if format_type == 'csv':
            # Generate CSV format
            csv_data = "Action,User,Resource,Status,Risk Level,Timestamp,Details\n"
            for log in logs:
                user_info = log.user_info
                username = user_info.get('username', 'Unknown')
                resource_info = f"{log.resource_type}: {log.resource_name or log.resource_id or 'N/A'}"
                details = str(log.details) if log.details else ''
                
                csv_data += f'"{log.action}","{username}","{resource_info}","{log.status}","{log.risk_level}","{log.created_at}","{details}"\n'
            
            return csv_data, 200, {
                'Content-Type': 'text/csv',
                'Content-Disposition': f'attachment; filename=activity_logs_{start_date}_{end_date}.csv'
            }
        else:
            # Return JSON format
            return jsonify({
                'logs': [log.to_dict() for log in logs],
                'exportInfo': {
                    'startDate': start_date,
                    'endDate': end_date,
                    'totalRecords': len(logs),
                    'exportedBy': current_user.username,
                    'exportedAt': datetime.utcnow().isoformat()
                }
            }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to export activity logs', 'details': str(e)}), 500
