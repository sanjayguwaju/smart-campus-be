# Enrollment API Documentation

This document provides comprehensive examples and curl commands for the Enrollment API endpoints.

## Table of Contents

1. [Authentication](#authentication)
2. [Base URL](#base-url)
3. [API Endpoints](#api-endpoints)
   - [Create Enrollment](#create-enrollment)
   - [Get All Enrollments](#get-all-enrollments)
   - [Get Enrollment by ID](#get-enrollment-by-id)
   - [Update Enrollment](#update-enrollment)
   - [Delete Enrollment](#delete-enrollment)
   - [Add Course to Enrollment](#add-course-to-enrollment)
   - [Remove Course from Enrollment](#remove-course-from-enrollment)
   - [Update Enrollment Status](#update-enrollment-status)
   - [Update GPA](#update-gpa)
   - [Add Document to Enrollment](#add-document-to-enrollment)
   - [Remove Document from Enrollment](#remove-document-from-enrollment)
   - [Get Enrollments by Student](#get-enrollments-by-student)
   - [Get Enrollments by Program](#get-enrollments-by-program)
   - [Get Enrollment Statistics](#get-enrollment-statistics)
   - [Bulk Operations](#bulk-operations)
   - [My Enrollments (Student)](#my-enrollments-student)
   - [My Advisees (Faculty)](#my-advisees-faculty)

## Authentication

All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

## Base URL

```
http://localhost:3000/api/enrollments
```

## API Endpoints

### Create Enrollment

**POST** `/api/enrollments`

Creates a new enrollment for a student in a program.

**Required Fields:**
- `student`: Student ID (ObjectId)
- `program`: Program ID (ObjectId)
- `semester`: Semester number (1-12)
- `semesterTerm`: Semester term (Fall, Spring, Summer, Winter)
- `academicYear`: Academic year in format YYYY-YYYY

**Optional Fields:**
- `courses`: Array of course IDs
- `status`: Enrollment status
- `enrollmentType`: Type of enrollment
- `advisor`: Advisor ID
- `notes`: Additional notes
- `documents`: Array of documents

```bash
curl -X POST http://localhost:3000/api/enrollments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "student": "507f1f77bcf86cd799439011",
    "program": "507f1f77bcf86cd799439012",
    "semester": 1,
    "semesterTerm": "Fall",
    "academicYear": "2024-2025",
    "courses": ["507f1f77bcf86cd799439013"],
    "status": "active",
    "enrollmentType": "full_time",
    "advisor": "507f1f77bcf86cd799439014",
    "notes": "Initial enrollment for Computer Science program",
    "documents": [
      {
        "type": "transcript",
        "fileName": "high_school_transcript.pdf",
        "fileUrl": "https://example.com/transcript.pdf",
        "fileSize": 1024000
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "student": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "studentId": "STU001"
    },
    "program": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Computer Science",
      "code": "CS"
    },
    "semester": 1,
    "semesterTerm": "Fall",
    "academicYear": "2024-2025",
    "status": "active",
    "enrollmentType": "full_time",
    "totalCredits": 3,
    "gpa": 0.0,
    "cgpa": 0.0,
    "academicStanding": "good_standing",
    "financialStatus": "unpaid",
    "enrolledAt": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Enrollment created successfully"
}
```

### Get All Enrollments

**GET** `/api/enrollments`

Retrieves all enrollments with pagination and filtering options.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `search`: Search term for notes
- `student`: Filter by student ID
- `program`: Filter by program ID
- `semester`: Filter by semester
- `semesterTerm`: Filter by semester term
- `academicYear`: Filter by academic year
- `status`: Filter by status
- `enrollmentType`: Filter by enrollment type
- `academicStanding`: Filter by academic standing
- `financialStatus`: Filter by financial status
- `advisor`: Filter by advisor ID
- `sortBy`: Sort field
- `sortOrder`: Sort order (asc/desc)

```bash
# Get all enrollments
curl -X GET "http://localhost:3000/api/enrollments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get enrollments with filters
curl -X GET "http://localhost:3000/api/enrollments?page=1&limit=20&status=active&semester=1&sortBy=enrolledAt&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Search enrollments
curl -X GET "http://localhost:3000/api/enrollments?search=computer science&program=507f1f77bcf86cd799439012" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "enrollments": [
      {
        "_id": "507f1f77bcf86cd799439015",
        "student": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "John Doe",
          "email": "john@example.com",
          "studentId": "STU001"
        },
        "program": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Computer Science",
          "code": "CS"
        },
        "semester": 1,
        "semesterTerm": "Fall",
        "academicYear": "2024-2025",
        "status": "active",
        "enrollmentType": "full_time",
        "totalCredits": 3,
        "gpa": 3.5,
        "cgpa": 3.5,
        "academicStanding": "good_standing",
        "financialStatus": "paid",
        "enrolledAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  },
  "message": "Enrollments retrieved successfully"
}
```

### Get Enrollment by ID

**GET** `/api/enrollments/:id`

Retrieves a specific enrollment by its ID.

```bash
curl -X GET "http://localhost:3000/api/enrollments/507f1f77bcf86cd799439015" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "student": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "studentId": "STU001",
      "department": "507f1f77bcf86cd799439016"
    },
    "program": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Computer Science",
      "code": "CS",
      "description": "Bachelor of Computer Science"
    },
    "courses": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Introduction to Programming",
        "code": "CS101",
        "creditHours": 3
      }
    ],
    "semester": 1,
    "semesterTerm": "Fall",
    "academicYear": "2024-2025",
    "status": "active",
    "enrollmentType": "full_time",
    "totalCredits": 3,
    "gpa": 3.5,
    "cgpa": 3.5,
    "academicStanding": "good_standing",
    "financialStatus": "paid",
    "advisor": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Dr. Smith",
      "email": "smith@example.com"
    },
    "documents": [
      {
        "_id": "507f1f77bcf86cd799439017",
        "type": "transcript",
        "fileName": "high_school_transcript.pdf",
        "fileUrl": "https://example.com/transcript.pdf",
        "fileSize": 1024000,
        "uploadedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "auditTrail": [
      {
        "action": "enrolled",
        "timestamp": "2024-01-15T10:30:00.000Z",
        "performedBy": {
          "_id": "507f1f77bcf86cd799439018",
          "name": "Admin User",
          "email": "admin@example.com"
        },
        "details": "Initial enrollment created"
      }
    ],
    "enrolledAt": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Enrollment retrieved successfully"
}
```

### Update Enrollment

**PUT** `/api/enrollments/:id`

Updates an existing enrollment.

```bash
curl -X PUT "http://localhost:3000/api/enrollments/507f1f77bcf86cd799439015" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "semester": 2,
    "semesterTerm": "Spring",
    "academicYear": "2024-2025",
    "status": "active",
    "gpa": 3.7,
    "cgpa": 3.6,
    "notes": "Updated enrollment information"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "semester": 2,
    "semesterTerm": "Spring",
    "academicYear": "2024-2025",
    "status": "active",
    "gpa": 3.7,
    "cgpa": 3.6,
    "notes": "Updated enrollment information",
    "updatedAt": "2024-01-16T14:30:00.000Z"
  },
  "message": "Enrollment updated successfully"
}
```

### Delete Enrollment

**DELETE** `/api/enrollments/:id`

Deletes an enrollment (Admin only).

```bash
curl -X DELETE "http://localhost:3000/api/enrollments/507f1f77bcf86cd799439015" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Enrollment deleted successfully"
}
```

### Add Course to Enrollment

**POST** `/api/enrollments/:id/courses`

Adds a course to an existing enrollment.

```bash
curl -X POST "http://localhost:3000/api/enrollments/507f1f77bcf86cd799439015/courses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "courseId": "507f1f77bcf86cd799439019"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "courses": [
      "507f1f77bcf86cd799439013",
      "507f1f77bcf86cd799439019"
    ],
    "totalCredits": 6
  },
  "message": "Course added to enrollment successfully"
}
```

### Remove Course from Enrollment

**DELETE** `/api/enrollments/:id/courses/:courseId`

Removes a course from an enrollment.

```bash
curl -X DELETE "http://localhost:3000/api/enrollments/507f1f77bcf86cd799439015/courses/507f1f77bcf86cd799439019" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "courses": [
      "507f1f77bcf86cd799439013"
    ],
    "totalCredits": 3
  },
  "message": "Course removed from enrollment successfully"
}
```

### Update Enrollment Status

**PATCH** `/api/enrollments/:id/status`

Updates the status of an enrollment.

```bash
curl -X PATCH "http://localhost:3000/api/enrollments/507f1f77bcf86cd799439015/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "completed",
    "details": "Student has completed all requirements for this semester"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "status": "completed",
    "completedAt": "2024-01-16T15:30:00.000Z"
  },
  "message": "Enrollment status updated successfully"
}
```

### Update GPA

**PATCH** `/api/enrollments/:id/gpa`

Updates the GPA and CGPA of an enrollment.

```bash
curl -X PATCH "http://localhost:3000/api/enrollments/507f1f77bcf86cd799439015/gpa" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "gpa": 3.8,
    "cgpa": 3.7
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "gpa": 3.8,
    "cgpa": 3.7
  },
  "message": "GPA updated successfully"
}
```

### Add Document to Enrollment

**POST** `/api/enrollments/:id/documents`

Adds a document to an enrollment.

```bash
curl -X POST "http://localhost:3000/api/enrollments/507f1f77bcf86cd799439015/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "id_card",
    "fileName": "student_id_card.jpg",
    "fileUrl": "https://example.com/id_card.jpg",
    "fileSize": 512000
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "documents": [
      {
        "_id": "507f1f77bcf86cd799439017",
        "type": "transcript",
        "fileName": "high_school_transcript.pdf",
        "fileUrl": "https://example.com/transcript.pdf",
        "fileSize": 1024000,
        "uploadedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439020",
        "type": "id_card",
        "fileName": "student_id_card.jpg",
        "fileUrl": "https://example.com/id_card.jpg",
        "fileSize": 512000,
        "uploadedAt": "2024-01-16T16:30:00.000Z"
      }
    ]
  },
  "message": "Document added to enrollment successfully"
}
```

### Remove Document from Enrollment

**DELETE** `/api/enrollments/:id/documents/:documentId`

Removes a document from an enrollment.

```bash
curl -X DELETE "http://localhost:3000/api/enrollments/507f1f77bcf86cd799439015/documents/507f1f77bcf86cd799439020" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "documents": [
      {
        "_id": "507f1f77bcf86cd799439017",
        "type": "transcript",
        "fileName": "high_school_transcript.pdf",
        "fileUrl": "https://example.com/transcript.pdf",
        "fileSize": 1024000,
        "uploadedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  },
  "message": "Document removed from enrollment successfully"
}
```

### Get Enrollments by Student

**GET** `/api/enrollments/student/:studentId`

Retrieves all enrollments for a specific student.

```bash
curl -X GET "http://localhost:3000/api/enrollments/student/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "student": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "studentId": "STU001"
      },
      "program": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Computer Science",
        "code": "CS"
      },
      "semester": 1,
      "semesterTerm": "Fall",
      "academicYear": "2024-2025",
      "status": "active",
      "enrollmentType": "full_time",
      "totalCredits": 3,
      "gpa": 3.5,
      "cgpa": 3.5
    }
  ],
  "message": "Student enrollments retrieved successfully"
}
```

### Get Enrollments by Program

**GET** `/api/enrollments/program/:programId`

Retrieves all enrollments for a specific program.

```bash
curl -X GET "http://localhost:3000/api/enrollments/program/507f1f77bcf86cd799439012" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "student": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "studentId": "STU001"
      },
      "program": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Computer Science",
        "code": "CS"
      },
      "semester": 1,
      "semesterTerm": "Fall",
      "academicYear": "2024-2025",
      "status": "active",
      "enrollmentType": "full_time",
      "totalCredits": 3,
      "gpa": 3.5,
      "cgpa": 3.5
    }
  ],
  "message": "Program enrollments retrieved successfully"
}
```

### Get Enrollment Statistics

**GET** `/api/enrollments/stats`

Retrieves enrollment statistics.

```bash
curl -X GET "http://localhost:3000/api/enrollments/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "byStatus": {
      "active": 120,
      "completed": 20,
      "dropped": 5,
      "suspended": 3,
      "graduated": 2
    },
    "byEnrollmentType": {
      "fullTime": 130,
      "partTime": 20
    },
    "byAcademicStanding": {
      "goodStanding": 140,
      "warning": 8,
      "probation": 2,
      "suspension": 0
    },
    "activePercentage": 80
  },
  "message": "Enrollment statistics retrieved successfully"
}
```

### Bulk Operations

**POST** `/api/enrollments/bulk`

Performs bulk operations on multiple enrollments (Admin only).

```bash
# Bulk activate enrollments
curl -X POST "http://localhost:3000/api/enrollments/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "enrollmentIds": [
      "507f1f77bcf86cd799439015",
      "507f1f77bcf86cd799439016",
      "507f1f77bcf86cd799439017"
    ],
    "operation": "activate"
  }'

# Bulk update status
curl -X POST "http://localhost:3000/api/enrollments/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "enrollmentIds": [
      "507f1f77bcf86cd799439015",
      "507f1f77bcf86cd799439016"
    ],
    "operation": "update_status",
    "data": {
      "status": "completed"
    }
  }'

# Bulk update GPA
curl -X POST "http://localhost:3000/api/enrollments/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "enrollmentIds": [
      "507f1f77bcf86cd799439015",
      "507f1f77bcf86cd799439016"
    ],
    "operation": "update_gpa",
    "data": {
      "gpa": 3.5,
      "cgpa": 3.4
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439015",
      "success": true
    },
    {
      "id": "507f1f77bcf86cd799439016",
      "success": true
    },
    {
      "id": "507f1f77bcf86cd799439017",
      "success": false,
      "error": "Enrollment not found"
    }
  ],
  "message": "Bulk operation activate completed"
}
```

### My Enrollments (Student)

**GET** `/api/enrollments/my-enrollments`

Retrieves the current user's enrollments (for students).

```bash
curl -X GET "http://localhost:3000/api/enrollments/my-enrollments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "student": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "studentId": "STU001"
      },
      "program": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Computer Science",
        "code": "CS"
      },
      "semester": 1,
      "semesterTerm": "Fall",
      "academicYear": "2024-2025",
      "status": "active",
      "enrollmentType": "full_time",
      "totalCredits": 3,
      "gpa": 3.5,
      "cgpa": 3.5
    }
  ],
  "message": "Student enrollments retrieved successfully"
}
```

### My Advisees (Faculty)

**GET** `/api/enrollments/my-advisees`

Retrieves enrollments for students advised by the current faculty member.

```bash
curl -X GET "http://localhost:3000/api/enrollments/my-advisees" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "enrollments": [
      {
        "_id": "507f1f77bcf86cd799439015",
        "student": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "John Doe",
          "email": "john@example.com",
          "studentId": "STU001"
        },
        "program": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Computer Science",
          "code": "CS"
        },
        "semester": 1,
        "semesterTerm": "Fall",
        "academicYear": "2024-2025",
        "status": "active",
        "enrollmentType": "full_time",
        "totalCredits": 3,
        "gpa": 3.5,
        "cgpa": 3.5
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  },
  "message": "Advisor's enrollments retrieved successfully"
}
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "error": "Student ID is required"
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "error": "Enrollment not found"
}
```

### Unauthorized Error (401)
```json
{
  "success": false,
  "error": "Access denied. Invalid token."
}
```

### Forbidden Error (403)
```json
{
  "success": false,
  "error": "Access denied. Insufficient permissions."
}
```

### Conflict Error (409)
```json
{
  "success": false,
  "error": "Student is already enrolled in this program for the specified semester and academic year"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation Error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Notes

1. **Authentication**: All endpoints require a valid JWT token in the Authorization header.
2. **Role-based Access**: Different endpoints have different access levels:
   - Admin: Full access to all endpoints
   - Faculty: Access to most endpoints except bulk operations and deletion
   - Student: Limited access to view own enrollments and add documents
3. **Validation**: All input data is validated using Joi schemas.
4. **Pagination**: List endpoints support pagination with customizable page size.
5. **Filtering**: Most list endpoints support various filtering options.
6. **Audit Trail**: All changes are logged in the audit trail for tracking purposes.
7. **Document Management**: Supports file uploads with metadata tracking.
8. **Bulk Operations**: Admin can perform operations on multiple enrollments at once.

## Testing

You can test these endpoints using tools like:
- cURL (as shown in examples)
- Postman
- Insomnia
- Thunder Client (VS Code extension)

Make sure to:
1. Set up your authentication token
2. Use the correct base URL
3. Include proper headers
4. Validate request/response formats 