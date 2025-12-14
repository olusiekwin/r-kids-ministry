#!/bin/bash

# Super Admin API Test Script
# This script tests the super admin functionality

BASE_URL="http://localhost:5000/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Super Admin API Tests"
echo "=========================================="
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "Response: $body"
else
    echo -e "${RED}✗ Health check failed (HTTP $http_code)${NC}"
    echo "Response: $body"
fi
echo ""

# Test 2: Login as Super Admin (assuming email starts with "superadmin")
echo -e "${YELLOW}Test 2: Login as Super Admin${NC}"
login_response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "superadmin@test.com", "password": "password123"}')
echo "Login Response: $login_response"
token=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
otp_code=$(echo "$login_response" | grep -o '"otpCode":"[^"]*' | cut -d'"' -f4)

if [ -z "$token" ]; then
    echo -e "${RED}✗ Login failed - no token received${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}"
echo "Token: ${token:0:50}..."
echo "OTP Code: $otp_code"
echo ""

# Test 3: Verify MFA
echo -e "${YELLOW}Test 3: Verify MFA${NC}"
mfa_response=$(curl -s -X POST "$BASE_URL/auth/verify-mfa" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $token" \
    -d "{\"code\": \"$otp_code\", \"token\": \"$token\"}")
echo "MFA Response: $mfa_response"

final_token=$(echo "$mfa_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
user_role=$(echo "$mfa_response" | grep -o '"role":"[^"]*' | cut -d'"' -f4)

if [ -z "$final_token" ]; then
    echo -e "${RED}✗ MFA verification failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ MFA verification successful${NC}"
echo "Final Token: ${final_token:0:50}..."
echo "User Role: $user_role"
echo ""

# Test 4: List Users (should require admin/super_admin)
echo -e "${YELLOW}Test 4: List Users (as Super Admin)${NC}"
list_response=$(curl -s -w "\n%{http_code}" "$BASE_URL/users" \
    -H "Authorization: Bearer $final_token")
http_code=$(echo "$list_response" | tail -n1)
body=$(echo "$list_response" | sed '$d')
if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ List users successful${NC}"
    echo "Response: $body" | head -c 200
    echo "..."
else
    echo -e "${RED}✗ List users failed (HTTP $http_code)${NC}"
    echo "Response: $body"
fi
echo ""

# Test 5: Create Admin User (should only work for super admin)
echo -e "${YELLOW}Test 5: Create Admin User (as Super Admin)${NC}"
create_admin_response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/users" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $final_token" \
    -d '{
        "name": "Test Admin User",
        "email": "testadmin@rkids.church",
        "role": "admin"
    }')
http_code=$(echo "$create_admin_response" | tail -n1)
body=$(echo "$create_admin_response" | sed '$d')
if [ "$http_code" == "201" ]; then
    echo -e "${GREEN}✓ Create admin user successful${NC}"
    echo "Response: $body"
elif [ "$http_code" == "403" ]; then
    echo -e "${RED}✗ Create admin user forbidden (HTTP 403)${NC}"
    echo "Response: $body"
elif [ "$http_code" == "400" ]; then
    echo -e "${YELLOW}⚠ Create admin user failed - user may already exist (HTTP 400)${NC}"
    echo "Response: $body"
else
    echo -e "${RED}✗ Create admin user failed (HTTP $http_code)${NC}"
    echo "Response: $body"
fi
echo ""

# Test 6: List Users by Role (Admin)
echo -e "${YELLOW}Test 6: List Users by Role (Admin)${NC}"
list_admin_response=$(curl -s -w "\n%{http_code}" "$BASE_URL/users?role=admin" \
    -H "Authorization: Bearer $final_token")
http_code=$(echo "$list_admin_response" | tail -n1)
body=$(echo "$list_admin_response" | sed '$d')
if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ List admin users successful${NC}"
    echo "Response: $body" | head -c 300
    echo "..."
else
    echo -e "${RED}✗ List admin users failed (HTTP $http_code)${NC}"
    echo "Response: $body"
fi
echo ""

# Test 7: Test without authentication (should fail)
echo -e "${YELLOW}Test 7: Create User without Authentication${NC}"
no_auth_response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/users" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Unauthorized User",
        "email": "unauthorized@test.com",
        "role": "teacher"
    }')
http_code=$(echo "$no_auth_response" | tail -n1)
body=$(echo "$no_auth_response" | sed '$d')
if [ "$http_code" == "401" ] || [ "$http_code" == "403" ]; then
    echo -e "${GREEN}✓ Unauthorized request correctly rejected (HTTP $http_code)${NC}"
    echo "Response: $body"
else
    echo -e "${RED}✗ Security issue - unauthorized request not rejected (HTTP $http_code)${NC}"
    echo "Response: $body"
fi
echo ""

# Test 8: Test as regular admin trying to create admin (should fail)
echo -e "${YELLOW}Test 8: Regular Admin Trying to Create Admin${NC}"
echo "Note: This test requires logging in as a regular admin first"
echo "Skipping for now - would need regular admin credentials"
echo ""

echo "=========================================="
echo "Tests Complete"
echo "=========================================="
