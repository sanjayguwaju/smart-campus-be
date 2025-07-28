# Faculty Students Aggregated API - cURL Commands

This document provides cURL commands to test the new Faculty Students Aggregated API endpoint.

## Base URL
```
http://localhost:3000/api/v1/courses/faculty/{facultyId}/students/aggregated
```

## Authentication
All requests require a Bearer token. Replace `{YOUR_JWT_TOKEN}` with your actual JWT token.

## 1. Basic Request

Get all students for a faculty member with default pagination (page 1, limit 10):

```bash
curl -X GET \
  'http://localhost:3000/api/v1/courses/faculty/507f1f77bcf86cd799439011/students/aggregated' \
  -H 'Authorization: Bearer {YOUR_JWT_TOKEN}' \
  -H 'Content-Type: application/json'
```

## 2. Request with Pagination

Get students with custom pagination (page 2, 20 students per page):

```bash
curl -X GET \
  'http://localhost:3000/api/v1/courses/faculty/507f1f77bcf86cd799439011/students/aggregated?page=2&limit=20' \
  -H 'Authorization: Bearer {YOUR_JWT_TOKEN}' \
  -H 'Content-Type: application/json'
```

## 3. Request with Sorting

Sort students by GPA in descending order:

```bash
curl -X GET \
  'http://localhost:3000/api/v1/courses/faculty/507f1f77bcf86cd799439011/students/aggregated?sortBy=gpa&sortOrder=desc' \
  -H 'Authorization: Bearer {YOUR_JWT_TOKEN}' \
  -H 'Content-Type: application/json'
```

Sort students by total credits in ascending order:

```bash
curl -X GET \
  'http://localhost:3000/api/v1/courses/faculty/507f1f77bcf86cd799439011/students/aggregated?sortBy=totalCredits&sortOrder=asc' \
  -H 'Authorization: Bearer {YOUR_JWT_TOKEN}' \
  -H 'Content-Type: application/json'
```

Sort students by course count in descending order:

```bash
curl -X GET \
  'http://localhost:3000/api/v1/courses/faculty/507f1f77bcf86cd799439011/students/aggregated?sortBy=courseCount&sortOrder=desc' \
  -H 'Authorization: Bearer {YOUR_JWT_TOKEN}' \
  -H 'Content-Type: application/json'
```

## 4. Request with Search

Search for students by name (case-insensitive):

```bash
curl -X GET \
  'http://localhost:3000/api/v1/courses/faculty/507f1f77bcf86cd799439011/students/aggregated?search=john' \
  -H 'Authorization: Bearer {YOUR_JWT_TOKEN}' \
  -H 'Content-Type: application/json'
```

Search for students by email:

```bash
curl -X GET \
  'http://localhost:3000/api/v1/courses/faculty/507f1f77bcf86cd799439011/students/aggregated?search=john.doe@example.com' \
  -H 'Authorization: Bearer {YOUR_JWT_TOKEN}' \
  -H 'Content-Type: application/json'
```

Search for students by student ID:

```bash
curl -X GET \
  'http://localhost:3000/api/v1/courses/faculty/507f1f77bcf86cd799439011/students/aggregated?search=STU001' \
  -H 'Authorization: Bearer {YOUR_JWT_TOKEN}' \
  -H 'Content-Type: application/json'
```

## 5. Request with Course Filter

Get students enrolled in a specific course:

```bash
curl -X GET \
  'http://localhost:3000/api/v1/courses/faculty/507f1f77bcf86cd799439011/students/aggregated?courseId=507f1f77bcf86cd799439012' \
  -H 'Authorization: Bearer {YOUR_JWT_TOKEN}' \
  -H 'Content-Type: application/json'
```

## 6. Request with Enrollment Status Filter

Get only active students:

```bash
curl -X GET \
  'http://localhost:3000/api/v1/courses/faculty/507f1f77bcf86cd799439011/students/aggregated?status=active' \
  -H 'Authorization: Bearer {YOUR_JWT_TOKEN}' \
  -H 'Content-Type: application/json'
```

Get only completed students:

```bash
curl -X GET \
  'http://localhost:3000/api/v1/courses/faculty/507f1f77bcf86cd799439011/students/aggregated?status=completed' \
  -H 'Authorization: Bearer {YOUR_JWT_TOKEN}' \
  -H 'Content-Type: application/json'
```

## 7. Combined Filters

Get active students with high GPA, sorted by GPA descending, with pagination:

```bash
curl -X GET \
  'http://localhost:3000/api/v1/courses/faculty/507f1f77bcf86cd799439011/students/aggregated?status=active&sortBy=gpa&sortOrder=desc&page=1&limit=15' \
  -H 'Authorization: Bearer {YOUR_JWT_TOKEN}' \
  -H 'Content-Type: application/json'
```

Get students in a specific course, sorted by name, with search:

```bash
curl -X GET \
  'http://localhost:3000/api/v1/courses/faculty/507f1f77bcf86cd799439011/students/aggregated?courseId=507f1f77bcf86cd799439012&sortBy=firstName&sortOrder=asc&search=doe' \
  -H 'Authorization: Bearer {YOUR_JWT_TOKEN}' \
  -H 'Content-Type: application/json'
```

## 8. Error Cases

### Invalid Faculty ID (404)
```bash
curl -X GET \
  'http://localhost:3000/api/v1/courses/faculty/507f1f77bcf86cd799439999/students/aggregated' \
  -H 'Authorization: Bearer {YOUR_JWT_TOKEN}' \
  -H 'Content-Type: application/json'
```

### Unauthorized Request (401)
```bash
curl -X GET \
  'http://localhost:3000/api/v1/courses/faculty/507f1f77bcf86cd799439011/students/aggregated' \
  -H 'Content-Type: application/json'
```

### Invalid Course ID
```bash
curl -X GET \
  'http://localhost:3000/api/v1/courses/faculty/507f1f77bcf86cd799439011/students/aggregated?courseId=invalid-id' \
  -H 'Authorization: Bearer {YOUR_JWT_TOKEN}' \
  -H 'Content-Type: application/json'
```

## 9. Response Examples

### Successful Response (200)
```json
{
  "success": true,
  "message": "Faculty students data retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "studentId": "STU001",
      "department": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Computer Science"
      },
      "phone": "+1234567890",
      "avatar": "https://example.com/avatar.jpg",
      "courses": [
        {
          "_id": "507f1f77bcf86cd799439012",
          "title": "Introduction to Programming",
          "code": "CS101",
          "courseType": "Core",
          "creditHours": 3,
          "semester": 1,
          "year": 2024,
          "currentEnrollment": 25,
          "maxStudents": 30
        }
      ],
      "totalCredits": 9,
      "courseCount": 3,
      "enrollmentStatus": "active",
      "enrollmentType": "full_time",
      "gpa": 3.5,
      "cgpa": 3.4
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  },
  "summary": {
    "totalStudents": 50,
    "totalCourses": 5,
    "averageStudentsPerCourse": 10.0,
    "faculty": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "Dr. Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com",
      "facultyId": "FAC001",
      "department": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Computer Science"
      }
    }
  }
}
```

### Error Response (404)
```json
{
  "success": false,
  "message": "Faculty not found or invalid faculty ID",
  "error": "Faculty not found or invalid faculty ID"
}
```

## 10. Performance Testing

### Test with Large Dataset
```bash
# Test with 100 students per page
curl -X GET \
  'http://localhost:3000/api/v1/courses/faculty/507f1f77bcf86cd799439011/students/aggregated?limit=100' \
  -H 'Authorization: Bearer {YOUR_JWT_TOKEN}' \
  -H 'Content-Type: application/json'
```

### Test Response Time
```bash
# Measure response time
time curl -X GET \
  'http://localhost:3000/api/v1/courses/faculty/507f1f77bcf86cd799439011/students/aggregated' \
  -H 'Authorization: Bearer {YOUR_JWT_TOKEN}' \
  -H 'Content-Type: application/json' \
  -s > /dev/null
```

## Notes

1. Replace `{YOUR_JWT_TOKEN}` with your actual JWT authentication token
2. Replace the faculty ID (`507f1f77bcf86cd799439011`) with an actual faculty ID from your database
3. Replace the course ID (`507f1f77bcf86cd799439012`) with an actual course ID from your database
4. The API supports all standard HTTP status codes and error handling
5. All responses are in JSON format
6. The API includes comprehensive pagination, sorting, and filtering capabilities 