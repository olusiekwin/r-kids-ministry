#!/bin/bash

# Manual API Test Script for Super Admin
BASE_URL="http://localhost:5000/api"

echo "=========================================="
echo "Super Admin API Manual Tests"
echo "=========================================="
echo ""

# Test 1: Health Check
echo "1. Testing Health Endpoint..."
curl -s "$BASE_URL/health"
echo -e "\n"

# Test 2: Login
echo "2. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "superadmin@test.com", "password": "password123"}')
echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extract token and OTP using python
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['data']['token'])" 2>/dev/null)
OTP=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['data']['otpCode'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "ERROR: No token received. Exiting."
    exit 1
fi

echo "Token: ${TOKEN:0:50}..."
echo "OTP: $OTP"
echo ""

# Test 3: Verify MFA
echo "3. Testing MFA Verification..."
MFA_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/verify-mfa" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"code\": \"$OTP\", \"token\": \"$TOKEN\"}")
echo "$MFA_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$MFA_RESPONSE"
echo ""

# Extract final token
FINAL_TOKEN=$(echo "$MFA_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['data']['token'])" 2>/dev/null)
USER_ROLE=$(echo "$MFA_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['data']['user']['role'])" 2>/dev/null)

if [ -z "$FINAL_TOKEN" ]; then
    echo "ERROR: MFA verification failed. Exiting."
    exit 1
fi

echo "Final Token: ${FINAL_TOKEN:0:50}..."
echo "User Role: $USER_ROLE"
echo ""

# Test 4: List Users (should work for admin/super_admin)
echo "4. Testing List Users (requires auth)..."
curl -s -X GET "$BASE_URL/users" \
    -H "Authorization: Bearer $FINAL_TOKEN" | python3 -m json.tool 2>/dev/null | head -30 || \
curl -s -X GET "$BASE_URL/users" \
    -H "Authorization: Bearer $FINAL_TOKEN" | head -30
echo -e "\n"

# Test 5: List Users by Role (Admin)
echo "5. Testing List Users by Role (Admin)..."
curl -s -X GET "$BASE_URL/users?role=admin" \
    -H "Authorization: Bearer $FINAL_TOKEN" | python3 -m json.tool 2>/dev/null | head -30 || \
curl -s -X GET "$BASE_URL/users?role=admin" \
    -H "Authorization: Bearer $FINAL_TOKEN" | head -30
echo -e "\n"

# Test 6: Create Admin User (should work for super_admin only)
echo "6. Testing Create Admin User (super_admin only)..."
CREATE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/users" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $FINAL_TOKEN" \
    -d '{
        "name": "Test Admin User",
        "email": "testadmin'$(date +%s)'@rkids.church",
        "role": "admin"
    }')
HTTP_CODE=$(echo "$CREATE_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$CREATE_RESPONSE" | sed '/HTTP_CODE/d')
echo "HTTP Status: $HTTP_CODE"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

# Test 7: Test without auth (should fail)
echo "7. Testing Create User without Auth (should fail)..."
curl -s -w "\nHTTP Status: %{http_code}\n" -X POST "$BASE_URL/users" \
    -H "Content-Type: application/json" \
    -d '{"name": "Unauthorized", "email": "test@test.com", "role": "teacher"}' | \
    python3 -m json.tool 2>/dev/null || \
curl -s -w "\nHTTP Status: %{http_code}\n" -X POST "$BASE_URL/users" \
    -H "Content-Type: application/json" \
    -d '{"name": "Unauthorized", "email": "test@test.com", "role": "teacher"}'
echo ""

echo "=========================================="
echo "Tests Complete"
echo "=========================================="
