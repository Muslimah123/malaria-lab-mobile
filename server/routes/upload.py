from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime
import logging
from middleware.fileUpload import validate_file_upload, save_uploaded_file
from models.upload_session import UploadSession
from models.test import Test
from models.diagnosis_result import DiagnosisResult
from models.user import User
from services.image_validation import validate_image_buffer
import json

# Create logger with fallback
try:
    logger = logging.getLogger(__name__)
except Exception:
    # Fallback logger if logging fails
    class FallbackLogger:
        def info(self, msg): print(f"[INFO] {msg}")
        def error(self, msg): print(f"[ERROR] {msg}")
        def warning(self, msg): print(f"[WARNING] {msg}")
        def debug(self, msg): print(f"[DEBUG] {msg}")
    
    logger = FallbackLogger()

upload_bp = Blueprint('upload', __name__)

@upload_bp.route('/session', methods=['POST'])
@jwt_required()
def create_upload_session():
    """Create a new upload session"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check permission
        if not user.has_permission('canUploadSamples'):
            return jsonify({'error': 'Insufficient permissions to upload samples'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        if not data.get('testId'):
            return jsonify({'error': 'Test ID is required'}), 400
        
        # Validate test exists and user has access
        test = Test.query.filter_by(id=data['testId']).first()
        if not test:
            return jsonify({'error': 'Test not found'}), 404
        
        # Check if user owns the test or is supervisor/admin
        if test.technician_id != current_user_id and user.role not in ['supervisor', 'admin']:
            return jsonify({'error': 'Access denied to this test'}), 403
        
        # Validate test status
        if test.status not in ['pending', 'processing']:
            return jsonify({'error': 'Test must be in pending or processing status'}), 400
        
        # Check if upload session already exists for this test
        existing_session = UploadSession.query.filter_by(test_id=data['testId']).first()
        if existing_session and existing_session.status in ['active', 'processing']:
            logger.info(f"Found existing upload session {existing_session.session_id} for test {data['testId']}")
            return jsonify({
                'message': 'Upload session already exists',
                'session': existing_session.to_dict()
            }), 200
        
        # Create new upload session
        session = UploadSession(
            user_id=current_user_id,
            test_id=data['testId'],
            patient_id=test.patient_id,
            status='active'
        )
        
        # Add to database
        from models import db
        db.session.add(session)
        db.session.commit()
        
        return jsonify({
            'message': 'Upload session created successfully',
            'session': session.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Failed to create upload session: {str(e)}")
        return jsonify({'error': 'Failed to create upload session', 'details': str(e)}), 500

@upload_bp.route('/files/<session_id>', methods=['POST'])
@jwt_required()
@validate_file_upload
def upload_files(session_id):
    """Upload files to an existing session"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get session
        session = UploadSession.query.filter_by(session_id=session_id).first()
        if not session:
            return jsonify({'error': 'Upload session not found'}), 404
        
        # Check if user owns the session or is supervisor/admin
        user = User.query.get(current_user_id)
        if session.user_id != current_user_id and user.role not in ['supervisor', 'admin']:
            return jsonify({'error': 'Access denied to this session'}), 403
        
        # Check session status
        if session.status != 'active':
            return jsonify({'error': 'Session is not active'}), 400
        
        # Get validated files from middleware
        files = request.files.getlist('images')
        
        if not files:
            return jsonify({'error': 'No images provided'}), 400
        
        # Check file count limit
        if len(files) > 20:  # Max 20 files per session
            return jsonify({'error': 'Maximum 20 files allowed per session'}), 400
        
        uploaded_files = []
        failed_files = []
        
        # Process each file
        for file in files:
            try:
                # Generate unique filename
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4()}_{filename}"
                
                # Create upload directory
                upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], str(session.session_id))
                os.makedirs(upload_dir, exist_ok=True)
                
                # Save file
                file_path = save_uploaded_file(file, upload_dir, unique_filename)
                
                # Validate image (basic security and format check)
                file.seek(0)
                file_content = file.read()
                is_valid, metadata, errors = validate_image_buffer(file_content, filename)
                
                if not is_valid:
                    failed_files.append({
                        'filename': filename,
                        'errors': errors
                    })
                    session.failed_files += 1
                    continue
                
                # Add file to session
                session.add_file(
                    filename=unique_filename,
                    original_name=filename,
                    path=file_path,
                    size=len(file_content),
                    mimetype=file.content_type
                )
                
                uploaded_files.append({
                    'filename': unique_filename,
                    'originalName': filename,
                    'size': len(file_content),
                    'status': 'uploaded'
                })
                
            except Exception as e:
                logger.error(f"Failed to process file {file.filename}: {str(e)}")
                failed_files.append({
                    'filename': file.filename,
                    'errors': [str(e)]
                })
                session.failed_files += 1
        
        # Update session progress
        session.update_progress()
        
        # Update test with images if files were uploaded successfully
        if uploaded_files and session.test_id:
            test = Test.query.get(session.test_id)
            if test:
                for file_info in uploaded_files:
                    test.add_image(
                        filename=file_info['filename'],
                        original_name=file_info['originalName'],
                        path=os.path.join(current_app.config['UPLOAD_FOLDER'], str(session.session_id), file_info['filename']),
                        size=file_info['size'],
                        mimetype='image/jpeg'  # Default, could be enhanced
                    )
                
                # Update test status to processing if it was pending
                if test.status == 'pending':
                    test.update_status('processing')
                
                # Calculate quality score
                test.calculate_quality_score()
        
        # Commit all changes
        from models import db
        db.session.commit()
        
        return jsonify({
            'message': 'Files uploaded successfully',
            'sessionId': session.session_id,
            'totalFiles': len(files),
            'status': session.status,
            'uploadedFiles': uploaded_files,
            'failedFiles': failed_files
        }), 200
        
    except Exception as e:
        logger.error(f"File upload failed: {str(e)}")
        return jsonify({'error': 'File upload failed', 'details': str(e)}), 500

@upload_bp.route('/process/<session_id>', methods=['POST'])
@jwt_required()
def initiate_processing(session_id):
    """Initiate processing for uploaded files"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get session
        session = UploadSession.query.filter_by(session_id=session_id).first()
        if not session:
            return jsonify({'error': 'Upload session not found'}), 404
        
        # Check if user owns the session or is supervisor/admin
        user = User.query.get(current_user_id)
        if session.user_id != current_user_id and user.role not in ['supervisor', 'admin']:
            return jsonify({'error': 'Access denied to this session'}), 403
        
        # Check session status
        if session.status != 'active':
            return jsonify({'error': 'Session is not active'}), 400
        
        # Check if there are valid files
        valid_files = session.get_valid_files()
        if not valid_files:
            return jsonify({'error': 'No valid files to process'}), 400
        
        # Check if test exists and is in correct status
        if session.test_id:
            test = Test.query.get(session.test_id)
            if not test:
                return jsonify({'error': 'Associated test not found'}), 404
            
            if test.status not in ['pending', 'processing']:
                return jsonify({'error': 'Test is not in correct status for processing'}), 400
        
        # Update session status to processing
        session.status = 'processing'
        session.updated_at = datetime.utcnow()
        
        # Update test status if it was pending
        if session.test_id and test.status == 'pending':
            test.update_status('processing')
        
        # Commit status changes
        from models import db
        db.session.commit()
        
        # Start AI processing
        from services.ai_analysis import ai_service
        
        # Get image paths from valid files
        image_paths = [file_info['path'] for file_info in valid_files]
        
        # Add to AI processing queue
        success = ai_service.add_to_processing_queue(
            session_id=session_id,
            test_id=session.test_id,
            image_paths=image_paths
        )
        
        if not success:
            logger.error(f"Failed to add session {session_id} to AI processing queue")
            # Revert status changes
            session.status = 'active'
            if session.test_id and test.status == 'processing':
                test.update_status('pending')
            db.session.commit()
            return jsonify({'error': 'Failed to initiate AI processing'}), 500
        
        logger.info(f"Processing initiated for session {session_id} with {len(valid_files)} files")
        
        return jsonify({
            'message': 'Processing initiated successfully',
            'sessionId': session.session_id,
            'status': session.status,
            'filesToProcess': len(valid_files),
            'estimatedTime': '5-10 minutes'  # Placeholder
        }), 200
        
    except Exception as e:
        logger.error(f"Failed to initiate processing: {str(e)}")
        return jsonify({'error': 'Failed to initiate processing', 'details': str(e)}), 500

@upload_bp.route('/images', methods=['POST'])
@jwt_required()
@validate_file_upload
def upload_images():
    """Upload images for a test"""
    try:
        from models import db
        
        # Get current user
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get validated files from middleware
        files = request.files.getlist('images')
        test_data = request.form.get('testData')
        
        if not files:
            return jsonify({'error': 'No images provided'}), 400
        
        # Parse test data if provided
        test_info = {}
        if test_data:
            try:
                import json
                test_info = json.loads(test_data)
            except:
                test_info = {}
        
        # Get current user ID
        # current_user_id = get_jwt_identity() # This line is moved up
        
        # Create test record first
        from models.test import Test
        from models.patient import Patient
        # from models import db # This line is moved up
        
        # Validate patient exists
        patient = Patient.query.filter_by(id=test_info.get('patientId')).first()
        if not patient:
            return jsonify({'error': 'Patient not found'}), 404
        
        # Create test record
        test = Test(
            patient_id=test_info.get('patientId'),
            sample_type=test_info.get('sampleType', 'blood_smear'),
            sample_collection_date=datetime.utcnow(),
            sample_collected_by=current_user_id,
            technician_id=current_user_id,
            created_by=current_user_id,
            priority=test_info.get('priority', 'normal'),
            test_type='malaria_detection'
        )
        
        # Set clinical notes if provided
        if test_info.get('clinicalNotes'):
            test.set_clinical_notes(
                symptoms=[],
                duration='',
                severity='',
                previous_treatment='',
                additional_notes=test_info.get('clinicalNotes')
            )
        
        # Ensure unique test_id before adding to database
        try:
            test.ensure_unique_test_id()
        except ValueError as e:
            logger.error(f"Failed to generate unique test_id: {e}")
            return jsonify({'error': 'Failed to create test: could not generate unique ID'}), 500
        
        # Add test to database
        db.session.add(test)
        db.session.flush()  # Get the test ID without committing
        
        # Create upload session
        session = UploadSession(
            user_id=current_user_id,
            test_id=test.id,
            patient_id=test_info.get('patientId'),
            status='processing',
            total_files=len(files),
            uploaded_files=0,
            failed_files=0
        )
        
        # Save upload session to database
        db.session.add(session)
        db.session.flush()  # Get the session ID without committing
        
        uploaded_files = []
        failed_files = []
        
        # Process each image
        for file in files:
            try:
                # Generate unique filename
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4()}_{filename}"
                
                # Create upload directory
                upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], str(session.session_id))
                os.makedirs(upload_dir, exist_ok=True)
                
                # Save file as-is (no preprocessing)
                file_path = save_uploaded_file(file, upload_dir, unique_filename)
                
                # Validate image (basic security and format check)
                file.seek(0)
                file_content = file.read()
                is_valid, metadata, errors = validate_image_buffer(file_content, filename)
                
                if not is_valid:
                    failed_files.append({
                        'filename': filename,
                        'errors': errors
                    })
                    session.failed_files += 1
                    continue
                
                # Add file to session
                file_info = {
                    'filename': filename,
                    'originalName': file.filename,
                    'filePath': file_path,
                    'fileSize': len(file_content),
                    'uploadedAt': datetime.utcnow().isoformat(),
                    'status': 'uploaded',
                    'metadata': metadata
                }
                
                session.add_file(
                    filename=unique_filename,
                    original_name=filename,
                    path=file_path,
                    size=len(file_content),
                    mimetype=file.content_type or 'image/jpeg'
                )
                uploaded_files.append(file_info)
                session.uploaded_files += 1
                
                # Add image to test
                test.add_image(
                    filename=unique_filename,
                    original_name=filename,
                    path=file_path,
                    size=len(file_content),
                    mimetype=file.content_type or 'image/jpeg'
                )
                
            except Exception as e:
                logger.error(f"Failed to process file {file.filename}: {str(e)}")
                failed_files.append({
                    'filename': file.filename,
                    'errors': [str(e)]
                })
                session.failed_files += 1
        
        # Update session status
        if session.failed_files == 0:
            session.status = 'completed'
        elif session.uploaded_files > 0:
            session.status = 'partial'
        else:
            session.status = 'failed'
        
        session.percent_complete = (session.uploaded_files / session.total_files) * 100
        
        # Update test status to processing
        test.update_status('processing')
        
        # Commit all changes
        db.session.commit()
        
        # If we have valid images, store them but DON'T start AI processing
        if uploaded_files:
            logger.info(f"Images uploaded successfully. Session: {session.session_id}, Test: {test.id}")
            logger.info(f"Files ready for AI processing: {len(uploaded_files)}")
            
            # Update session status to 'uploaded' (ready for AI processing)
            session.status = 'uploaded'
            session.updated_at = datetime.utcnow()
            
            # Update test status to 'uploaded' (ready for processing)
            test.update_status('uploaded')
            
            # Commit changes
            db.session.commit()
            
            logger.info(f"Session {session.session_id} marked as ready for AI processing")
        
        return jsonify({
            'success': True,
            'message': 'Images uploaded successfully. Ready for AI processing.',
            'sessionId': str(session.session_id),
            'testId': str(test.id),
            'totalFiles': len(files),
            'status': session.status,
            'uploadedFiles': uploaded_files,
            'failedFiles': failed_files
        }), 200
        
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Upload failed',
            'message': str(e)
        }), 500

@upload_bp.route('/progress/<session_id>', methods=['GET'])
@jwt_required()
def get_upload_progress(session_id):
    """Get upload session progress and AI processing status"""
    try:
        session = UploadSession.query.filter_by(session_id=session_id).first()
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Get AI processing status for any session
        ai_status = None
        from services.ai_analysis import ai_service
        ai_status = ai_service.get_job_status(session_id)
        
        response = {
            'sessionId': session.session_id,
            'status': session.status,
            'totalFiles': session.total_files,
            'uploadedFiles': session.uploaded_files,
            'failedFiles': session.failed_files,
            'percentComplete': session.percent_complete,
            'createdAt': session.created_at.isoformat(),
            'updatedAt': session.updated_at.isoformat() if session.updated_at else None,
            'startTime': session.created_at.timestamp() * 1000  # Add start time in milliseconds
        }
        
        if ai_status:
            response['aiProcessing'] = {
                'status': ai_status.get('status'),
                'progress': ai_status.get('progress', 0),
                'error': ai_status.get('error'),
                'estimatedTime': '5-10 minutes' if ai_status.get('status') == 'processing' else None
            }
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Failed to get progress: {str(e)}")
        return jsonify({'error': 'Failed to get progress'}), 500

@upload_bp.route('/cancel/<session_id>', methods=['POST'])
@jwt_required()
def cancel_upload(session_id):
    """Cancel upload session"""
    try:
        session = UploadSession.query.filter_by(session_id=session_id).first()
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        if session.status in ['completed', 'failed']:
            return jsonify({'error': 'Cannot cancel completed or failed session'}), 400
        
        # Cancel the session
        session.cancel()
        
        # Clean up uploaded files
        if session.files:
            for file_info in session.files:
                try:
                    if os.path.exists(file_info['path']):
                        os.remove(file_info['path'])
                except Exception as e:
                    logger.warning(f"Failed to delete file {file_info['path']}: {str(e)}")
        
        from models import db
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Upload cancelled successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Failed to cancel upload: {str(e)}")
        return jsonify({'error': 'Failed to cancel upload'}), 500

@upload_bp.route('/history', methods=['GET'])
@jwt_required()
def get_upload_history():
    """Get upload history for current user"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        
        # Get user's upload sessions
        current_user_id = get_jwt_identity()
        sessions = UploadSession.query.filter_by(user_id=current_user_id)\
            .order_by(UploadSession.created_at.desc())\
            .paginate(page=page, per_page=limit, error_out=False)
        
        history = []
        for session in sessions.items:
            history.append({
                'sessionId': session.session_id,
                'status': session.status,
                'totalFiles': session.total_files,
                'uploadedFiles': session.uploaded_files,
                'failedFiles': session.failed_files,
                'percentComplete': session.percent_complete,
                'createdAt': session.created_at.isoformat(),
                'updatedAt': session.updated_at.isoformat() if session.updated_at else None
            })
        
        return jsonify({
            'history': history,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': sessions.total,
                'pages': sessions.pages
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Failed to get upload history: {str(e)}")
        return jsonify({'error': 'Failed to get upload history'}), 500

@upload_bp.route('/start-processing', methods=['POST'])
@jwt_required()
def start_ai_processing():
    """Start AI processing for an already uploaded session"""
    try:
        data = request.get_json()
        session_id = data.get('sessionId')
        test_id = data.get('testId')
        
        if not session_id or not test_id:
            return jsonify({
                'success': False,
                'error': 'Missing sessionId or testId'
            }), 400
        
        # Get the upload session
        session = UploadSession.query.filter_by(session_id=session_id).first()
        if not session:
            return jsonify({
                'success': False,
                'error': 'Session not found'
            }), 404
        
        # Check if session is ready for processing
        if session.status not in ['uploaded', 'completed']:
            return jsonify({
                'success': False,
                'error': f'Session status "{session.status}" is not ready for AI processing'
            }), 400
        
        # Get image paths from the session
        image_paths = []
        if session.files:
            for file_info in session.files:
                # FIXED: Use 'path' instead of 'filePath' to match the stored structure
                if os.path.exists(file_info['path']):
                    image_paths.append(file_info['path'])
        
        if not image_paths:
            return jsonify({
                'success': False,
                'error': 'No valid image files found in session'
            }), 400
        
        # Trigger AI processing
        from services.ai_analysis import ai_service
        
        success = ai_service.add_to_processing_queue(
            session_id=str(session_id),
            test_id=str(test_id),
            image_paths=image_paths
        )
        
        if success:
            # Update session status to processing
            session.status = 'processing'
            session.updated_at = datetime.utcnow()
            
            # Update test status to processing
            from models.test import Test
            test = Test.query.get(test_id)
            if test:
                test.update_status('processing')
            
            from models import db
            db.session.commit()
            
            logger.info(f"AI processing started for session: {session_id}, test: {test_id}")
            
            return jsonify({
                'success': True,
                'message': 'AI processing started successfully',
                'sessionId': session_id,
                'testId': test_id,
                'imageCount': len(image_paths)
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to start AI processing'
            }), 500
            
    except Exception as e:
        logger.error(f"Failed to start AI processing: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to start AI processing',
            'message': str(e)
        }), 500

@upload_bp.route('/queue/status', methods=['GET'])
@jwt_required()
def get_processing_queue_status():
    """Get AI processing queue status"""
    try:
        from services.ai_analysis import ai_service
        queue_status = ai_service.get_queue_status()
        
        return jsonify({
            'queueStatus': queue_status
        }), 200
        
    except Exception as e:
        logger.error(f"Failed to get queue status: {str(e)}")
        return jsonify({'error': 'Failed to get queue status'}), 500
