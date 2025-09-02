#!/usr/bin/env python3
"""
Database initialization script for Malaria Lab
Creates tables and adds sample data
"""

import os
import sys
from datetime import date, datetime
from app import create_app
from models import db, User, Patient, Test

def init_database():
    """Initialize the database with tables and sample data"""
    app = create_app()
    
    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        print("✓ Database tables created successfully!")
        
        # Check if sample data already exists
        if User.query.first():
            print("Sample data already exists. Skipping...")
            return
        
        print("Creating sample data...")
        
        # Create sample users
        print("Creating sample users...")
        
        # Admin user
        admin = User.create_user(
            email='admin@malarialab.com',
            username='admin',
            password='admin123',
            first_name='Admin',
            last_name='User',
            role='admin'
        )
        db.session.add(admin)
        
        # Supervisor user (can be doctor, senior technician, etc.)
        supervisor = User.create_user(
            email='dr.smith@clinic.com',
            username='dr.smith',
            password='password123',
            first_name='John',
            last_name='Smith',
            role='supervisor'
        )
        db.session.add(supervisor)
        
        # Lab technician
        lab_tech = User.create_user(
            email='lab.tech@clinic.com',
            username='lab_tech',
            password='lab123',
            first_name='Sarah',
            last_name='Johnson',
            role='technician'
        )
        db.session.add(lab_tech)
        
        db.session.commit()
        print("✓ Sample users created successfully!")
        
        # Create sample patients
        print("Creating sample patients...")
        
        patient1 = Patient(
            first_name='Alice',
            last_name='Johnson',
            date_of_birth=date(1990, 5, 15),
            gender='female',
            phone_number='+1234567890',
            email='alice.johnson@email.com',
            created_by=admin.id
        )
        db.session.add(patient1)
        
        patient2 = Patient(
            first_name='Bob',
            last_name='Williams',
            date_of_birth=date(1985, 8, 22),
            gender='male',
            phone_number='+1234567892',
            email='bob.williams@email.com',
            created_by=admin.id
        )
        db.session.add(patient2)
        
        patient3 = Patient(
            first_name='Carol',
            last_name='Davis',
            date_of_birth=date(1992, 3, 10),
            gender='female',
            phone_number='+1234567894',
            email='carol.davis@email.com',
            created_by=admin.id
        )
        db.session.add(patient3)
        
        db.session.commit()
        print("✓ Sample patients created successfully!")
        
        # Create sample tests
        print("Creating sample tests...")
        
        test1 = Test(
            patient_id=patient1.id,
            test_type='malaria_detection',
            sample_type='blood_smear',
            sample_collection_date=datetime.now(),
            sample_collected_by=lab_tech.id,
            technician_id=lab_tech.id,
            created_by=lab_tech.id,
            priority='urgent',
            clinical_notes={
                'symptoms': ['Fever', 'chills', 'headache', 'muscle pain'],
                'duration': '3 days',
                'severity': 'moderate',
                'previousTreatment': 'None',
                'additionalNotes': 'Patient presents with fever and chills'
            }
        )
        test1.update_status('completed')
        db.session.add(test1)
        
        test2 = Test(
            patient_id=patient2.id,
            test_type='malaria_detection',
            sample_type='thick_smear',
            sample_collection_date=datetime.now(),
            sample_collected_by=lab_tech.id,
            technician_id=lab_tech.id,
            created_by=lab_tech.id,
            priority='normal',
            clinical_notes={
                'symptoms': [],
                'duration': '',
                'severity': '',
                'previousTreatment': '',
                'additionalNotes': 'Routine screening test'
            }
        )
        test2.update_status('completed')
        db.session.add(test2)
        
        test3 = Test(
            patient_id=patient3.id,
            test_type='malaria_detection',
            sample_type='blood_smear',
            sample_collection_date=datetime.now(),
            sample_collected_by=lab_tech.id,
            technician_id=lab_tech.id,
            created_by=lab_tech.id,
            priority='urgent',
            clinical_notes={
                'symptoms': ['Fever', 'fatigue', 'loss of appetite'],
                'duration': '5 days',
                'severity': 'severe',
                'previousTreatment': 'None',
                'additionalNotes': 'Patient returned from malaria-endemic region'
            }
        )
        test3.update_status('completed')
        db.session.add(test3)
        
        test4 = Test(
            patient_id=patient1.id,
            test_type='malaria_detection',
            sample_type='thin_smear',
            sample_collection_date=datetime.now(),
            sample_collected_by=lab_tech.id,
            technician_id=lab_tech.id,
            created_by=lab_tech.id,
            priority='normal',
            clinical_notes={
                'symptoms': ['Mild fever', 'fatigue'],
                'duration': '1 day',
                'severity': 'mild',
                'previousTreatment': 'Follow-up test after positive rapid test',
                'additionalNotes': 'Follow-up test after positive rapid test'
            }
        )
        test4.update_status('pending')
        db.session.add(test4)
        
        db.session.commit()
        print("✓ Sample tests created successfully!")
        
        print("\n🎉 Database initialization completed successfully!")
        print("\nSample users created:")
        print(f"  Admin: admin@malarialab.com / admin123")
        print(f"  Supervisor: dr.smith@clinic.com / password123")
        print(f"  Lab Tech: lab.tech@clinic.com / lab123")
        print(f"\nSample patients: {Patient.query.count()}")
        print(f"Sample tests: {Test.query.count()}")

if __name__ == '__main__':
    try:
        init_database()
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        sys.exit(1)
