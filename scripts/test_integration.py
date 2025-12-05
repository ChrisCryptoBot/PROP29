#!/usr/bin/env python3
"""
Integration test for PROPER 2.9 API
"""
import requests
import json
import time

def test_api_endpoints():
    """Test the main API endpoints"""
    base_url = "http://localhost:8000/api"
    
    print("🧪 Testing PROPER 2.9 API Integration...")
    print("=" * 50)
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✅ Health endpoint: OK")
        else:
            print(f"❌ Health endpoint: Failed ({response.status_code})")
    except Exception as e:
        print(f"❌ Health endpoint: Error - {e}")
    
    # Test authentication
    try:
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        response = requests.post(f"{base_url}/auth/login", json=login_data)
        if response.status_code == 200:
            print("✅ Authentication: OK")
            token = response.json().get("access_token")
        else:
            print(f"❌ Authentication: Failed ({response.status_code})")
            token = None
    except Exception as e:
        print(f"❌ Authentication: Error - {e}")
        token = None
    
    # Test protected endpoints if we have a token
    if token:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test lost and found
        try:
            response = requests.get(f"{base_url}/lost-found", headers=headers)
            if response.status_code == 200:
                print("✅ Lost & Found endpoint: OK")
            else:
                print(f"❌ Lost & Found endpoint: Failed ({response.status_code})")
        except Exception as e:
            print(f"❌ Lost & Found endpoint: Error - {e}")
        
        # Test packages
        try:
            response = requests.get(f"{base_url}/packages", headers=headers)
            if response.status_code == 200:
                print("✅ Packages endpoint: OK")
            else:
                print(f"❌ Packages endpoint: Failed ({response.status_code})")
        except Exception as e:
            print(f"❌ Packages endpoint: Error - {e}")
        
        # Test cybersecurity
        try:
            response = requests.get(f"{base_url}/cybersecurity/threats", headers=headers)
            if response.status_code == 200:
                print("✅ Cybersecurity endpoint: OK")
            else:
                print(f"❌ Cybersecurity endpoint: Failed ({response.status_code})")
        except Exception as e:
            print(f"❌ Cybersecurity endpoint: Error - {e}")
        
        # Test visitors
        try:
            response = requests.get(f"{base_url}/visitors", headers=headers)
            if response.status_code == 200:
                print("✅ Visitors endpoint: OK")
            else:
                print(f"❌ Visitors endpoint: Failed ({response.status_code})")
        except Exception as e:
            print(f"❌ Visitors endpoint: Error - {e}")
    
    print("=" * 50)
    print("🎉 Integration test completed!")

if __name__ == "__main__":
    test_api_endpoints() 