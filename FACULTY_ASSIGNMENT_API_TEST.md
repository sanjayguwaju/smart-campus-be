# Faculty Assignment Creation API Test Guide

## Overview
This API allows faculty members to create assignments only for courses they are assigned to. The API ensures proper authorization and validation.

## Endpoint
```
POST /api/v1/assignments/faculty-course
```

## Authentication
- Requires Bearer token
- Only faculty members can access this endpoint

## Test Cases

### 1. Login as Faculty
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "faculty@university.edu",
    "password": "password123"
  }'
```

### 2. Create Assignment for Assigned Course (Success Case)
```bash
curl -X POST http://localhost:5000/api/v1/assignments/faculty-course \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FACULTY_TOKEN" \
  -d '{
    "title": "Programming Assignment 1",
    "description": "Create a simple calculator program in Python",
    "course": "COURSE_ID_HERE",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "totalPoints": 100,
    "assignmentType": "Homework",
    "difficulty": "Medium",
    "estimatedTime": 5
  }'
```

### 3. Create Assignment with Grading Criteria
```bash
curl -X POST http://localhost:5000/api/v1/assignments/faculty-course \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FACULTY_TOKEN" \
  -d '{
    "title": "Web Development Project",
    "description": "Build a responsive web application",
    "course": "COURSE_ID_HERE",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "totalPoints": 100,
    "assignmentType": "Project",
    "difficulty": "Hard",
    "estimatedTime": 20,
    "gradingCriteria": [
      {
        "criterion": "Functionality",
        "maxPoints": 40,
        "description": "All features work correctly"
      },
      {
        "criterion": "Code Quality",
        "maxPoints": 30,
        "description": "Clean, well-documented code"
      },
      {
        "criterion": "Documentation",
        "maxPoints": 30,
        "description": "Comprehensive documentation"
      }
    ]
  }'
```

### 4. Attempt to Create Assignment for Unassigned Course (Should Fail)
```bash
curl -X POST http://localhost:5000/api/v1/assignments/faculty-course \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FACULTY_TOKEN" \
  -d '{
    "title": "Unauthorized Assignment",
    "description": "This should fail",
    "course": "UNASSIGNED_COURSE_ID_HERE",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "totalPoints": 100,
    "assignmentType": "Homework"
  }'
```

### 5. Create Assignment with Invalid Grading Criteria (Should Fail)
```bash
curl -X POST http://localhost:5000/api/v1/assignments/faculty-course \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FACULTY_TOKEN" \
  -d '{
    "title": "Invalid Points Assignment",
    "description": "This should fail due to points mismatch",
    "course": "COURSE_ID_HERE",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "totalPoints": 100,
    "assignmentType": "Homework",
    "gradingCriteria": [
      {
        "criterion": "Part 1",
        "maxPoints": 30,
        "description": "First part"
      },
      {
        "criterion": "Part 2",
        "maxPoints": 40,
        "description": "Second part"
      }
    ]
  }'
```

## Expected Response Format

### Success Response (201)
```json
{
  "success": true,
  "message": "Assignment created successfully for your assigned course",
  "timestamp": "2024-12-25T10:30:00.000Z",
  "data": {
    "_id": "assignment_id_here",
    "title": "Programming Assignment 1",
    "description": "Create a simple calculator program in Python",
    "course": "course_id_here",
    "faculty": "faculty_id_here",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "totalPoints": 100,
    "assignmentType": "Homework",
    "difficulty": "Medium",
    "estimatedTime": 5,
    "createdBy": "faculty_id_here",
    "lastModifiedBy": "faculty_id_here",
    "createdAt": "2024-12-25T10:30:00.000Z",
    "updatedAt": "2024-12-25T10:30:00.000Z"
  }
}
```

### Error Response (403 - Unauthorized)
```json
{
  "success": false,
  "message": "You are not authorized to create assignments for this course. Only the assigned faculty can create assignments.",
  "timestamp": "2024-12-25T10:30:00.000Z"
}
```

### Error Response (400 - Validation Error)
```json
{
  "success": false,
  "message": "Total points must match the sum of grading criteria points",
  "timestamp": "2024-12-25T10:30:00.000Z"
}
```

### Error Response (404 - Course Not Found)
```json
{
  "success": false,
  "message": "Course not found",
  "timestamp": "2024-12-25T10:30:00.000Z"
}
```

## Key Features

1. **Authorization Check**: Verifies that the faculty is assigned to the course
2. **Automatic Faculty Assignment**: Sets the faculty field to the authenticated faculty member
3. **Validation**: Ensures grading criteria points match total points
4. **Response Format**: Returns data in the standardized format with success, message, timestamp, and data fields
5. **Error Handling**: Provides clear error messages for different scenarios

## Implementation Details

- **Route**: `/api/v1/assignments/faculty-course`
- **Method**: POST
- **Authentication**: Required (faculty only)
- **Validation**: Uses existing assignment validation middleware
- **Service**: `createAssignmentForFacultyCourse` in assignment service
- **Controller**: `createAssignmentForFacultyCourse` in assignment controller 