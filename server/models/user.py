from datetime import datetime
import uuid

from . import db, bcrypt

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    role = db.Column(db.String(20), default='technician', nullable=False)  # technician, supervisor, admin
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    phone_number = db.Column(db.String(20))
    department = db.Column(db.String(100), nullable=False, default='Laboratory')
    license_number = db.Column(db.String(50))
    
    # Permissions as JSON fields
    permissions = db.Column(db.JSON, default={
        'canUploadSamples': True,
        'canViewAllTests': True,
        'canDeleteTests': False,
        'canManageUsers': False,
        'canExportReports': True
    })
    
    last_login = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tests_collected = db.relationship('Test', foreign_keys='Test.sample_collected_by', lazy=True)
    tests_technician = db.relationship('Test', foreign_keys='Test.technician_id', lazy=True)
    tests_reviewed = db.relationship('Test', foreign_keys='Test.reviewed_by', lazy=True)
    
    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        if 'password' in kwargs:
            self.set_password(kwargs['password'])
        
        # Set default permissions based on role
        if 'role' in kwargs:
            self.set_default_permissions(kwargs['role'])
    
    def set_password(self, password):
        """Hash and set the user's password"""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        """Check if the provided password matches the stored hash"""
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def set_default_permissions(self, role):
        """Set default permissions based on user role"""
        if role == 'admin':
            self.permissions = {
                'canUploadSamples': True,
                'canViewAllTests': True,
                'canDeleteTests': True,
                'canManageUsers': True,
                'canExportReports': True
            }
        elif role == 'supervisor':
            self.permissions = {
                'canUploadSamples': True,
                'canViewAllTests': True,
                'canDeleteTests': True,
                'canManageUsers': False,
                'canExportReports': True
            }
        else:  # technician
            self.permissions = {
                'canUploadSamples': True,
                'canViewAllTests': True,
                'canDeleteTests': False,
                'canManageUsers': False,
                'canExportReports': True
            }
    
    def has_permission(self, permission):
        """Check if user has a specific permission"""
        return self.permissions.get(permission, False)
    
    def to_dict(self):
        """Convert user object to dictionary (excluding sensitive data)"""
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'firstName': self.first_name,
            'lastName': self.last_name,
            'role': self.role,
            'isActive': self.is_active,
            'phoneNumber': self.phone_number,
            'department': self.department,
            'licenseNumber': self.license_number,
            'permissions': self.permissions,
            'lastLogin': self.last_login.isoformat() if self.last_login else None,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }
    
    def to_dict_public(self):
        """Convert user object to public dictionary (minimal info)"""
        return {
            'id': self.id,
            'username': self.username,
            'firstName': self.first_name,
            'lastName': self.last_name,
            'role': self.role,
            'department': self.department
        }
    
    def update_last_login(self):
        """Update the last login timestamp"""
        self.last_login = datetime.utcnow()
        db.session.commit()
    
    @staticmethod
    def create_user(email, username, password, first_name, last_name, role='technician', 
                   department='Laboratory', phone_number=None, license_number=None):
        """Create a new user with hashed password"""
        user = User(
            email=email,
            username=username,
            first_name=first_name,
            last_name=last_name,
            role=role,
            department=department,
            phone_number=phone_number,
            license_number=license_number
        )
        user.set_password(password)
        return user
    
    def __repr__(self):
        return f'<User {self.username}>'
