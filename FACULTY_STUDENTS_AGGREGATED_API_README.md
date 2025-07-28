# Faculty Students Aggregated API Documentation

## Overview

The Faculty Students Aggregated API is a new, efficient endpoint that uses MongoDB aggregation pipeline to fetch comprehensive information about students enrolled in courses taught by a specific faculty member. This API provides better performance and more detailed information compared to the existing faculty students endpoint.

## Endpoint

```
GET /api/v1/courses/faculty/{facultyId}/students/aggregated
```

## Authentication

This endpoint requires authentication. Include the Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Parameters

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| facultyId | string | Yes | The ID of the faculty member |

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number for pagination |
| limit | integer | 10 | Number of students per page |
| sortBy | string | firstName | Field to sort by (firstName, lastName, email, studentId, gpa, totalCredits, courseCount) |
| sortOrder | string | asc | Sort order (asc, desc) |
| courseId | string | - | Filter by specific course ID |
| search | string | - | Search students by name, email, or student ID |
| status | string | active | Filter by enrollment status (active, completed, dropped, suspended, graduated) |

## Response Format

### Success Response (200)

```json
{
  "success": true,
  "message": "Faculty students data retrieved successfully",
  "data": [
    {
      "_id": "student_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "studentId": "STU001",
      "department": {
        "_id": "dept_id",
        "name": "Computer Science"
      },
      "phone": "+1234567890",
      "avatar": "https://example.com/avatar.jpg",
      "courses": [
        {
          "_id": "course_id",
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
      "_id": "faculty_id",
      "firstName": "Dr. Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com",
      "facultyId": "FAC001",
      "department": {
        "_id": "dept_id",
        "name": "Computer Science"
      }
    }
  }
}
```

### Error Responses

#### 404 - Faculty Not Found
```json
{
  "success": false,
  "message": "Faculty not found or invalid faculty ID",
  "error": "Faculty not found or invalid faculty ID"
}
```

#### 500 - Internal Server Error
```json
{
  "success": false,
  "message": "Failed to retrieve faculty students data",
  "error": "Internal server error"
}
```

## Aggregation Pipeline Steps

The API uses a sophisticated MongoDB aggregation pipeline with the following steps:

1. **Match Courses**: Find all active courses taught by the specified faculty
2. **Lookup Enrollments**: Find all enrollments for the faculty's courses
3. **Unwind Enrollments**: Expand enrollment records
4. **Lookup Student Details**: Get detailed student information
5. **Unwind Student Details**: Expand student records
6. **Match Students**: Filter for active students only
7. **Search Filter**: Apply search criteria if provided
8. **Group by Student**: Combine course information for each student
9. **Add Computed Fields**: Calculate totals and counts
10. **Project Final Structure**: Format the output
11. **Sort Results**: Apply sorting
12. **Pagination**: Apply pagination

## Example Usage

### Basic Request
```bash
curl -X GET \
  'http://localhost:3000/api/v1/courses/faculty/507f1f77bcf86cd799439011/students/aggregated' \
  -H 'Authorization: Bearer your-jwt-token'
```

### Request with Filters
```bash
curl -X GET \
  'http://localhost:3000/api/v1/courses/faculty/507f1f77bcf86cd799439011/students/aggregated?page=1&limit=20&sortBy=gpa&sortOrder=desc&search=john&status=active' \
  -H 'Authorization: Bearer your-jwt-token'
```

### Request for Specific Course
```bash
curl -X GET \
  'http://localhost:3000/api/v1/courses/faculty/507f1f77bcf86cd799439011/students/aggregated?courseId=507f1f77bcf86cd799439012' \
  -H 'Authorization: Bearer your-jwt-token'
```

## Performance Benefits

1. **Single Database Query**: Uses aggregation pipeline instead of multiple queries
2. **Efficient Joins**: Uses `$lookup` for optimized data joining
3. **Reduced Network Traffic**: Returns all required data in one response
4. **Built-in Pagination**: Handles pagination at the database level
5. **Optimized Filtering**: Applies filters early in the pipeline

## Comparison with Existing Endpoint

| Feature | Existing Endpoint | Aggregated Endpoint |
|---------|------------------|-------------------|
| Database Queries | Multiple queries | Single aggregation |
| Performance | Slower | Faster |
| Data Completeness | Basic | Comprehensive |
| Course Details | Limited | Full course info |
| Computed Fields | Manual calculation | Database-level |
| Faculty Info | Not included | Included in summary |

## Data Fields Explained

### Student Information
- `_id`: Student's unique identifier
- `firstName`, `lastName`: Student's name
- `email`: Student's email address
- `studentId`: Student's ID number
- `department`: Student's department information
- `phone`: Student's phone number
- `avatar`: Student's profile picture URL

### Course Information
- `_id`: Course's unique identifier
- `title`: Course title
- `code`: Course code (e.g., CS101)
- `courseType`: Type of course (Core, Elective, etc.)
- `creditHours`: Number of credit hours
- `semester`: Semester number
- `year`: Academic year
- `currentEnrollment`: Current number of enrolled students
- `maxStudents`: Maximum allowed students

### Enrollment Information
- `enrollmentStatus`: Current enrollment status
- `enrollmentType`: Type of enrollment (full_time, part_time, etc.)
- `gpa`: Current GPA
- `cgpa`: Cumulative GPA

### Computed Fields
- `totalCredits`: Sum of credit hours for all courses
- `courseCount`: Number of courses the student is enrolled in

## Error Handling

The API includes comprehensive error handling for:
- Invalid faculty ID
- Faculty not found
- Database connection issues
- Aggregation pipeline errors
- Validation errors

## Rate Limiting

This endpoint is subject to the same rate limiting as other authenticated endpoints in the system.

## Caching

Consider implementing caching for frequently accessed faculty data to further improve performance.

## Security Considerations

1. **Authentication Required**: All requests must be authenticated
2. **Authorization**: Users can only access data for faculty they have permission to view
3. **Input Validation**: All parameters are validated before processing
4. **SQL Injection Protection**: Uses parameterized queries through aggregation pipeline 