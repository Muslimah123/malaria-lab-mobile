from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import os
import logging

logger = logging.getLogger(__name__)

from models.test import db, Test
from models.patient import Patient
from models.user import User
from models.diagnosis_result import DiagnosisResult
from models.upload_session import UploadSession
from services.audit_service import AuditService

tests_bp = Blueprint('tests', __name__)

@tests_bp.route('/', methods=['GET'])
@jwt_required()
def get_tests():
    """Get all tests with pagination and filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status', '')
        patient_id = request.args.get('patient_id', '')
        priority = request.args.get('priority', '')
        
        # Build query
        query = Test.query
        
        # Apply filters
        if status:
            query = query.filter_by(status=status)
        if patient_id:
            query = query.filter_by(patient_id=patient_id)
        if priority:
            query = query.filter_by(priority=priority)
        
        # Apply pagination
        pagination = query.order_by(Test.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        tests = pagination.items
        
        return jsonify({
            'tests': [test.to_dict_summary() for test in tests],
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch tests', 'details': str(e)}), 500

@tests_bp.route('/<test_id>', methods=['GET'])
@jwt_required()
def get_test(test_id):
    """Get a specific test by ID"""
    try:
        test = Test.query.filter_by(id=test_id).first()
        
        if not test:
            return jsonify({'error': 'Test not found'}), 404
        
        return jsonify({
            'test': test.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch test', 'details': str(e)}), 500

@tests_bp.route('/', methods=['POST'])
@jwt_required()
def create_test():
    """Create a new test"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['patientId', 'sampleType', 'sampleCollectionDate']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate patient exists
        patient = Patient.query.filter_by(id=data['patientId']).first()
        if not patient:
            return jsonify({'error': 'Patient not found'}), 404
        
        # Validate sample collection date
        try:
            # Use local time instead of UTC
            sample_collection_date = datetime.fromisoformat(data['sampleCollectionDate'].replace('Z', ''))
        except ValueError:
            return jsonify({'error': 'Invalid date format for sampleCollectionDate'}), 400
        
        # Validate sample type
        valid_sample_types = ['blood_smear', 'thick_smear', 'thin_smear']
        if data['sampleType'] not in valid_sample_types:
            return jsonify({'error': 'Invalid sample type'}), 400
        
        # Validate priority
        valid_priorities = ['low', 'normal', 'high', 'urgent']
        priority = data.get('priority', 'normal')
        if priority not in valid_priorities:
            return jsonify({'error': 'Invalid priority value'}), 400
        
        # Get current user
        current_user = User.query.filter_by(id=current_user_id).first()
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Prepare test data
        test_data = {
            'sampleType': data['sampleType'],
            'sampleCollectionDate': sample_collection_date,
            'priority': priority,
            'testType': data.get('testType', 'malaria_detection'),
            'clinicalNotes': data.get('clinicalNotes', {})
        }
        
        # Create new test (removed overly restrictive duplicate prevention)
        test = Test(
            patient_id=data['patientId'],
            sample_type=data['sampleType'],
            sample_collection_date=sample_collection_date,
            sample_collected_by=current_user_id,
            technician_id=current_user_id,
            created_by=current_user_id,
            priority=priority,
            test_type=data.get('testType', 'malaria_detection')
        )
        
        # Set clinical notes if provided
        if 'clinicalNotes' in data:
            test.set_clinical_notes(
                symptoms=data['clinicalNotes'].get('symptoms', []),
                duration=data['clinicalNotes'].get('duration', ''),
                severity=data['clinicalNotes'].get('severity', ''),
                previous_treatment=data['clinicalNotes'].get('previousTreatment', ''),
                additional_notes=data['clinicalNotes'].get('additionalNotes', '')
            )
        
        # Ensure unique test_id before adding to database
        try:
            test.ensure_unique_test_id()
        except ValueError as e:
            logger.error(f"Failed to generate unique test_id: {e}")
            return jsonify({'error': 'Failed to create test: could not generate unique ID'}), 500
        
        # Add to database
        db.session.add(test)
        db.session.commit()
        
        # Log the activity
        AuditService.log_test_activity(
            action='test_created',
            user=current_user,
            test=test,
            details={
                'testData': {
                    'patientId': data['patientId'],
                    'priority': priority,
                    'sampleType': data['sampleType']
                },
                'patientName': f"{patient.first_name} {patient.last_name}"
            }
        )
        
        return jsonify({
            'message': 'Test created successfully',
            'test': test.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create test', 'details': str(e)}), 500

@tests_bp.route('/<test_id>', methods=['PUT'])
@jwt_required()
def update_test(test_id):
    """Update an existing test"""
    try:
        test = Test.query.filter_by(id=test_id).first()
        
        if not test:
            return jsonify({'error': 'Test not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'status' in data:
            valid_statuses = ['pending', 'processing', 'completed', 'failed', 'cancelled']
            if data['status'] not in valid_statuses:
                return jsonify({'error': 'Invalid status value'}), 400
            test.update_status(data['status'])
        
        if 'priority' in data:
            valid_priorities = ['low', 'normal', 'high', 'urgent']
            if data['priority'] not in valid_priorities:
                return jsonify({'error': 'Invalid priority value'}), 400
            test.priority = data['priority']
        
        if 'sampleType' in data:
            valid_sample_types = ['blood_smear', 'thick_smear', 'thin_smear']
            if data['sampleType'] not in valid_sample_types:
                return jsonify({'error': 'Invalid sample type'}), 400
            test.sample_type = data['sampleType']
        
        if 'sampleCollectionDate' in data:
            try:
                sample_collection_date = datetime.fromisoformat(data['sampleCollectionDate'].replace('Z', '+00:00'))
                test.sample_collection_date = sample_collection_date
            except ValueError:
                return jsonify({'error': 'Invalid date format for sampleCollectionDate'}), 400
        
        # Update clinical notes if provided
        if 'clinicalNotes' in data:
            test.set_clinical_notes(
                symptoms=data['clinicalNotes'].get('symptoms'),
                duration=data['clinicalNotes'].get('duration'),
                severity=data['clinicalNotes'].get('severity'),
                previous_treatment=data['clinicalNotes'].get('previousTreatment'),
                additional_notes=data['clinicalNotes'].get('additionalNotes')
            )
        
        # Update reviewer if provided
        if 'reviewedBy' in data:
            test.reviewed_by = data['reviewedBy']
            test.reviewed_at = datetime.utcnow()
        
        test.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Test updated successfully',
            'test': test.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update test', 'details': str(e)}), 500

@tests_bp.route('/<test_id>/images', methods=['POST'])
@jwt_required()
def add_test_images(test_id):
    """Add images to a test"""
    try:
        test = Test.query.filter_by(id=test_id).first()
        
        if not test:
            return jsonify({'error': 'Test not found'}), 404
        
        if test.status not in ['pending', 'processing']:
            return jsonify({'error': 'Cannot add images to test in current status'}), 400
        
        data = request.get_json()
        
        if not data.get('images') or not isinstance(data['images'], list):
            return jsonify({'error': 'Images array is required'}), 400
        
        # Add each image
        for image_data in data['images']:
            required_fields = ['filename', 'originalName', 'path', 'size', 'mimetype']
            for field in required_fields:
                if not image_data.get(field):
                    return jsonify({'error': f'{field} is required for image'}), 400
            
            test.add_image(
                filename=image_data['filename'],
                original_name=image_data['originalName'],
                path=image_data['path'],
                size=image_data['size'],
                mimetype=image_data['mimetype']
            )
        
        # Update test status to processing if it was pending
        if test.status == 'pending':
            test.update_status('processing')
        
        # Calculate quality score
        test.calculate_quality_score()
        
        test.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Images added successfully',
            'test': test.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to add images', 'details': str(e)}), 500

@tests_bp.route('/<test_id>/diagnosis', methods=['POST'])
@jwt_required()
def create_diagnosis_result(test_id):
    """Create diagnosis result for a test"""
    try:
        test = Test.query.filter_by(id=test_id).first()
        
        if not test:
            return jsonify({'error': 'Test not found'}), 404
        
        if test.status != 'processing':
            return jsonify({'error': 'Test must be in processing status'}), 400
        
        data = request.get_json()
        
        # Validate required fields
        if not data.get('status') or data['status'] not in ['POSITIVE', 'NEGATIVE']:
            return jsonify({'error': 'Valid status (POSITIVE/NEGATIVE) is required'}), 400
        
        # Check if diagnosis result already exists
        existing_result = DiagnosisResult.query.filter_by(test_id=test_id).first()
        if existing_result:
            logger.info(f"Diagnosis result already exists for test {test_id}, returning existing result")
            return jsonify({
                'message': 'Diagnosis result already exists',
                'diagnosisResult': existing_result.to_dict()
            }), 200
        
        # Create diagnosis result
        diagnosis_result = DiagnosisResult(
            test_id=test_id,
            status=data['status'],
            model_version=data.get('modelVersion', 'YOLOv12-1.0'),
            processing_time=data.get('processingTime', 0)
        )
        
        # Set most probable parasite if positive
        if data['status'] == 'POSITIVE' and data.get('mostProbableParasite'):
            parasite_data = data['mostProbableParasite']
            diagnosis_result.set_most_probable_parasite(
                parasite_type=parasite_data.get('type'),
                confidence=parasite_data.get('confidence', 0),
                full_name=parasite_data.get('fullName', '')
            )
        
        # Add detections if provided
        if data.get('detections'):
            for detection in data['detections']:
                diagnosis_result.add_detection(
                    image_id=detection.get('imageId', ''),
                    original_filename=detection.get('originalFilename', ''),
                    parasites_detected=detection.get('parasitesDetected', []),
                    wbcs_detected=detection.get('wbcsDetected', []),
                    white_blood_cells_count=detection.get('whiteBloodCellsDetected', 0),
                    total_parasites=detection.get('totalParasites', 0),
                    image_quality=detection.get('imageQuality', 0)
                )
        
        # Calculate severity and confidence
        diagnosis_result.calculate_severity()
        diagnosis_result.calculate_overall_confidence()
        
        # Add to database
        db.session.add(diagnosis_result)
        
        # Update test status to completed
        test.update_status('completed')
        
        # Update patient test statistics
        test.patient.update_test_statistics()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Diagnosis result created successfully',
            'diagnosisResult': diagnosis_result.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create diagnosis result', 'details': str(e)}), 500

@tests_bp.route('/<test_id>/diagnosis', methods=['GET'])
@jwt_required()
def get_diagnosis_result(test_id):
    """Get diagnosis result for a test"""
    try:
        diagnosis_result = DiagnosisResult.query.filter_by(test_id=test_id).first()
        
        if not diagnosis_result:
            return jsonify({'error': 'Diagnosis result not found'}), 404
        
        return jsonify({
            'diagnosisResult': diagnosis_result.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch diagnosis result', 'details': str(e)}), 500

@tests_bp.route('/<test_id>/results', methods=['GET'])
@jwt_required()
def get_test_results(test_id):
    """Get complete test results including diagnosis"""
    try:
        logger.info(f"Fetching results for test: {test_id}")
        
        test = Test.query.filter_by(id=test_id).first()
        
        if not test:
            logger.warning(f"Test not found: {test_id}")
            return jsonify({'error': 'Test not found'}), 404
        
        logger.info(f"Test found: {test.test_id}, status: {test.status}")
        
        # Get diagnosis result if it exists
        try:
            diagnosis_result = DiagnosisResult.query.filter_by(test_id=test_id).first()
            logger.info(f"Diagnosis result found: {diagnosis_result is not None}")
        except Exception as diag_error:
            logger.error(f"Error querying diagnosis result: {str(diag_error)}")
            diagnosis_result = None
        
        # Prepare response
        try:
            # Resolve human-friendly patient ID (PAT-...)
            patient_public_id = None
            try:
                patient_obj = test.patient if hasattr(test, 'patient') and test.patient else Patient.query.filter_by(id=test.patient_id).first()
                if patient_obj:
                    patient_public_id = patient_obj.patient_id
            except Exception:
                patient_public_id = None

            response = {
                # IDs
                'testUuid': test.id,
                'testId': test.test_id,  # human-friendly TEST-...
                'patientUuid': test.patient_id,
                'patientId': patient_public_id,  # human-friendly PAT-...

                # Test metadata
                'status': test.status,
                'priority': test.priority,
                'sampleType': test.sample_type,
                'sampleCollectionDate': test.sample_collection_date.isoformat() if test.sample_collection_date else None,
                'createdAt': test.created_at.isoformat() if test.created_at else None,
                'updatedAt': test.updated_at.isoformat() if test.updated_at else None,
                'processingTime': test.processing_time,
                'qualityScore': test.quality_score,
                'images': test.images or [],
                'clinicalNotes': test.clinical_notes or {}
            }
            logger.info("Basic response prepared successfully")
        except Exception as resp_error:
            logger.error(f"Error preparing basic response: {str(resp_error)}")
            raise resp_error
        
        # Add diagnosis results if available
        if diagnosis_result:
            try:
                # Use model's to_dict to ensure correct field names and shapes
                diagnosis_dict = diagnosis_result.to_dict()

                diagnosis_data = {
                    # prefer diagnosis status (POSITIVE/NEGATIVE) over test status
                    'status': diagnosis_dict.get('status', response.get('status')),
                    'modelVersion': diagnosis_dict.get('modelVersion'),
                    # frontend expects overallConfidence; model exposes 'confidence'
                    'overallConfidence': diagnosis_dict.get('confidence'),
                    'severity': diagnosis_dict.get('severity'),
                    'mostProbableParasite': diagnosis_dict.get('mostProbableParasite'),
                    'detections': diagnosis_dict.get('detections', []) or [],
                    'totalParasites': diagnosis_dict.get('totalParasites'),
                    'totalWbcs': diagnosis_dict.get('totalWbcs'),
                    'parasiteWbcRatio': diagnosis_dict.get('parasiteWbcRatio'),
                    'diagnosisCreatedAt': diagnosis_dict.get('createdAt')
                }
                response.update(diagnosis_data)
                logger.info("Diagnosis data added successfully")
            except Exception as diag_data_error:
                logger.error(f"Error adding diagnosis data: {str(diag_data_error)}")
                # Continue without diagnosis data rather than failing completely
        
        logger.info(f"Final response prepared: {len(response)} fields")
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Failed to fetch test results for test {test_id}: {str(e)}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to fetch test results', 'details': str(e)}), 500

@tests_bp.route('/<test_id>', methods=['DELETE'])
@jwt_required()
def delete_test(test_id):
    """Delete a test"""
    try:
        test = Test.query.filter_by(id=test_id).first()
        
        if not test:
            return jsonify({'error': 'Test not found'}), 404
        
        if test.status in ['completed', 'processing']:
            return jsonify({'error': 'Cannot delete test in current status'}), 400
        
        # Delete associated files
        if test.images:
            for image in test.images:
                try:
                    if os.path.exists(image['path']):
                        os.remove(image['path'])
                except Exception:
                    pass  # Continue even if file deletion fails
        
        db.session.delete(test)
        db.session.commit()
        
        return jsonify({'message': 'Test deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete test', 'details': str(e)}), 500

@tests_bp.route('/status/<status>', methods=['GET'])
@jwt_required()
def get_tests_by_status(status):
    """Get tests by status"""
    try:
        valid_statuses = ['pending', 'processing', 'completed', 'failed', 'cancelled']
        if status not in valid_statuses:
            return jsonify({'error': 'Invalid status value'}), 400
        
        tests = Test.get_tests_by_status(status, limit=50)
        
        return jsonify({
            'tests': [test.to_dict_summary() for test in tests],
            'status': status,
            'total': len(tests)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch tests', 'details': str(e)}), 500

@tests_bp.route('/patient/<patient_id>', methods=['GET'])
@jwt_required()
def get_patient_tests(patient_id):
    """Get all tests for a specific patient"""
    try:
        # Verify patient exists
        patient = Patient.query.filter_by(id=patient_id).first()
        if not patient:
            return jsonify({'error': 'Patient not found'}), 404
        
        tests = Test.get_tests_by_patient(patient_id, limit=50)
        
        return jsonify({
            'patient': patient.to_dict_summary(),
            'tests': [test.to_dict_summary() for test in tests],
            'total': len(tests)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch patient tests', 'details': str(e)}), 500

@tests_bp.route('/debug/diagnosis/<test_id>', methods=['GET'])
@jwt_required()
def debug_diagnosis_result(test_id):
    """Debug endpoint to check DiagnosisResult model"""
    try:
        logger.info(f"Debug: Checking diagnosis result for test: {test_id}")
        
        # Check if test exists
        test = Test.query.filter_by(id=test_id).first()
        if not test:
            return jsonify({'error': 'Test not found'}), 404
        
        # Check if diagnosis result exists
        try:
            diagnosis_result = DiagnosisResult.query.filter_by(test_id=test_id).first()
            if diagnosis_result:
                logger.info(f"Debug: Diagnosis result found with ID: {diagnosis_result.id}")
                
                # Try to access each attribute safely
                debug_info = {
                    'id': diagnosis_result.id,
                    'test_id': diagnosis_result.test_id,
                    'status': diagnosis_result.status,
                    'model_version': diagnosis_result.model_version,
                    'created_at': diagnosis_result.created_at.isoformat() if diagnosis_result.created_at else None,
                    'updated_at': diagnosis_result.updated_at.isoformat() if diagnosis_result.updated_at else None,
                }
                
                # Try to access potentially problematic attributes
                try:
                    debug_info['overall_confidence'] = diagnosis_result.overall_confidence
                except Exception as e:
                    debug_info['overall_confidence_error'] = str(e)
                
                try:
                    debug_info['severity'] = diagnosis_result.severity
                except Exception as e:
                    debug_info['severity_error'] = str(e)
                
                try:
                    debug_info['most_probable_parasite'] = diagnosis_result.most_probable_parasite
                except Exception as e:
                    debug_info['most_probable_parasite_error'] = str(e)
                
                try:
                    debug_info['detections'] = diagnosis_result.detections
                except Exception as e:
                    debug_info['detections_error'] = str(e)
                
                return jsonify({
                    'message': 'Diagnosis result debug info',
                    'debug_info': debug_info
                }), 200
            else:
                return jsonify({
                    'message': 'No diagnosis result found for this test',
                    'test_status': test.status
                }), 200
                
        except Exception as diag_error:
            logger.error(f"Debug: Error accessing diagnosis result: {str(diag_error)}")
            return jsonify({
                'error': 'Error accessing diagnosis result',
                'details': str(diag_error)
            }), 500
            
    except Exception as e:
        logger.error(f"Debug endpoint error: {str(e)}")
        return jsonify({'error': 'Debug endpoint failed', 'details': str(e)}), 500
