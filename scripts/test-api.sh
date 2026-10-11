#!/bin/bash

# API Testing Script for Parent Engagement Features
# Tests all major endpoints to verify functionality

set -e

# Configuration
API_URL="${API_URL:-http://localhost:3000/api/v1}"
TEACHER_EMAIL="${TEACHER_EMAIL:-teacher@school.com}"
TEACHER_PASSWORD="${TEACHER_PASSWORD:-password123}"
PARENT_EMAIL="${PARENT_EMAIL:-parent@email.com}"
PARENT_PASSWORD="${PARENT_PASSWORD:-password123}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test results
PASSED=0
FAILED=0

# Helper function to make API requests
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4

    if [ -z "$token" ]; then
        curl -s -X "$method" "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data"
    else
        curl -s -X "$method" "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data"
    fi
}

# Helper function to check test result
check_result() {
    local test_name=$1
    local result=$2

    if echo "$result" | grep -q "error\|Error\|unauthorized\|Unauthorized\|forbidden\|Forbidden"; then
        echo -e "${RED}✗ FAILED: $test_name${NC}"
        echo "  Response: $result"
        FAILED=$((FAILED + 1))
    else
        echo -e "${GREEN}✓ PASSED: $test_name${NC}"
        PASSED=$((PASSED + 1))
    fi
}

echo "🧪 Parent Engagement Features API Tests"
echo "========================================"
echo "API URL: $API_URL"
echo ""

# Test 1: Teacher Login
echo "Test 1: Teacher Login"
TEACHER_LOGIN=$(api_call "POST" "/auth/login" "{\"email\":\"$TEACHER_EMAIL\",\"password\":\"$TEACHER_PASSWORD\"}")
TEACHER_TOKEN=$(echo "$TEACHER_LOGIN" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
check_result "Teacher Login" "$TEACHER_LOGIN"
echo ""

# Test 2: Parent Login
echo "Test 2: Parent Login"
PARENT_LOGIN=$(api_call "POST" "/auth/login" "{\"email\":\"$PARENT_EMAIL\",\"password\":\"$PARENT_PASSWORD\"}")
PARENT_TOKEN=$(echo "$PARENT_LOGIN" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
check_result "Parent Login" "$PARENT_LOGIN"
echo ""

if [ -z "$TEACHER_TOKEN" ] || [ -z "$PARENT_TOKEN" ]; then
    echo -e "${RED}Cannot proceed without valid tokens${NC}"
    exit 1
fi

# Test 3: Get Parent's Children
echo "Test 3: Get Parent's Children"
CHILDREN=$(api_call "GET" "/parent-portal/my-children" "" "$PARENT_TOKEN")
check_result "Get Children" "$CHILDREN"
STUDENT_ID=$(echo "$CHILDREN" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "  Student ID: $STUDENT_ID"
echo ""

if [ -z "$STUDENT_ID" ]; then
    echo -e "${YELLOW}No student found. Some tests will be skipped.${NC}"
    STUDENT_ID="test-student-id"
fi

# Test 4: Create Activity (Teacher)
echo "Test 4: Create Activity (Teacher)"
ACTIVITY_DATA="{\"studentId\":\"$STUDENT_ID\",\"activityType\":\"PARTICIPATION\",\"title\":\"API Test Activity\",\"description\":\"Testing activity creation\",\"isVisibleToParents\":true}"
CREATE_ACTIVITY=$(api_call "POST" "/activity-feed" "$ACTIVITY_DATA" "$TEACHER_TOKEN")
check_result "Create Activity" "$CREATE_ACTIVITY"
ACTIVITY_ID=$(echo "$CREATE_ACTIVITY" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo ""

# Test 5: Get Student Activities (Parent)
echo "Test 5: Get Student Activities (Parent)"
GET_ACTIVITIES=$(api_call "GET" "/parent-portal/student/$STUDENT_ID/activities" "" "$PARENT_TOKEN")
check_result "Get Activities" "$GET_ACTIVITIES"
echo ""

# Test 6: Get Student Dashboard (Parent)
echo "Test 6: Get Student Dashboard (Parent)"
GET_DASHBOARD=$(api_call "GET" "/parent-portal/student/$STUDENT_ID/dashboard" "" "$PARENT_TOKEN")
check_result "Get Dashboard" "$GET_DASHBOARD"
echo ""

# Test 7: Create Behavior Record (Teacher)
echo "Test 7: Create Behavior Record (Teacher)"
BEHAVIOR_DATA="{\"studentId\":\"$STUDENT_ID\",\"behaviorType\":\"POSITIVE\",\"category\":\"ACADEMIC_EXCELLENCE\",\"title\":\"API Test Behavior\",\"incidentDate\":\"2026-10-11\",\"points\":10}"
CREATE_BEHAVIOR=$(api_call "POST" "/behavior" "$BEHAVIOR_DATA" "$TEACHER_TOKEN")
check_result "Create Behavior" "$CREATE_BEHAVIOR"
echo ""

# Test 8: Get Student Behavior (Parent)
echo "Test 8: Get Student Behavior (Parent)"
GET_BEHAVIOR=$(api_call "GET" "/parent-portal/student/$STUDENT_ID/behavior" "" "$PARENT_TOKEN")
check_result "Get Behavior" "$GET_BEHAVIOR"
echo ""

# Test 9: Get Homework Summary (Parent)
echo "Test 9: Get Homework Summary (Parent)"
GET_HOMEWORK=$(api_call "GET" "/parent-portal/student/$STUDENT_ID/homework/summary" "" "$PARENT_TOKEN")
check_result "Get Homework Summary" "$GET_HOMEWORK"
echo ""

# Test 10: Get Parent Notifications
echo "Test 10: Get Parent Notifications"
GET_NOTIFICATIONS=$(api_call "GET" "/parent-portal/notifications" "" "$PARENT_TOKEN")
check_result "Get Notifications" "$GET_NOTIFICATIONS"
echo ""

# Summary
echo "========================================"
echo "Test Summary"
echo "========================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Check the output above.${NC}"
    exit 1
fi
