from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import re

from models.patient import db, Patient
from models.user import User
from services.audit_service import AuditService

patients_bp = Blueprint('patients', __name__)

@patients_bp.route('/', methods=['GET'])
@jwt_required()
def get_patients():
    """Get all patients with pagination and search"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        if search:
            # Search patients by name, ID, or phone
            patients = Patient.search_patients(search, limit=per_page)
            total = len(patients)
        else:
            # Get paginated patients
            pagination = Patient.query.paginate(
                page=page, per_page=per_page, error_out=False
            )
            patients = pagination.items
            total = pagination.total
        
        return jsonify({
            'patients': [patient.to_dict_summary() for patient in patients],
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': (total + per_page - 1) // per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch patients', 'details': str(e)}), 500

@patients_bp.route('/<patient_id>', methods=['GET'])
@jwt_required()
def get_patient(patient_id):
    """Get a specific patient by ID"""
    try:
        patient = Patient.query.filter_by(id=patient_id).first()
        
        if not patient:
            return jsonify({'error': 'Patient not found'}), 404
        
        return jsonify({
            'patient': patient.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch patient', 'details': str(e)}), 500

@patients_bp.route('/', methods=['POST'])
@jwt_required()
def create_patient():
    """Create a new patient"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['firstName', 'lastName']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate email format if provided
        if data.get('email') and not re.match(r'^[^@]+@[^@]+\.[^@]+$', data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate phone number format if provided
        if data.get('phoneNumber') and not re.match(r'^\+?[\d\s\-\(\)]+$', data['phoneNumber']):
            return jsonify({'error': 'Invalid phone number format'}), 400
        
        # Validate date of birth if provided
        date_of_birth = None
        if data.get('dateOfBirth'):
            try:
                date_of_birth = datetime.fromisoformat(data['dateOfBirth'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({'error': 'Invalid date format for dateOfBirth'}), 400
        
        # Validate gender if provided
        valid_genders = ['male', 'female', 'other', 'unknown']
        if data.get('gender') and data['gender'] not in valid_genders:
            return jsonify({'error': 'Invalid gender value'}), 400
        

        
        # Get current user
        current_user_id = get_jwt_identity()
        current_user = User.query.filter_by(id=current_user_id).first()
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Create new patient
        patient = Patient(
            first_name=data['firstName'].strip(),
            last_name=data['lastName'].strip(),
            date_of_birth=date_of_birth,
            gender=data.get('gender', 'unknown'),
            phone_number=data.get('phoneNumber'),
            email=data.get('email'),
            created_by=current_user_id
        )
        
        # Calculate age if date of birth is provided
        if date_of_birth:
            patient.calculate_age()
        
        # Add to database
        db.session.add(patient)
        db.session.commit()
        
        # Log the activity
        AuditService.log_patient_activity(
            action='patient_created',
            user=current_user,
            patient=patient,
            details={
                'patientData': {
                    'firstName': data['firstName'],
                    'lastName': data['lastName'],
                    'gender': data.get('gender'),
                    'phoneNumber': data.get('phoneNumber'),
                    'email': data.get('email')
                }
            }
        )
        
        return jsonify({
            'message': 'Patient created successfully',
            'patient': patient.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create patient', 'details': str(e)}), 500

@patients_bp.route('/<patient_id>', methods=['PUT'])
@jwt_required()
def update_patient(patient_id):
    """Update an existing patient"""
    try:
        patient = Patient.query.filter_by(id=patient_id).first()
        
        if not patient:
            return jsonify({'error': 'Patient not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'firstName' in data:
            patient.first_name = data['firstName'].strip()
        if 'lastName' in data:
            patient.last_name = data['lastName'].strip()
        if 'dateOfBirth' in data:
            try:
                patient.date_of_birth = datetime.fromisoformat(data['dateOfBirth'].replace('Z', '+00:00'))
                patient.calculate_age()
            except ValueError:
                return jsonify({'error': 'Invalid date format for dateOfBirth'}), 400
        if 'gender' in data:
            if data['gender'] not in ['male', 'female', 'other', 'unknown']:
                return jsonify({'error': 'Invalid gender value'}), 400
            patient.gender = data['gender']
        if 'phoneNumber' in data:
            if data['phoneNumber'] and not re.match(r'^\+?[\d\s\-\(\)]+$', data['phoneNumber']):
                return jsonify({'error': 'Invalid phone number format'}), 400
            patient.phone_number = data['phoneNumber']
        if 'email' in data:
            if data['email'] and not re.match(r'^[^@]+@[^@]+\.[^@]+$', data['email']):
                return jsonify({'error': 'Invalid email format'}), 400
            patient.email = data['email']
        

        
        # Get current user
        current_user_id = get_jwt_identity()
        current_user = User.query.filter_by(id=current_user_id).first()
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        patient.updated_by = current_user_id
        patient.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log the activity
        AuditService.log_patient_activity(
            action='patient_updated',
            user=current_user,
            patient=patient,
            details={
                'updatedFields': list(data.keys()),
                'updateData': data
            }
        )
        
        return jsonify({
            'message': 'Patient updated successfully',
            'patient': patient.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update patient', 'details': str(e)}), 500

@patients_bp.route('/<patient_id>', methods=['DELETE'])
@jwt_required()
def delete_patient(patient_id):
    """Delete a patient (soft delete)"""
    try:
        patient = Patient.query.filter_by(id=patient_id).first()
        
        if not patient:
            return jsonify({'error': 'Patient not found'}), 404
        
        # Check if patient has any tests
        if patient.tests:
            return jsonify({'error': 'Cannot delete patient with existing tests'}), 400
        
        db.session.delete(patient)
        db.session.commit()
        
        return jsonify({'message': 'Patient deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete patient', 'details': str(e)}), 500

@patients_bp.route('/<patient_id>/tests', methods=['GET'])
@jwt_required()
def get_patient_tests(patient_id):
    """Get all tests for a specific patient"""
    try:
        patient = Patient.query.filter_by(id=patient_id).first()
        
        if not patient:
            return jsonify({'error': 'Patient not found'}), 404
        
        tests = patient.tests
        return jsonify({
            'patient': patient.to_dict_summary(),
            'tests': [test.to_dict_summary() for test in tests],
            'totalTests': len(tests)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch patient tests', 'details': str(e)}), 500

@patients_bp.route('/<patient_id>/medical-history', methods=['POST'])
@jwt_required()
def add_medical_condition(patient_id):
    """Add a medical condition to patient's history"""
    try:
        patient = Patient.query.filter_by(id=patient_id).first()
        
        if not patient:
            return jsonify({'error': 'Patient not found'}), 404
        
        data = request.get_json()
        
        if not data.get('condition') or not data.get('diagnosedDate'):
            return jsonify({'error': 'Condition and diagnosedDate are required'}), 400
        
        try:
            diagnosed_date = datetime.fromisoformat(data['diagnosedDate'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'error': 'Invalid date format for diagnosedDate'}), 400
        
        patient.add_medical_condition(
            condition=data['condition'].strip(),
            diagnosed_date=diagnosed_date,
            notes=data.get('notes', '').strip()
        )
        
        patient.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Medical condition added successfully',
            'patient': patient.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to add medical condition', 'details': str(e)}), 500

@patients_bp.route('/<patient_id>/allergies', methods=['POST'])
@jwt_required()
def add_allergy(patient_id):
    """Add an allergy to patient's list"""
    try:
        patient = Patient.query.filter_by(id=patient_id).first()
        
        if not patient:
            return jsonify({'error': 'Patient not found'}), 404
        
        data = request.get_json()
        
        if not data.get('allergy'):
            return jsonify({'error': 'Allergy is required'}), 400
        
        patient.add_allergy(data['allergy'].strip())
        patient.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Allergy added successfully',
            'patient': patient.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to add allergy', 'details': str(e)}), 500

@patients_bp.route('/search', methods=['GET'])
@jwt_required()
def search_patients():
    """Search patients by query"""
    try:
        query = request.args.get('q', '')
        
        if not query:
            return jsonify({'error': 'Search query is required'}), 400
        
        patients = Patient.search_patients(query, limit=20)
        
        return jsonify({
            'patients': [patient.to_dict_summary() for patient in patients],
            'query': query,
            'total': len(patients)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Search failed', 'details': str(e)}), 500
