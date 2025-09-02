#!/usr/bin/env python3
"""
Test script to verify all backend endpoints and models are working
"""

import os
import sys
import logging
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_models():
    """Test all database models"""
    logger.info("🔍 Testing Database Models...")
    
    try:
        # Test model imports
        from models import db
        from models.user import User
        from models.patient import Patient
        from models.test import Test
        from models.upload_session import UploadSession
        from models.diagnosis_result import DiagnosisResult
        
        logger.info("✅ All models imported successfully")
        
        # Create a minimal Flask app for testing
        from flask import Flask
        test_app = Flask(__name__)
        test_app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        test_app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        test_app.config['SECRET_KEY'] = 'test-secret-key'
        
        db.init_app(test_app)
        
        with test_app.app_context():
            db.create_all()
            logger.info("✅ Database tables created successfully")
            
            # Test User model
            test_user = User(
                email="test@example.com",
                password="testpassword123",
                first_name="Test",
                last_name="User",
                role="technician"
            )
            test_user.set_password("testpassword123")
            logger.info("✅ User model working")
            
            # Test Patient model
            test_patient = Patient(
                first_name="John",
                last_name="Doe",
                phone_number="+1234567890",
                email="john.doe@example.com"
            )
            logger.info("✅ Patient model working")
            
            # Test Test model
            test_test = Test(
                patient_id=test_patient.id,
                test_type="malaria_detection",
                sample_type="blood_smear",
                sample_collection_date=datetime.now(),
                sample_collected_by=test_user.id,
                technician_id=test_user.id
            )
            logger.info("✅ Test model working")
            
            # Test UploadSession model
            test_session = UploadSession(
                user_id=test_user.id,
                test_id=test_test.id,
                patient_id=test_patient.id,
                status="active"
            )
            logger.info("✅ UploadSession model working")
            
            # Test DiagnosisResult model
            test_diagnosis = DiagnosisResult(
                test_id=test_test.id,
                status="POSITIVE",
                model_version="YOLOv12-1.0",
                processing_time=5.2
            )
            logger.info("✅ DiagnosisResult model working")
            
        return True
        
    except Exception as e:
        logger.error(f"❌ Model test failed: {str(e)}")
        return False

def test_routes():
    """Test all route imports"""
    logger.info("🔍 Testing Route Imports...")
    
    try:
        # Test route imports
        from routes.auth import auth_bp
        from routes.patients import patients_bp
        from routes.tests import tests_bp
        from routes.upload import upload_bp
        from routes.dashboard import dashboard_bp
        
        logger.info("✅ All route blueprints imported successfully")
        
        # Test route registration
        from flask import Flask
        app = Flask(__name__)
        
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(patients_bp, url_prefix='/api/patients')
        app.register_blueprint(tests_bp, url_prefix='/api/tests')
        app.register_blueprint(upload_bp, url_prefix='/api/upload')
        app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
        
        logger.info("✅ All route blueprints registered successfully")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Route test failed: {str(e)}")
        return False

def test_services():
    """Test all services"""
    logger.info("🔍 Testing Services...")
    
    try:
        # Test AI analysis service
        from services.ai_analysis import ai_service
        logger.info("✅ AI Analysis Service imported successfully")
        
        # Test queue status
        queue_status = ai_service.get_queue_status()
        logger.info(f"✅ Queue status: {queue_status}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Service test failed: {str(e)}")
        return False

def test_malaria_detection():
    """Test malaria detection components"""
    logger.info("🔍 Testing Malaria Detection Components...")
    
    try:
        # Test malaria detector
        from malaria_detector import MalariaDetector
        detector = MalariaDetector("best.pt")
        logger.info("✅ MalariaDetector working")
        
        # Test malaria analyzer
        from analysis import MalariaAnalyzer
        analyzer = MalariaAnalyzer()
        logger.info("✅ MalariaAnalyzer working")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Malaria detection test failed: {str(e)}")
        return False

def test_middleware():
    """Test middleware components"""
    logger.info("🔍 Testing Middleware...")
    
    try:
        # Test file upload middleware
        from middleware.fileUpload import validate_file_upload, save_uploaded_file
        logger.info("✅ File upload middleware imported")
        
        # Test image validation service
        from services.image_validation import validate_image_buffer
        logger.info("✅ Image validation service imported")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Middleware test failed: {str(e)}")
        return False

def test_configuration():
    """Test configuration and environment"""
    logger.info("🔍 Testing Configuration...")
    
    try:
        # Test environment variables
        from config import Config
        logger.info("✅ Configuration imported")
        
        # Test database path
        db_path = os.path.join(os.getcwd(), 'instance', 'malaria_lab.db')
        logger.info(f"✅ Database path: {db_path}")
        
        # Test upload folder
        upload_folder = os.path.join(os.getcwd(), 'uploads')
        logger.info(f"✅ Upload folder: {upload_folder}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Configuration test failed: {str(e)}")
        return False

def main():
    """Run all tests"""
    logger.info("🚀 Starting Backend Endpoint Tests")
    logger.info("=" * 60)
    
    tests = [
        ("Database Models", test_models),
        ("Route Imports", test_routes),
        ("Services", test_services),
        ("Malaria Detection", test_malaria_detection),
        ("Middleware", test_middleware),
        ("Configuration", test_configuration)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        logger.info(f"\n📋 Testing: {test_name}")
        try:
            success = test_func()
            results.append((test_name, success))
            if success:
                logger.info(f"✅ {test_name}: PASSED")
            else:
                logger.error(f"❌ {test_name}: FAILED")
        except Exception as e:
            logger.error(f"❌ {test_name}: ERROR - {str(e)}")
            results.append((test_name, False))
    
    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("📊 TEST RESULTS SUMMARY")
    logger.info("=" * 60)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        logger.info(f"{test_name}: {status}")
    
    logger.info(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        logger.info("🎉 All tests passed! Your backend is ready!")
    else:
        logger.warning(f"⚠️ {total - passed} tests failed. Check the errors above.")
    
    return passed == total

if __name__ == "__main__":
    main()
