# Faculty Students API Documentation

## Get Students by Faculty

This API endpoint retrieves all students enrolled in courses taught by a specific faculty member. This is extremely useful for faculty to manage and view all their students across different courses.

### Endpoint

```
GET /api/v1/courses/faculty/{facultyId}/students
```

### Description

Returns all students who are enrolled in any course taught by the specified faculty member. The response includes detailed student information, their enrolled courses, academic performance, and summary statistics.

### Parameters

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| facultyId | string | Yes | The ID of the faculty member |

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number for pagination |
| limit | integer | 10 | Number of students per page (max 50) |
| sortBy | string | firstName | Field to sort by (firstName, lastName, email, studentId, gpa) |
| sortOrder | string | asc | Sort order (asc, desc) |
| courseId | string | - | Filter by specific course ID |
| search | string | - | Search students by name, email, or student ID |
| status | string | active | Filter by enrollment status (active, completed, dropped, suspended, graduated) |

### Authentication

This endpoint requires authentication. Include the Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Response

#### Success Response (200)

```json
{
  "success": true,
  "message": "Students retrieved successfully",
  "data": [
    {
      "_id": "student_id_here",
      "firstName": "John",
      "lastName": "Smith",
      "email": "john.smith@student.edu",
      "studentId": "STU2024001",
      "department": {
        "_id": "dept_id_here",
        "name": "Computer Science"
      },
      "courses": [
        {
          "_id": "course_id_here",
          "title": "Introduction to Computer Science",
          "code": "CS101"
        },
        {
          "_id": "course_id_2",
          "title": "Data Structures",
          "code": "CS201"
        }
      ],
      "totalCredits": 6,
      "gpa": 3.75,
      "enrollmentStatus": "active",
      "enrollmentType": "full_time"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  },
  "summary": {
    "totalStudents": 25,
    "totalCourses": 3,
    "averageStudentsPerCourse": 8.33
  }
}
```

#### Error Responses

**404 - Faculty Not Found**
```json
{
  "success": false,
  "message": "Faculty not found"
}
```

**500 - Internal Server Error**
```json
{
  "success": false,
  "message": "Failed to retrieve students"
}
```

### Example Usage

#### Basic Request

```bash
curl -X GET \
  'http://localhost:3000/api/v1/courses/faculty/64f8a1b2c3d4e5f6a7b8c9d0/students' \
  -H 'Authorization: Bearer your-jwt-token-here' \
  -H 'Content-Type: application/json'
```

#### With Pagination and Sorting

```bash
curl -X GET \
  'http://localhost:3000/api/v1/courses/faculty/64f8a1b2c3d4e5f6a7b8c9d0/students?page=1&limit=20&sortBy=lastName&sortOrder=asc' \
  -H 'Authorization: Bearer your-jwt-token-here' \
  -H 'Content-Type: application/json'
```

#### With Search and Course Filter

```bash
curl -X GET \
  'http://localhost:3000/api/v1/courses/faculty/64f8a1b2c3d4e5f6a7b8c9d0/students?search=john&courseId=64f8a1b2c3d4e5f6a7b8c9d1' \
  -H 'Authorization: Bearer your-jwt-token-here' \
  -H 'Content-Type: application/json'
```

#### JavaScript (Fetch)

```javascript
// Basic request
const response = await fetch('/api/v1/courses/faculty/64f8a1b2c3d4e5f6a7b8c9d0/students', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your-jwt-token-here',
    'Content-Type': 'application/json'
  }
});

// With query parameters
const params = new URLSearchParams({
  page: '1',
  limit: '20',
  sortBy: 'lastName',
  sortOrder: 'asc',
  search: 'john'
});

const response = await fetch(`/api/v1/courses/faculty/64f8a1b2c3d4e5f6a7b8c9d0/students?${params}`, {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your-jwt-token-here',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```

### Features

#### 1. **Comprehensive Student Information**
- Basic student details (name, email, student ID)
- Department information
- Academic performance (GPA, total credits)
- Enrollment status and type

#### 2. **Course Information**
- List of all courses the student is enrolled in (taught by the faculty)
- Course titles and codes
- Easy identification of which courses belong to the faculty

#### 3. **Advanced Filtering**
- **Course-specific filtering**: Get students from a specific course
- **Search functionality**: Search by name, email, or student ID
- **Status filtering**: Filter by enrollment status
- **Pagination**: Handle large datasets efficiently

#### 4. **Sorting Options**
- Sort by firstName, lastName, email, studentId, or gpa
- Ascending or descending order
- Useful for organizing student lists

#### 5. **Summary Statistics**
- Total number of students
- Total number of courses taught by the faculty
- Average students per course
- Helps faculty understand their teaching load

#### 6. **Pagination**
- Configurable page size (default 10, max 50)
- Total count and page information
- Efficient for large datasets

### Use Cases

#### 1. **Faculty Dashboard**
- View all students across all courses
- Quick overview of teaching responsibilities
- Monitor student distribution

#### 2. **Course Management**
- Filter students by specific course
- Track enrollment in individual courses
- Manage course-specific student lists

#### 3. **Student Search**
- Find specific students quickly
- Search by name, email, or student ID
- Useful for administrative tasks

#### 4. **Academic Monitoring**
- View student GPAs and academic performance
- Monitor enrollment status
- Track student progress

#### 5. **Reporting**
- Generate student lists for reports
- Export student data for analysis
- Create attendance sheets

### Implementation Details

The API is implemented using:
- **Controller**: `courseController.getStudentsByFaculty()`
- **Service**: `courseService.getStudentsByFaculty()`
- **Route**: `/api/v1/courses/faculty/:facultyId/students`

#### Data Flow:
1. Get all active courses taught by the faculty
2. Find all enrollments that include these courses
3. Populate student and course information
4. Process and deduplicate students
5. Apply filters, sorting, and pagination
6. Calculate summary statistics
7. Return formatted response

#### Performance Optimizations:
- Uses lean queries for better performance
- Efficient data processing with Map for deduplication
- Pagination to handle large datasets
- Selective field population to reduce data transfer

### Notes

- Only active courses are considered
- Students are deduplicated across multiple courses
- Search is case-insensitive
- Maximum limit is 50 students per page
- Summary statistics are calculated from the filtered dataset
- Course information only includes courses taught by the specified faculty 