import re

def validate_email(email):
    """
    Validate email format using regex
    """
    if not email:
        return False
    
    # Basic email regex pattern
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """
    Validate password strength
    - At least 8 characters long
    - Contains at least one letter and one number
    """
    if not password or len(password) < 8:
        return False
    
    # Check if password contains at least one letter and one number
    has_letter = re.search(r'[a-zA-Z]', password)
    has_number = re.search(r'\d', password)
    
    return has_letter and has_number

def validate_username(username):
    """
    Validate username format
    - 3-20 characters long
    - Contains only letters, numbers, and underscores
    - Cannot start or end with underscore
    """
    if not username or len(username) < 3 or len(username) > 20:
        return False
    
    # Check if username contains only allowed characters
    pattern = r'^[a-zA-Z0-9_]+$'
    if not re.match(pattern, username):
        return False
    
    # Check if username doesn't start or end with underscore
    if username.startswith('_') or username.endswith('_'):
        return False
    
    return True

def validate_phone(phone):
    """
    Validate phone number format
    - Accepts various formats: +1234567890, 123-456-7890, (123) 456-7890, etc.
    """
    if not phone:
        return False
    
    # Remove all non-digit characters except +
    cleaned = re.sub(r'[^\d+]', '', phone)
    
    # Check if it's a valid length (7-15 digits)
    if len(cleaned) < 7 or len(cleaned) > 15:
        return False
    
    # If it starts with +, it should have country code
    if cleaned.startswith('+') and len(cleaned) < 8:
        return False
    
    return True

def sanitize_input(text):
    """
    Sanitize user input by removing potentially dangerous characters
    """
    if not text:
        return ""
    
    # Remove HTML tags and scripts
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'<script.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    
    # Remove SQL injection patterns
    sql_patterns = [
        r'(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT|SCRIPT)\b)',
        r'(\b(OR|AND)\b\s+\d+\s*=\s*\d+)',
        r'(\b(OR|AND)\b\s+\'[^\']*\'\s*=\s*\'[^\']*\')',
        r'(\b(OR|AND)\b\s+\d+\s*LIKE\s*\'[^\']*\')',
        r'(\b(OR|AND)\b\s+\'[^\']*\'\s*LIKE\s*\'[^\']*\')',
    ]
    
    for pattern in sql_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    
    return text.strip()

def validate_file_type(filename, allowed_extensions):
    """
    Validate file type based on extension
    """
    if not filename:
        return False
    
    # Get file extension
    extension = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    
    return extension in allowed_extensions

def validate_file_size(file_size, max_size_mb):
    """
    Validate file size
    """
    max_size_bytes = max_size_mb * 1024 * 1024
    return file_size <= max_size_bytes
