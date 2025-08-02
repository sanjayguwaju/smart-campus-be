# Student Assignments API

This document describes the new student assignments functionality that allows students to view assignments specifically assigned to them based on their course enrollments.

## Overview

The student assignments API provides dedicated endpoints for students to access assignments for their enrolled courses. It includes comprehensive filtering, search, and pagination capabilities while ensuring proper access control and data security.

## Features

- **Role-based Access Control**: Only students can access their own assignments
- **Enrollment-based Filtering**: Assignments are filtered based on student's active course enrollments
- **Comprehensive Filtering**: Filter by course, assignment type, difficulty, due dates, tags, etc.
- **Search Functionality**: Search assignments by title and description
- **Pagination Support**: Efficient pagination for large datasets
- **Overdue Detection**: Automatic detection and flagging of overdue assignments
- **Student Information**: Includes student details and enrollment information in responses

## API Endpoints

### 1. Get My Course Assignments (Student)

**Endpoint**: `GET /api/v1/assignments/my-courses`

**Description**: Get assignments for the authenticated student's enrolled courses.

**Authentication**: Required (Student token)

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `course` (optional): Filter by course ID
- `assignmentType` (optional): Filter by assignment type (Homework, Project, Quiz, Exam, Lab, Presentation, Essay, Research)
- `difficulty` (optional): Filter by difficulty (Easy, Medium, Hard, Expert)
- `dueDateFrom` (optional): Filter by due date from (YYYY-MM-DD)
- `dueDateTo` (optional): Filter by due date to (YYYY-MM-DD)
- `sortBy` (optional): Sort field (default: dueDate)
- `sortOrder` (optional): Sort order (asc/desc, default: asc)
- `search` (optional): Search in title and description
- `tags` (optional): Filter by tags (comma-separated)
- `includeOverdue` (optional): Include only overdue assignments (boolean)

**Response**:
```json
{
  "success": true,
  "message": "Course assignments retrieved successfully",
  "data": [
    {
      "_id": "assignment_id",
      "title": "Programming Assignment 1",
      "description": "Create a simple calculator program",
      "course": {
        "_id": "course_id",
        "name": "Introduction to Programming",
        "code": "CS101"
      },
      "faculty": {
        "_id": "faculty_id",
        "firstName": "John",
        "lastName": "Doe"
      },
      "assignmentType": "Homework",
      "dueDate": "2024-01-15T23:59:59.000Z",
      "totalPoints": 100,
      "difficulty": "Medium",
      "isOverdue": false,
      "daysUntilDue": 5
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

### 2. Get Student Assignments (Admin/Faculty)

**Endpoint**: `GET /api/v1/assignments/student/:studentId`

**Description**: Get assignments for a specific student (for admin and faculty use).

**Authentication**: Required (Admin or Faculty token)

**Path Parameters**:
- `studentId`: Student ID

**Query Parameters**: Same as above

**Response**: Same as above, plus student information:
```json
{
  "success": true,
  "message": "Student assignments retrieved successfully",
  "data": [...],
  "pagination": {...},
  "studentInfo": {
    "studentId": "student_id",
    "studentName": "Jane Smith",
    "enrolledCourses": 3,
    "currentSemester": 2,
    "academicYear": "2024-2025"
  }
}
```

## Service Methods

### `getStudentAssignments(studentId, query)`

**Location**: `src/services/assignment.service.js`

**Parameters**:
- `studentId` (string): Student ID
- `query` (object): Query parameters for filtering and pagination

**Features**:
- Validates student exists and is actually a student
- Retrieves student's active enrollment and enrolled courses
- Filters assignments by enrolled courses only
- Ensures only published and visible assignments are returned
- Adds overdue status and days until due to each assignment
- Supports comprehensive filtering and search
- Includes student information in response

**Returns**:
```javascript
{
  assignments: [...],
  data: [...],
  pagination: {...},
  studentInfo: {...}
}
```

## Controller Methods

### `getMyCourseAssignments(req, res)`

**Location**: `src/controllers/assignment.controller.js`

**Description**: Controller for students to get their own course assignments.

### `getStudentAssignments(req, res)`

**Location**: `src/controllers/assignment.controller.js`

**Description**: Controller for admin/faculty to get assignments for a specific student.

**Permission Checks**:
- Students cannot access other students' assignments
- Faculty can only access assignments for students enrolled in their courses
- Admins can access any student's assignments

## Security Features

1. **Role-based Access Control**: 
   - Students can only access their own assignments
   - Faculty can only access assignments for students in their courses
   - Admins have full access

2. **Enrollment Validation**: 
   - Only assignments from enrolled courses are returned
   - Validates active enrollment status

3. **Assignment Visibility**: 
   - Only published and visible assignments are returned
   - Students cannot see draft or archived assignments

4. **Course Access Control**: 
   - Faculty can only access student assignments if the student is enrolled in their courses

## Usage Examples

### Get all assignments for authenticated student
```bash
curl -X GET "http://localhost:3000/api/v1/assignments/my-courses" \
  -H "Authorization: Bearer <student_token>"
```

### Get assignments filtered by course
```bash
curl -X GET "http://localhost:3000/api/v1/assignments/my-courses?course=course_id" \
  -H "Authorization: Bearer <student_token>"
```

### Get overdue assignments only
```bash
curl -X GET "http://localhost:3000/api/v1/assignments/my-courses?includeOverdue=true" \
  -H "Authorization: Bearer <student_token>"
```

### Search assignments by title
```bash
curl -X GET "http://localhost:3000/api/v1/assignments/my-courses?search=programming" \
  -H "Authorization: Bearer <student_token>"
```

### Get assignments for specific student (admin/faculty)
```bash
curl -X GET "http://localhost:3000/api/v1/assignments/student/student_id" \
  -H "Authorization: Bearer <admin_token>"
```

## Testing

Run the student assignments tests:
```bash
npm test src/tests/student-assignments.test.js
```

The test suite covers:
- Authentication and authorization
- Assignment retrieval for enrolled students
- Empty results for students without enrollments
- Filtering and search functionality
- Permission checks for different user roles
- Student information inclusion in responses

## Error Handling

The API handles various error scenarios:

- **404**: Student not found
- **403**: Insufficient permissions
- **400**: Invalid query parameters
- **500**: Server errors

All errors include appropriate error messages and status codes.

## Performance Considerations

1. **Indexing**: The service uses database indexes for efficient querying
2. **Pagination**: Large datasets are paginated to prevent performance issues
3. **Population**: Related data (course, faculty) is populated efficiently
4. **Caching**: Consider implementing Redis caching for frequently accessed data

## Future Enhancements

1. **Assignment Submission Status**: Include submission status for each assignment
2. **Grade Information**: Include grades for completed assignments
3. **Notifications**: Real-time notifications for new assignments
4. **Calendar Integration**: Export assignments to calendar format
5. **Bulk Operations**: Bulk actions on multiple assignments 