#!/usr/bin/env python3
"""
Start Flask server and test endpoints
"""

import requests
import time
import threading
import logging
from app import create_app

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def start_server():
    """Start the Flask server in a separate thread"""
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)

def test_endpoints():
    """Test all the API endpoints"""
    base_url = "http://localhost:5000"
    
    # Wait for server to start
    logger.info("⏳ Waiting for server to start...")
    time.sleep(5)
    
    tests = [
        ("Health Check", f"{base_url}/health", "GET"),
        ("Dashboard", f"{base_url}/api/dashboard", "GET"),
        ("Auth Status", f"{base_url}/api/auth/status", "GET"),
        ("Patients List", f"{base_url}/api/patients", "GET"),
        ("Tests List", f"{base_url}/api/tests", "GET"),
        ("Upload Status", f"{base_url}/api/upload/queue/status", "GET"),
    ]
    
    results = []
    
    for test_name, url, method in tests:
        logger.info(f"\n🔍 Testing: {test_name}")
        logger.info(f"   URL: {url}")
        logger.info(f"   Method: {method}")
        
        try:
            if method == "GET":
                response = requests.get(url, timeout=10)
            else:
                response = requests.post(url, timeout=10)
            
            logger.info(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                logger.info(f"   ✅ {test_name}: SUCCESS")
                results.append((test_name, True))
            elif response.status_code == 401:
                logger.info(f"   🔒 {test_name}: UNAUTHORIZED (expected for protected endpoints)")
                results.append((test_name, True))
            elif response.status_code == 404:
                logger.info(f"   ❌ {test_name}: NOT FOUND")
                results.append((test_name, False))
            else:
                logger.info(f"   ⚠️ {test_name}: STATUS {response.status_code}")
                results.append((test_name, False))
                
        except requests.exceptions.ConnectionError:
            logger.error(f"   ❌ {test_name}: CONNECTION ERROR (server not ready)")
            results.append((test_name, False))
        except requests.exceptions.Timeout:
            logger.error(f"   ❌ {test_name}: TIMEOUT")
            results.append((test_name, False))
        except Exception as e:
            logger.error(f"   ❌ {test_name}: ERROR - {str(e)}")
            results.append((test_name, False))
    
    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("📊 ENDPOINT TEST RESULTS")
    logger.info("=" * 60)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        logger.info(f"{test_name}: {status}")
    
    logger.info(f"\nOverall: {passed}/{total} endpoints working")
    
    if passed == total:
        logger.info("🎉 All endpoints are working! Your backend is ready!")
    else:
        logger.warning(f"⚠️ {total - passed} endpoints have issues.")
    
    return passed == total

def main():
    """Main function"""
    logger.info("🚀 Starting Flask Server and Testing Endpoints")
    logger.info("=" * 60)
    
    # Start server in background thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    logger.info("✅ Server started in background thread")
    
    # Test endpoints
    success = test_endpoints()
    
    logger.info("\n" + "=" * 60)
    if success:
        logger.info("🎉 Backend testing completed successfully!")
    else:
        logger.warning("⚠️ Some endpoints need attention.")
    
    logger.info("Server will continue running. Press Ctrl+C to stop.")

if __name__ == "__main__":
    try:
        main()
        # Keep the main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("\n🛑 Server stopped by user")
