# Assignment API Documentation

This document provides comprehensive examples for using the Assignment API endpoints with curl commands.

## Table of Contents
- [Authentication](#authentication)
- [Assignment Management](#assignment-management)
- [File Management](#file-management)
- [Status Management](#status-management)
- [Querying and Filtering](#querying-and-filtering)
- [Statistics and Analytics](#statistics-and-analytics)
- [Bulk Operations](#bulk-operations)
- [Search and Filtering](#search-and-filtering)

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```bash
# Login to get token
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "faculty@example.com",
    "password": "password123"
  }'

# Use the token in subsequent requests
export TOKEN="your_jwt_token_here"
```

## Assignment Management

### 1. Create Assignment

**Endpoint:** `POST /api/v1/assignments`

**Required Role:** Admin, Faculty

```bash
curl -X POST http://localhost:5000/api/v1/assignments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Advanced JavaScript Programming",
    "description": "Create a comprehensive web application using modern JavaScript frameworks",
    "course": "507f1f77bcf86cd799439011",
    "faculty": "507f1f77bcf86cd799439012",
    "assignmentType": "Project",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "extendedDueDate": "2025-01-07T23:59:59.000Z",
    "totalPoints": 100,
    "difficulty": "Hard",
    "estimatedTime": 20,
    "tags": ["javascript", "web-development", "project"],
    "requirements": {
      "maxFileSize": 50,
      "allowedFileTypes": ["pdf", "zip", "js", "html", "css"],
      "maxSubmissions": 3,
      "allowLateSubmission": true,
      "latePenalty": 10
    },
    "gradingCriteria": [
      {
        "criterion": "Code Quality",
        "maxPoints": 30,
        "description": "Clean, well-documented code"
      },
      {
        "criterion": "Functionality",
        "maxPoints": 40,
        "description": "All required features implemented"
      },
      {
        "criterion": "User Interface",
        "maxPoints": 20,
        "description": "Intuitive and responsive design"
      },
      {
        "criterion": "Documentation",
        "maxPoints": 10,
        "description": "Comprehensive README and comments"
      }
    ],
    "status": "draft",
    "isVisible": false
  }'
```

### 2. Get All Assignments

**Endpoint:** `GET /api/v1/assignments`

**Required Role:** Admin, Faculty, Student

```bash
# Basic request
curl -X GET http://localhost:5000/api/v1/assignments \
  -H "Authorization: Bearer $TOKEN"

# With pagination and filtering
curl -X GET "http://localhost:5000/api/v1/assignments?page=1&limit=10&status=published&assignmentType=Homework&sortBy=dueDate&sortOrder=asc" \
  -H "Authorization: Bearer $TOKEN"

# With date range filtering
curl -X GET "http://localhost:5000/api/v1/assignments?dueDateFrom=2024-01-01&dueDateTo=2024-12-31&difficulty=Medium" \
  -H "Authorization: Bearer $TOKEN"

# With search
curl -X GET "http://localhost:5000/api/v1/assignments?search=javascript&tags=web-development" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Get Assignment by ID

**Endpoint:** `GET /api/v1/assignments/{id}`

**Required Role:** Admin, Faculty, Student

```bash
curl -X GET http://localhost:5000/api/v1/assignments/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Update Assignment

**Endpoint:** `PUT /api/v1/assignments/{id}`

**Required Role:** Admin, Faculty (assignment creator)

```bash
curl -X PUT http://localhost:5000/api/v1/assignments/507f1f77bcf86cd799439013 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Advanced JavaScript Programming - Updated",
    "description": "Updated description with additional requirements",
    "dueDate": "2024-12-25T23:59:59.000Z",
    "totalPoints": 120,
    "gradingCriteria": [
      {
        "criterion": "Code Quality",
        "maxPoints": 35,
        "description": "Clean, well-documented code with best practices"
      },
      {
        "criterion": "Functionality",
        "maxPoints": 45,
        "description": "All required features implemented correctly"
      },
      {
        "criterion": "User Interface",
        "maxPoints": 25,
        "description": "Intuitive, responsive, and accessible design"
      },
      {
        "criterion": "Documentation",
        "maxPoints": 15,
        "description": "Comprehensive README, API documentation, and code comments"
      }
    ],
    "tags": ["javascript", "web-development", "project", "advanced"]
  }'
```

### 5. Delete Assignment

**Endpoint:** `DELETE /api/v1/assignments/{id}`

**Required Role:** Admin, Faculty (assignment creator)

```bash
curl -X DELETE http://localhost:5000/api/v1/assignments/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer $TOKEN"
```

## File Management

### 6. Add File to Assignment

**Endpoint:** `POST /api/v1/assignments/{id}/files`

**Required Role:** Admin, Faculty

```bash
# Upload file directly
curl -X POST http://localhost:5000/api/v1/assignments/507f1f77bcf86cd799439013/files \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/assignment.pdf"

# Add file with metadata
curl -X POST http://localhost:5000/api/v1/assignments/507f1f77bcf86cd799439013/files \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "fileName": "assignment_requirements.pdf",
    "fileUrl": "https://example.com/files/assignment_requirements.pdf",
    "fileSize": 2048576,
    "fileType": "application/pdf"
  }'
```

### 7. Remove File from Assignment

**Endpoint:** `DELETE /api/v1/assignments/{id}/files`

**Required Role:** Admin, Faculty

```bash
curl -X DELETE http://localhost:5000/api/v1/assignments/507f1f77bcf86cd799439013/files \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "fileUrl": "https://example.com/files/assignment_requirements.pdf"
  }'
```

## Status Management

### 8. Update Assignment Status

**Endpoint:** `PATCH /api/v1/assignments/{id}/status`

**Required Role:** Admin, Faculty

```bash
# Publish assignment
curl -X PATCH http://localhost:5000/api/v1/assignments/507f1f77bcf86cd799439013/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "published"
  }'

# Close submissions
curl -X PATCH http://localhost:5000/api/v1/assignments/507f1f77bcf86cd799439013/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "submission_closed"
  }'

# Start grading
curl -X PATCH http://localhost:5000/api/v1/assignments/507f1f77bcf86cd799439013/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "grading"
  }'

# Complete assignment
curl -X PATCH http://localhost:5000/api/v1/assignments/507f1f77bcf86cd799439013/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "completed"
  }'

# Archive assignment
curl -X PATCH http://localhost:5000/api/v1/assignments/507f1f77bcf86cd799439013/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "archived"
  }'
```

## Querying and Filtering

### 9. Get Assignments by Course

**Endpoint:** `GET /api/v1/assignments/course/{courseId}`

**Required Role:** Admin, Faculty, Student (enrolled in course)

```bash
curl -X GET http://localhost:5000/api/v1/assignments/course/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer $TOKEN"
```

### 10. Get Assignments by Faculty

**Endpoint:** `GET /api/v1/assignments/faculty/{facultyId}`

**Required Role:** Admin, Faculty (own assignments)

```bash
curl -X GET http://localhost:5000/api/v1/assignments/faculty/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer $TOKEN"
```

### 11. Get My Assignments (Faculty)

**Endpoint:** `GET /api/v1/assignments/my`

**Required Role:** Faculty

```bash
curl -X GET "http://localhost:5000/api/v1/assignments/my?page=1&limit=10&status=published" \
  -H "Authorization: Bearer $TOKEN"
```

### 12. Get My Course Assignments (Student)

**Endpoint:** `GET /api/v1/assignments/my-courses`

**Required Role:** Student

```bash
curl -X GET "http://localhost:5000/api/v1/assignments/my-courses?page=1&limit=10&assignmentType=Homework" \
  -H "Authorization: Bearer $TOKEN"
```

### 13. Get Assignments by Type

**Endpoint:** `GET /api/v1/assignments/type/{type}`

**Required Role:** Admin, Faculty, Student

```bash
curl -X GET "http://localhost:5000/api/v1/assignments/type/Project?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 14. Get Assignments by Difficulty

**Endpoint:** `GET /api/v1/assignments/difficulty/{difficulty}`

**Required Role:** Admin, Faculty, Student

```bash
curl -X GET "http://localhost:5000/api/v1/assignments/difficulty/Hard?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 15. Get Assignments by Tags

**Endpoint:** `GET /api/v1/assignments/tags`

**Required Role:** Admin, Faculty, Student

```bash
curl -X GET "http://localhost:5000/api/v1/assignments/tags?tags=javascript,web-development&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

## Statistics and Analytics

### 16. Get Assignment Statistics

**Endpoint:** `GET /api/v1/assignments/stats`

**Required Role:** Admin, Faculty

```bash
curl -X GET http://localhost:5000/api/v1/assignments/stats \
  -H "Authorization: Bearer $TOKEN"
```

### 17. Update Assignment Statistics

**Endpoint:** `PATCH /api/v1/assignments/{id}/statistics`

**Required Role:** Admin, Faculty

```bash
curl -X PATCH http://localhost:5000/api/v1/assignments/507f1f77bcf86cd799439013/statistics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "totalSubmissions": 25,
    "onTimeSubmissions": 20,
    "lateSubmissions": 5,
    "averageScore": 85.5
  }'
```

### 18. Get Overdue Assignments

**Endpoint:** `GET /api/v1/assignments/overdue`

**Required Role:** Admin, Faculty, Student

```bash
curl -X GET http://localhost:5000/api/v1/assignments/overdue \
  -H "Authorization: Bearer $TOKEN"
```

## Bulk Operations

### 19. Bulk Operations

**Endpoint:** `POST /api/v1/assignments/bulk`

**Required Role:** Admin, Faculty

```bash
# Publish multiple assignments
curl -X POST http://localhost:5000/api/v1/assignments/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "operation": "publish",
    "assignmentIds": [
      "507f1f77bcf86cd799439013",
      "507f1f77bcf86cd799439014",
      "507f1f77bcf86cd799439015"
    ]
  }'

# Archive multiple assignments
curl -X POST http://localhost:5000/api/v1/assignments/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "operation": "archive",
    "assignmentIds": [
      "507f1f77bcf86cd799439013",
      "507f1f77bcf86cd799439014"
    ]
  }'

# Update status of multiple assignments
curl -X POST http://localhost:5000/api/v1/assignments/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "operation": "updateStatus",
    "assignmentIds": [
      "507f1f77bcf86cd799439013",
      "507f1f77bcf86cd799439014"
    ],
    "status": "completed"
  }'

# Delete multiple assignments
curl -X POST http://localhost:5000/api/v1/assignments/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "operation": "delete",
    "assignmentIds": [
      "507f1f77bcf86cd799439013",
      "507f1f77bcf86cd799439014"
    ]
  }'
```

## Search and Filtering

### 20. Search Assignments

**Endpoint:** `GET /api/v1/assignments/search`

**Required Role:** Admin, Faculty, Student

```bash
curl -X GET "http://localhost:5000/api/v1/assignments/search?q=javascript&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

## Advanced Query Examples

### Complex Filtering

```bash
# Get published assignments for a specific course with pagination and sorting
curl -X GET "http://localhost:5000/api/v1/assignments?course=507f1f77bcf86cd799439011&status=published&assignmentType=Project&difficulty=Hard&sortBy=dueDate&sortOrder=desc&page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN"

# Get assignments with date range and multiple filters
curl -X GET "http://localhost:5000/api/v1/assignments?dueDateFrom=2024-01-01&dueDateTo=2024-12-31&status=published&isVisible=true&sortBy=createdAt&sortOrder=desc&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"

# Search with tags and type filtering
curl -X GET "http://localhost:5000/api/v1/assignments?search=web&tags=javascript,react&assignmentType=Project&difficulty=Medium&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

## Error Handling Examples

### Validation Errors

```bash
# Invalid assignment data
curl -X POST http://localhost:5000/api/v1/assignments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "",
    "course": "invalid-id",
    "dueDate": "2023-01-01T00:00:00.000Z"
  }'

# Response: 400 Bad Request with validation details
```

### Permission Errors

```bash
# Student trying to create assignment
curl -X POST http://localhost:5000/api/v1/assignments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{
    "title": "Test Assignment",
    "course": "507f1f77bcf86cd799439011",
    "faculty": "507f1f77bcf86cd799439012",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "totalPoints": 100
  }'

# Response: 403 Forbidden
```

### Not Found Errors

```bash
# Assignment not found
curl -X GET http://localhost:5000/api/v1/assignments/507f1f77bcf86cd799439999 \
  -H "Authorization: Bearer $TOKEN"

# Response: 404 Not Found
```

## Response Examples

### Successful Assignment Creation

```json
{
  "success": true,
  "message": "Assignment created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "title": "Advanced JavaScript Programming",
    "description": "Create a comprehensive web application using modern JavaScript frameworks",
    "course": "507f1f77bcf86cd799439011",
    "faculty": "507f1f77bcf86cd799439012",
    "assignmentType": "Project",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "extendedDueDate": "2025-01-07T23:59:59.000Z",
    "totalPoints": 100,
    "status": "draft",
    "isVisible": false,
    "difficulty": "Hard",
    "estimatedTime": 20,
    "tags": ["javascript", "web-development", "project"],
    "requirements": {
      "maxFileSize": 50,
      "allowedFileTypes": ["pdf", "zip", "js", "html", "css"],
      "maxSubmissions": 3,
      "allowLateSubmission": true,
      "latePenalty": 10
    },
    "gradingCriteria": [
      {
        "criterion": "Code Quality",
        "maxPoints": 30,
        "description": "Clean, well-documented code"
      }
    ],
    "statistics": {
      "totalSubmissions": 0,
      "onTimeSubmissions": 0,
      "lateSubmissions": 0,
      "averageScore": 0
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Assignment List Response

```json
{
  "success": true,
  "message": "Assignments retrieved successfully",
  "data": {
    "assignments": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "title": "Advanced JavaScript Programming",
        "course": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Web Development",
          "code": "CS301"
        },
        "faculty": {
          "_id": "507f1f77bcf86cd799439012",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@university.edu"
        },
        "assignmentType": "Project",
        "dueDate": "2024-12-31T23:59:59.000Z",
        "totalPoints": 100,
        "status": "published",
        "difficulty": "Hard"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### Statistics Response

```json
{
  "success": true,
  "message": "Assignment statistics retrieved successfully",
  "data": {
    "overview": {
      "totalAssignments": 150,
      "publishedAssignments": 120,
      "draftAssignments": 20,
      "completedAssignments": 80,
      "overdueAssignments": 5
    },
    "byType": [
      {
        "_id": "Homework",
        "count": 60
      },
      {
        "_id": "Project",
        "count": 30
      },
      {
        "_id": "Quiz",
        "count": 40
      }
    ],
    "byDifficulty": [
      {
        "_id": "Medium",
        "count": 80
      },
      {
        "_id": "Easy",
        "count": 40
      },
      {
        "_id": "Hard",
        "count": 30
      }
    ]
  }
}
```

## Notes

1. **Authentication**: All endpoints require a valid JWT token in the Authorization header
2. **Role-based Access**: Different endpoints have different role requirements
3. **Validation**: All input data is validated according to the schema
4. **Pagination**: List endpoints support pagination with `page` and `limit` parameters
5. **Filtering**: Multiple filter options are available for querying assignments
6. **File Upload**: File uploads are handled through multipart/form-data
7. **Error Handling**: All endpoints return appropriate HTTP status codes and error messages
8. **Rate Limiting**: API requests are rate-limited for security

## Testing Tips

1. Use a tool like Postman or Insomnia for easier API testing
2. Test with different user roles to verify access control
3. Test edge cases like invalid IDs, missing required fields, etc.
4. Verify file upload functionality with actual files
5. Test bulk operations with multiple assignment IDs
6. Check pagination and filtering with various combinations 