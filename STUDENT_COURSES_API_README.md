# Student Courses API Documentation

## Overview

The Student Courses API provides functionality to retrieve all courses that a student is enrolled in. This API uses the enrollments collection to find the student's course enrollments and then fetches the corresponding course details.

## API Endpoint

### GET /api/courses/student/{studentId}/courses

Retrieves all courses a student is enrolled in with pagination and filtering capabilities.

#### URL Parameters

- `studentId` (required): The MongoDB ObjectId of the student whose courses to retrieve

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number for pagination |
| `limit` | integer | 10 | Number of courses per page (max 100) |
| `sortBy` | string | 'name' | Field to sort by (name, code, semester, year, creditHours) |
| `sortOrder` | string | 'asc' | Sort order (asc, desc) |
| `status` | string | 'active' | Filter by course status (active, inactive, archived, draft) |
| `semester` | integer | null | Filter by semester number |
| `year` | integer | null | Filter by academic year |

#### Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Response Format

**Success Response (200)**

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
    },
    {
      "course_id": "507f1f77bcf86cd799439013",
      "course_name": "Data Structures",
      "faculty_id": "507f1f77bcf86cd799439012",
      "semester": "2 2024",
      "code": "CS201",
      "creditHours": 4,
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
    "total": 2,
    "pages": 1
  }
}
```

**Error Responses**

- **400 Bad Request**: Invalid student ID format
- **401 Unauthorized**: Missing or invalid access token
- **404 Not Found**: Student not found
- **500 Internal Server Error**: Server error

#### Example Usage

**Basic Request**
```bash
curl -X GET \
  "http://localhost:3000/api/courses/student/507f1f77bcf86cd799439011/courses" \
  -H "Authorization: Bearer your_access_token"
```

**With Pagination**
```bash
curl -X GET \
  "http://localhost:3000/api/courses/student/507f1f77bcf86cd799439011/courses?page=2&limit=5" \
  -H "Authorization: Bearer your_access_token"
```

**With Filtering and Sorting**
```bash
curl -X GET \
  "http://localhost:3000/api/courses/student/507f1f77bcf86cd799439011/courses?status=active&sortBy=code&sortOrder=desc" \
  -H "Authorization: Bearer your_access_token"
```

## Implementation Details

### Database Schema

The API uses the following collections:

1. **Enrollments Collection**: Contains student enrollments with course references
2. **Courses Collection**: Contains course details
3. **Users Collection**: Contains student and faculty information

### Process Flow

1. **Validation**: Validates the student ID format and checks if the student exists
2. **Enrollment Lookup**: Finds all active enrollments for the student
3. **Course Extraction**: Extracts course IDs from enrollments
4. **Course Fetching**: Retrieves course details with faculty information
5. **Filtering**: Applies status, semester, and year filters
6. **Pagination**: Implements pagination with sorting
7. **Response Formatting**: Formats the response according to the specified structure

### Security

- Requires authentication via JWT token
- Validates student ID format to prevent injection attacks
- Uses proper error handling and logging

### Performance Considerations

- Uses database indexes for efficient queries
- Implements pagination to handle large datasets
- Populates faculty information in a single query
- Uses MongoDB aggregation for optimal performance

## Testing

The API includes comprehensive test coverage in `src/tests/student-courses.test.js`:

- Basic functionality testing
- Pagination testing
- Filtering and sorting testing
- Error handling testing
- Authentication testing
- Validation testing

To run the tests:

```bash
npm test -- --testPathPattern=student-courses.test.js
```

## Error Handling

The API implements proper error handling for:

- Invalid student ID format
- Non-existent students
- Database connection issues
- Authentication failures
- Validation errors

## Rate Limiting

The API is subject to the same rate limiting as other endpoints in the application.

## Dependencies

- Express.js for routing
- Mongoose for database operations
- JWT for authentication
- Express-validator for input validation
- ResponseHandler utility for consistent responses 