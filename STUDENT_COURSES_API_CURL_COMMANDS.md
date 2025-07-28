# Student Courses API - cURL Commands

This file contains cURL commands for testing the Student Courses API endpoint.

## Prerequisites

1. Make sure the server is running on `http://localhost:3000`
2. Get a valid JWT token by logging in as a faculty or admin user
3. Have a valid student ID to test with

## Authentication

First, get an authentication token:

```bash
# Login as faculty
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "faculty@university.edu",
    "password": "Password123!"
  }'
```

Save the token from the response for use in subsequent requests.

## Basic API Calls

### 1. Get All Courses for a Student

```bash
# Replace STUDENT_ID with actual student ID and TOKEN with your JWT token
curl -X GET \
  "http://localhost:3000/api/courses/student/STUDENT_ID/courses" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

### 2. Get Courses with Pagination

```bash
# Get first page with 5 courses per page
curl -X GET \
  "http://localhost:3000/api/courses/student/STUDENT_ID/courses?page=1&limit=5" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"

# Get second page with 5 courses per page
curl -X GET \
  "http://localhost:3000/api/courses/student/STUDENT_ID/courses?page=2&limit=5" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

### 3. Get Courses with Sorting

```bash
# Sort by course code in ascending order
curl -X GET \
  "http://localhost:3000/api/courses/student/STUDENT_ID/courses?sortBy=code&sortOrder=asc" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"

# Sort by course name in descending order
curl -X GET \
  "http://localhost:3000/api/courses/student/STUDENT_ID/courses?sortBy=name&sortOrder=desc" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"

# Sort by credit hours in ascending order
curl -X GET \
  "http://localhost:3000/api/courses/student/STUDENT_ID/courses?sortBy=creditHours&sortOrder=asc" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

### 4. Get Courses with Filtering

```bash
# Filter by active courses only
curl -X GET \
  "http://localhost:3000/api/courses/student/STUDENT_ID/courses?status=active" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"

# Filter by inactive courses only
curl -X GET \
  "http://localhost:3000/api/courses/student/STUDENT_ID/courses?status=inactive" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"

# Filter by specific semester
curl -X GET \
  "http://localhost:3000/api/courses/student/STUDENT_ID/courses?semester=1" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"

# Filter by specific year
curl -X GET \
  "http://localhost:3000/api/courses/student/STUDENT_ID/courses?year=2024" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"

# Filter by semester and year
curl -X GET \
  "http://localhost:3000/api/courses/student/STUDENT_ID/courses?semester=1&year=2024" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

### 5. Combined Filtering, Sorting, and Pagination

```bash
# Get active courses, sorted by code descending, page 2 with 3 courses per page
curl -X GET \
  "http://localhost:3000/api/courses/student/STUDENT_ID/courses?status=active&sortBy=code&sortOrder=desc&page=2&limit=3" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"

# Get courses from semester 1, 2024, sorted by credit hours, page 1 with 10 courses per page
curl -X GET \
  "http://localhost:3000/api/courses/student/STUDENT_ID/courses?semester=1&year=2024&sortBy=creditHours&sortOrder=asc&page=1&limit=10" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

## Error Testing

### 1. Test Invalid Student ID

```bash
# Test with invalid MongoDB ObjectId format
curl -X GET \
  "http://localhost:3000/api/courses/student/invalid-id/courses" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

### 2. Test Non-existent Student ID

```bash
# Test with valid format but non-existent student ID
curl -X GET \
  "http://localhost:3000/api/courses/student/507f1f77bcf86cd799439999/courses" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

### 3. Test Without Authentication

```bash
# Test without Authorization header
curl -X GET \
  "http://localhost:3000/api/courses/student/STUDENT_ID/courses" \
  -H "Content-Type: application/json"
```

### 4. Test Invalid Token

```bash
# Test with invalid JWT token
curl -X GET \
  "http://localhost:3000/api/courses/student/STUDENT_ID/courses" \
  -H "Authorization: Bearer invalid-token" \
  -H "Content-Type: application/json"
```

## Expected Responses

### Success Response Example

```json
{
  "success": true,
  "message": "Courses retrieved successfully",
  "timestamp": "2025-07-28T13:59:59.021Z",
  "data": [
    {
      "course_id": "507f1f77bcf86cd799439011",
      "course_name": "Introduction to Programming",
      "faculty_id": "507f1f77bcf86cd799439012",
      "semester": "1 2024",
      "code": "CS101",
      "creditHours": 3,
      "year": 2024,
      "status": "active",
      "faculty": {
        "_id": "507f1f77bcf86cd799439012",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@university.edu"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### Error Response Examples

**400 Bad Request (Invalid Student ID)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "studentId",
      "message": "Invalid student ID format",
      "value": "invalid-id"
    }
  ]
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "message": "Access token is required"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Student not found"
}
```

## Testing Script

You can create a shell script to test multiple scenarios:

```bash
#!/bin/bash

# Set your token and student ID
TOKEN="your-jwt-token-here"
STUDENT_ID="your-student-id-here"
BASE_URL="http://localhost:3000"

echo "Testing Student Courses API..."

# Test 1: Basic request
echo "Test 1: Basic request"
curl -s -X GET \
  "$BASE_URL/api/courses/student/$STUDENT_ID/courses" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n---\n"

# Test 2: With pagination
echo "Test 2: With pagination"
curl -s -X GET \
  "$BASE_URL/api/courses/student/$STUDENT_ID/courses?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n---\n"

# Test 3: With sorting
echo "Test 3: With sorting"
curl -s -X GET \
  "$BASE_URL/api/courses/student/$STUDENT_ID/courses?sortBy=code&sortOrder=desc" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n---\n"

# Test 4: With filtering
echo "Test 4: With filtering"
curl -s -X GET \
  "$BASE_URL/api/courses/student/$STUDENT_ID/courses?status=active" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n---\n"

# Test 5: Error case - invalid student ID
echo "Test 5: Error case - invalid student ID"
curl -s -X GET \
  "$BASE_URL/api/courses/student/invalid-id/courses" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n---\n"

echo "Testing completed!"
```

Save this as `test-student-courses.sh`, make it executable with `chmod +x test-student-courses.sh`, and run it to test all scenarios.

## Notes

- Replace `STUDENT_ID` with an actual student ID from your database
- Replace `TOKEN` with a valid JWT token obtained from login
- The `jq` command is used for pretty-printing JSON responses (install with `brew install jq` on macOS or `apt-get install jq` on Ubuntu)
- All responses follow the standard API response format used throughout the application 