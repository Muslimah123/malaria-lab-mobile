from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

# Create centralized instances
db = SQLAlchemy()
bcrypt = Bcrypt()

# Import models after db is defined
from .user import User
from .patient import Patient
from .test import Test
from .diagnosis_result import DiagnosisResult
from .upload_session import UploadSession

__all__ = ['db', 'bcrypt', 'User', 'Patient', 'Test', 'DiagnosisResult', 'UploadSession']
