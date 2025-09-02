from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from datetime import timedelta, datetime
import os
import logging
from logging.handlers import RotatingFileHandler
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]',
    handlers=[
        RotatingFileHandler('logs/app.log', maxBytes=10240000, backupCount=10),
        logging.StreamHandler()
    ]
)

# Import models and routes
from models import db, bcrypt
from routes.auth import auth_bp
from routes.patients import patients_bp
from routes.tests import tests_bp
from routes.upload import upload_bp
from routes.dashboard import dashboard_bp
from routes.activity_logs import activity_logs_bp

def create_app():
    """Application factory pattern"""
    # Fix working directory to ensure imports work correctly
    import os
    import sys
    
    # Get the directory where this file is located
    server_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Change to the server directory
    os.chdir(server_dir)
    
    # Add server directory to Python path if not already there
    if server_dir not in sys.path:
        sys.path.insert(0, server_dir)
    
    print(f"Flask app working directory set to: {os.getcwd()}")
    print(f"Python path includes server directory: {server_dir in sys.path}")
    
    app = Flask(__name__)
    
    # Ensure logs directory exists
    os.makedirs('logs', exist_ok=True)
    
    # Configure app logging
    if not app.debug:
        if not os.path.exists('logs'):
            os.mkdir('logs')
        file_handler = RotatingFileHandler('logs/app.log', maxBytes=10240000, backupCount=10)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('Malaria Lab startup')
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
        'DATABASE_URL', 
        'sqlite:///malaria_lab.db'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # File upload configuration
    app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
    app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'uploads')
    
    # JWT Configuration
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-jwt-secret-key-here')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'
    
    # Ensure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    jwt = JWTManager(app)
    migrate = Migrate(app, db)
    
    # Enable CORS
    CORS(app, resources={
        r"/*": {
            "origins": ["*"],  # In production, restrict this to your mobile app domain
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Request logging middleware
    @app.before_request
    def log_request_info():
        app.logger.info(f"Request: {request.method} {request.path}")
        app.logger.debug(f"Headers: {dict(request.headers)}")
        if request.is_json:
            app.logger.debug(f"Body: {request.get_json()}")
    
    # Response logging middleware
    @app.after_request
    def log_response_info(response):
        app.logger.info(f"Response: {response.status_code}")
        return response
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(patients_bp, url_prefix='/api/patients')
    app.register_blueprint(tests_bp, url_prefix='/api/tests')
    app.register_blueprint(upload_bp, url_prefix='/api/upload')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(activity_logs_bp, url_prefix='/api/activity-logs')

    # Static serving for uploaded/annotated images
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        try:
            root = os.path.abspath(app.config['UPLOAD_FOLDER'])
            return send_from_directory(root, filename)
        except Exception:
            return {'error': 'File not found'}, 404

    @app.route('/annotated/<path:filename>')
    def annotated_file(filename):
        try:
            root = os.path.abspath(os.path.dirname(__file__))
            return send_from_directory(root, filename)
        except Exception:
            return {'error': 'File not found'}, 404
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal server error'}, 500
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        """Health check endpoint for server discovery"""
        return jsonify({
            'status': 'healthy',
            'service': 'malaria-lab-server',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0'
        }), 200

    # Test malaria detection endpoint
    @app.route('/api/test-malaria-detection')
    def test_malaria_detection():
        try:
            from malaria_detector import MalariaDetector
            from analysis import MalariaAnalyzer
            from services.ai_analysis import ai_service
            
            return {
                'status': 'success',
                'message': 'Malaria detection components imported successfully',
                'components': {
                    'malaria_detector': '✅ Imported',
                    'analysis': '✅ Imported', 
                    'ai_service': '✅ Imported'
                }
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to import malaria detection components: {str(e)}',
                'error': str(e)
            }, 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    
    # Create database tables
    with app.app_context():
        db.create_all()
        print("Database tables created successfully!")
    
    # Run the app
    app.run(
        host=os.getenv('HOST', '0.0.0.0'),
        port=int(os.getenv('PORT', 5000)),
        debug=os.getenv('FLASK_ENV') == 'development'
    )
