from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func

from models import db
from models.user import User
from models.patient import Patient
from models.test import Test
from models.diagnosis_result import DiagnosisResult
from models.upload_session import UploadSession

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/', methods=['GET'])
@jwt_required()
def get_dashboard():
    """Get dashboard summary data"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get date range for statistics (last 30 days)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=30)
        
        # Patient statistics
        total_patients = Patient.query.count()
        new_patients_30d = Patient.query.filter(
            Patient.created_at >= start_date
        ).count()
        
        # Test statistics
        total_tests = Test.query.count()
        tests_30d = Test.query.filter(
            Test.created_at >= start_date
        ).count()
        
        # Status-based test counts
        pending_tests = Test.query.filter_by(status='pending').count()
        processing_tests = Test.query.filter_by(status='processing').count()
        completed_tests = Test.query.filter_by(status='completed').count()
        failed_tests = Test.query.filter_by(status='failed').count()
        
        # Diagnosis results
        positive_results = DiagnosisResult.query.filter_by(status='POSITIVE').count()
        negative_results = DiagnosisResult.query.filter_by(status='NEGATIVE').count()
        
        # Upload session statistics
        active_sessions = UploadSession.query.filter_by(status='active').count()
        completed_sessions_30d = UploadSession.query.filter(
            UploadSession.status == 'completed',
            UploadSession.created_at >= start_date
        ).count()
        
        # Recent tests (last 10)
        recent_tests = Test.query.order_by(
            Test.created_at.desc()
        ).limit(10).all()
        
        # Recent patients (last 5)
        recent_patients = Patient.query.order_by(
            Patient.created_at.desc()
        ).limit(5).all()
        
        # User-specific statistics (if technician)
        user_stats = {}
        if user.role == 'technician':
            user_tests = Test.query.filter_by(technician_id=current_user_id).count()
            user_completed_tests = Test.query.filter_by(
                technician_id=current_user_id,
                status='completed'
            ).count()
            user_stats = {
                'totalTests': user_tests,
                'completedTests': user_completed_tests,
                'completionRate': (user_completed_tests / user_tests * 100) if user_tests > 0 else 0
            }
        
        # Weekly test trend (last 4 weeks)
        weekly_trend = []
        for i in range(4):
            week_start = end_date - timedelta(weeks=i+1)
            week_end = end_date - timedelta(weeks=i)
            week_tests = Test.query.filter(
                Test.created_at >= week_start,
                Test.created_at < week_end
            ).count()
            weekly_trend.append({
                'week': f'Week {4-i}',
                'count': week_tests
            })
        weekly_trend.reverse()
        
        return jsonify({
            'summary': {
                'totalPatients': total_patients,
                'newPatients30d': new_patients_30d,
                'totalTests': total_tests,
                'tests30d': tests_30d,
                'pendingTests': pending_tests,
                'processingTests': processing_tests,
                'completedTests': completed_tests,
                'failedTests': failed_tests,
                'positiveResults': positive_results,
                'negativeResults': negative_results,
                'activeSessions': active_sessions,
                'completedSessions30d': completed_sessions_30d
            },
            'userStats': user_stats,
            'weeklyTrend': weekly_trend,
            'recentTests': [test.to_dict_summary() for test in recent_tests],
            'recentPatients': [patient.to_dict_summary() for patient in recent_patients],
            'user': user.to_dict_public()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch dashboard data', 'details': str(e)}), 500

@dashboard_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get recent notifications for the user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get recent activities that might be notifications
        notifications = []
        
        # Recent test completions
        recent_completions = Test.query.filter(
            Test.status == 'completed',
            Test.updated_at >= datetime.utcnow() - timedelta(hours=24)
        ).order_by(Test.updated_at.desc()).limit(5).all()
        
        for test in recent_completions:
            notifications.append({
                'type': 'test_completed',
                'title': f'Test {test.test_id} completed',
                'message': f'Test for patient {test.patient.first_name} {test.patient.last_name} has been completed',
                'timestamp': test.updated_at.isoformat(),
                'data': {
                    'testId': test.id,
                    'patientId': test.patient_id
                }
            })
        
        # Recent upload sessions
        recent_uploads = UploadSession.query.filter(
            UploadSession.status == 'completed',
            UploadSession.updated_at >= datetime.utcnow() - timedelta(hours=24)
        ).order_by(UploadSession.updated_at.desc()).limit(5).all()
        
        for session in recent_uploads:
            notifications.append({
                'type': 'upload_completed',
                'title': f'Upload session {session.session_id} completed',
                'message': f'Upload session completed with {session.uploaded_files} files',
                'timestamp': session.updated_at.isoformat(),
                'data': {
                    'sessionId': session.id
                }
            })
        
        # Sort by timestamp
        notifications.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify({
            'notifications': notifications[:10],  # Limit to 10 most recent
            'total': len(notifications)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch notifications', 'details': str(e)}), 500

@dashboard_bp.route('/stats/parasite-types', methods=['GET'])
@jwt_required()
def get_parasite_type_stats():
    """Get statistics by parasite type"""
    try:
        # Get diagnosis results with parasite information
        results = DiagnosisResult.query.filter(
            DiagnosisResult.status == 'POSITIVE',
            DiagnosisResult.most_probable_parasite_type.isnot(None)
        ).all()
        
        parasite_stats = {}
        for result in results:
            parasite_type = result.most_probable_parasite_type
            if parasite_type not in parasite_stats:
                parasite_stats[parasite_type] = {
                    'count': 0,
                    'totalConfidence': 0,
                    'avgConfidence': 0
                }
            
            parasite_stats[parasite_type]['count'] += 1
            parasite_stats[parasite_type]['totalConfidence'] += result.most_probable_parasite_confidence or 0
        
        # Calculate averages
        for stats in parasite_stats.values():
            if stats['count'] > 0:
                stats['avgConfidence'] = stats['totalConfidence'] / stats['count']
        
        return jsonify({
            'parasiteStats': parasite_stats,
            'totalPositiveCases': len(results)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch parasite statistics', 'details': str(e)}), 500
