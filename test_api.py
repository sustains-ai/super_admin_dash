#!/usr/bin/env python3
"""
Simple API test script for the Super Admin Dashboard
Run this script to test the basic API functionality
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_api_endpoints():
    """Test basic API endpoints"""

    print("🚀 Testing Super Admin Dashboard API")
    print("=" * 50)

    # Test 1: Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"✅ API Root: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ Server not running. Please start the Django server first.")
        return

    # Test 2: Test login endpoint
    login_data = {
        "email": "admin@superadmin.com",
        "password": "vwP@TI^kpJ8r"
    }

    try:
        response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
        print(f"Login response status: {response.status_code}")
        print(f"Login response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login successful: {data['user']['email']}")
            access_token = data['access_token']

            # Test 3: Get user profile with token
            headers = {"Authorization": f"Bearer {access_token}"}
            response = requests.get(f"{BASE_URL}/users/profile/", headers=headers)
            if response.status_code == 200:
                print("✅ Profile access successful")

            # Test 4: Get pages
            response = requests.get(f"{BASE_URL}/pages/", headers=headers)
            if response.status_code == 200:
                pages = response.json()
                print(f"✅ Pages loaded: {len(pages)} pages found")

            # Test 5: Get user role table (super admin only)
            response = requests.get(f"{BASE_URL}/users/role_table/", headers=headers)
            if response.status_code == 200:
                print("✅ User role table access successful")

            # Test 6: Get permissions
            response = requests.get(f"{BASE_URL}/permissions/", headers=headers)
            if response.status_code == 200:
                permissions = response.json()
                print(f"✅ Permissions loaded: {len(permissions)} permissions found")

        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"❌ Error during testing: {e}")

    print("\n" + "=" * 50)
    print("🎉 API Testing Complete!")
    print("\n📋 Available Endpoints:")
    print(f"  • Admin Interface: http://localhost:8000/admin/")
    print(f"  • API Root: {BASE_URL}/")
    print(f"  • Login: {BASE_URL}/auth/login/")
    print(f"  • Users: {BASE_URL}/users/")
    print(f"  • Pages: {BASE_URL}/pages/")
    print(f"  • Permissions: {BASE_URL}/permissions/")
    print(f"  • Comments: {BASE_URL}/comments/")

if __name__ == "__main__":
    test_api_endpoints()
