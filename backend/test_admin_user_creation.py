#!/usr/bin/env python3
"""
Test script to verify admin user creation functionality
Tests the backend API endpoints for creating users
"""
import requests
import json
import sys

BASE_URL = "http://localhost:5000/api"

def test_health():
    """Test backend health"""
    print("🔍 Testing backend health...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend is running")
            print(f"   Status: {data.get('status')}")
            print(f"   Supabase API: {data.get('supabase_api', 'N/A')}")
            print(f"   PostgreSQL: {data.get('postgresql', 'N/A')}")
            return True
        else:
            print(f"❌ Backend returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running. Please start it with: python app.py")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_login():
    """Test admin login"""
    print("\n🔍 Testing admin login...")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "admin@rkids.church", "password": "password123"}
        )
        if response.status_code == 200:
            data = response.json()
            token = data.get('data', {}).get('token')
            otp_code = data.get('data', {}).get('otpCode')
            print(f"✅ Login successful")
            print(f"   Token: {token[:20]}...")
            print(f"   OTP Code: {otp_code}")
            return token, otp_code
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None, None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None, None

def test_verify_mfa(token, otp_code):
    """Test MFA verification"""
    print("\n🔍 Testing MFA verification...")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/verify-mfa",
            json={"code": otp_code, "token": token},
            headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code == 200:
            data = response.json()
            verified_token = data.get('data', {}).get('token')
            user = data.get('data', {}).get('user', {})
            print(f"✅ MFA verification successful")
            print(f"   User: {user.get('name')} ({user.get('role')})")
            return verified_token
        else:
            print(f"❌ MFA verification failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_create_user(token, user_data):
    """Test creating a user"""
    print(f"\n🔍 Testing user creation ({user_data['role']})...")
    try:
        response = requests.post(
            f"{BASE_URL}/users",
            json=user_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code == 200:
            data = response.json()
            created_user = data.get('data', {})
            print(f"✅ User created successfully")
            print(f"   Name: {created_user.get('name')}")
            print(f"   Email: {created_user.get('email')}")
            print(f"   Role: {created_user.get('role')}")
            print(f"   ID: {created_user.get('id')}")
            return True
        else:
            print(f"❌ User creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_list_users(token, role):
    """Test listing users by role"""
    print(f"\n🔍 Testing list users (role: {role})...")
    try:
        response = requests.get(
            f"{BASE_URL}/users?role={role}",
            headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code == 200:
            data = response.json()
            users = data.get('data', [])
            print(f"✅ Found {len(users)} {role}(s)")
            for user in users:
                print(f"   - {user.get('name')} ({user.get('email')})")
            return users
        else:
            print(f"❌ List users failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return []
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def main():
    print("=" * 60)
    print("R-KIDS Backend Admin User Creation Test")
    print("=" * 60)
    
    # Test 1: Health check
    if not test_health():
        sys.exit(1)
    
    # Test 2: Login
    token, otp_code = test_login()
    if not token:
        sys.exit(1)
    
    # Test 3: Verify MFA
    verified_token = test_verify_mfa(token, otp_code)
    if not verified_token:
        print("\n⚠️  MFA verification failed. Using original token...")
        verified_token = token
    
    # Test 4: Create a teacher
    teacher_data = {
        "name": "Test Teacher",
        "email": "teacher@rkids.church",
        "role": "teacher"
    }
    test_create_user(verified_token, teacher_data)
    
    # Test 5: Create a teen
    teen_data = {
        "name": "Test Teen",
        "email": "teen@rkids.church",
        "role": "teen"
    }
    test_create_user(verified_token, teen_data)
    
    # Test 6: List created users
    print("\n" + "=" * 60)
    print("Verifying created users...")
    print("=" * 60)
    test_list_users(verified_token, "teacher")
    test_list_users(verified_token, "teen")
    
    print("\n" + "=" * 60)
    print("✅ Test completed!")
    print("=" * 60)

if __name__ == "__main__":
    main()

