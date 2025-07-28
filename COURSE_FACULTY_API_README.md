# Course Faculty API Documentation

## Get Courses by Faculty

This API endpoint retrieves all courses assigned to a specific faculty member.

### Endpoint

```
GET /api/v1/courses/faculty/{facultyId}
```

### Description

Returns all courses that are assigned to the specified faculty member. Only active courses are returned.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| facultyId | string | Yes | The ID of the faculty member |

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
  "message": "Courses retrieved successfully",
  "data": [
    {
      "_id": "course_id_here",
      "title": "Introduction to Computer Science",
      "code": "CS101",
      "description": "Basic concepts of computer science",
      "faculty": {
        "_id": "faculty_id_here",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@university.edu",
        "department": "Computer Science"
      },
      "department": {
        "_id": "dept_id_here",
        "name": "Computer Science"
      },
      "semester": 1,
      "year": 2024,
      "creditHours": 3,
      "maxStudents": 30,
      "currentEnrollment": 25,
      "status": "active",
      "isActive": true,
      "isPublished": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
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
  "message": "Failed to retrieve courses"
}
```

### Example Usage

#### cURL

```bash
curl -X GET \
  http://localhost:3000/api/v1/courses/faculty/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H 'Authorization: Bearer your-jwt-token-here' \
  -H 'Content-Type: application/json'
```

#### JavaScript (Fetch)

```javascript
const response = await fetch('/api/v1/courses/faculty/64f8a1b2c3d4e5f6a7b8c9d0', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your-jwt-token-here',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```

### Notes

- Only active courses are returned
- The faculty field is populated with basic faculty information
- The department field is populated with department information
- Students field is populated with enrolled student information
- Courses are sorted by course code in ascending order

### Implementation Details

The API is implemented using:
- **Controller**: `courseController.getCoursesByFaculty()`
- **Service**: `courseService.getCoursesByFaculty()`
- **Model**: `Course.findByFaculty()` static method
- **Route**: `/api/v1/courses/faculty/:facultyId`

The endpoint filters courses by:
- Faculty ID (exact match)
- Status = 'active'
- Sorts by course code (ascending) 