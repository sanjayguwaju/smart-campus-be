# Student Assignments Aggregation API

This document describes the MongoDB aggregation pipeline implementation for efficiently fetching active assignments assigned to students.

## Overview

The aggregation pipeline provides a high-performance solution for retrieving student assignments by using MongoDB's native aggregation framework. This approach is more efficient than traditional find operations when dealing with complex joins and filtering requirements.

## Aggregation Pipeline Breakdown

### Stage 1: Find Student's Active Enrollment
```javascript
{
  $lookup: {
    from: 'enrollments',
    let: { studentId: new mongoose.Types.ObjectId(studentId) },
    pipeline: [
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ['$student', '$$studentId'] },
              { $eq: ['$status', 'active'] }
            ]
          }
        }
      },
      {
        $project: {
          courses: 1,
          semester: 1,
          academicYear: 1
        }
      }
    ],
    as: 'enrollment'
  }
}
```

**Purpose**: Joins the assignments collection with enrollments to find the student's active enrollment record.

### Stage 2: Unwind Enrollment Array
```javascript
{
  $unwind: {
    path: '$enrollment',
    preserveNullAndEmptyArrays: false
  }
}
```

**Purpose**: Flattens the enrollment array since we expect only one active enrollment per student.

### Stage 3: Match Active Assignments
```javascript
{
  $match: {
    $and: [
      { course: { $in: '$enrollment.courses' } },
      { status: 'published' },
      { isVisible: true }
    ]
  }
}
```

**Purpose**: Filters assignments to only include those that are:
- In the student's enrolled courses
- Published status
- Visible to students

### Stage 4: Apply Additional Filters
```javascript
{
  $match: {
    // Dynamic filters based on query parameters
    course: new mongoose.Types.ObjectId(course), // if course filter provided
    assignmentType: assignmentType, // if assignment type filter provided
    difficulty: difficulty, // if difficulty filter provided
    tags: { $in: tagArray }, // if tags filter provided
    dueDate: { $gte: dueDateFrom, $lte: dueDateTo }, // if date range provided
    $or: [ // if search provided
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ]
  }
}
```

**Purpose**: Applies user-specified filters for course, assignment type, difficulty, tags, date range, and search terms.

### Stage 5-7: Lookup Related Data
```javascript
// Lookup course information
{
  $lookup: {
    from: 'courses',
    localField: 'course',
    foreignField: '_id',
    as: 'courseInfo'
  }
}

// Lookup faculty information
{
  $lookup: {
    from: 'users',
    localField: 'faculty',
    foreignField: '_id',
    as: 'facultyInfo'
  }
}

// Lookup created by information
{
  $lookup: {
    from: 'users',
    localField: 'createdBy',
    foreignField: '_id',
    as: 'createdByInfo'
  }
}
```

**Purpose**: Joins with related collections to get course, faculty, and creator information.

### Stage 8: Format Data
```javascript
{
  $addFields: {
    course: { $arrayElemAt: ['$courseInfo', 0] },
    faculty: { $arrayElemAt: ['$facultyInfo', 0] },
    createdBy: { $arrayElemAt: ['$createdByInfo', 0] }
  }
}
```

**Purpose**: Extracts the first element from lookup arrays and assigns them to the main document.

### Stage 9: Project Fields
```javascript
{
  $project: {
    courseInfo: 0,
    facultyInfo: 0,
    createdByInfo: 0,
    enrollment: 0
  }
}
```

**Purpose**: Removes temporary arrays and keeps only the formatted data.

### Stage 10: Add Computed Fields
```javascript
{
  $addFields: {
    isOverdue: {
      $and: [
        { $lt: ['$dueDate', new Date()] },
        { $eq: ['$status', 'published'] }
      ]
    },
    daysUntilDue: {
      $ceil: {
        $divide: [
          { $subtract: ['$dueDate', new Date()] },
          1000 * 60 * 60 * 24
        ]
      }
    }
  }
}
```

**Purpose**: Adds computed fields for overdue status and days until due.

### Stage 11: Sort
```javascript
{
  $sort: {
    [sortBy]: sortOrder === 'desc' ? -1 : 1,
    _id: sortOrder === 'desc' ? -1 : 1 // for consistent pagination
  }
}
```

**Purpose**: Sorts the results by the specified field and order.

### Stage 12: Count for Pagination
```javascript
const countPipeline = [...pipeline, { $count: 'total' }];
const countResult = await Assignment.aggregate(countPipeline);
const total = countResult.length > 0 ? countResult[0].total : 0;
```

**Purpose**: Gets the total count of matching documents for pagination.

### Stage 13: Apply Pagination
```javascript
{
  $skip: skip
},
{
  $limit: parseInt(limit)
}
```

**Purpose**: Applies skip and limit for pagination.

## API Endpoint

### GET /api/v1/assignments/student/:studentId/active

**Description**: Get active assignments for a specific student using aggregation pipeline.

**Authentication**: Required (Admin or Faculty token)

**Path Parameters**:
- `studentId` (string): Student ID

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `course` (optional): Filter by course ID
- `assignmentType` (optional): Filter by assignment type
- `difficulty` (optional): Filter by difficulty
- `dueDateFrom` (optional): Filter by due date from (YYYY-MM-DD)
- `dueDateTo` (optional): Filter by due date to (YYYY-MM-DD)
- `sortBy` (optional): Sort field (default: dueDate)
- `sortOrder` (optional): Sort order (asc/desc, default: asc)
- `search` (optional): Search in title and description
- `tags` (optional): Filter by tags (comma-separated)

**Response**:
```json
{
  "success": true,
  "message": "Student active assignments retrieved successfully",
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
  },
  "studentInfo": {
    "studentId": "student_id",
    "studentName": "Jane Smith",
    "enrolledCourses": 3,
    "currentSemester": 2,
    "academicYear": "2024-2025"
  }
}
```

## Performance Benefits

### 1. **Single Database Query**
- Traditional approach: Multiple queries (enrollment lookup + assignment filtering)
- Aggregation approach: Single pipeline execution

### 2. **Efficient Joins**
- Uses MongoDB's native `$lookup` for optimal performance
- Reduces network round trips between application and database

### 3. **Index Utilization**
- MongoDB can optimize the entire pipeline execution
- Better use of compound indexes across collections

### 4. **Memory Efficiency**
- Processing happens at the database level
- Reduced data transfer between database and application

### 5. **Scalability**
- Handles large datasets more efficiently
- Better performance with complex filtering requirements

## Usage Examples

### Get all active assignments for a student
```bash
curl -X GET "http://localhost:3000/api/v1/assignments/student/student_id/active" \
  -H "Authorization: Bearer <admin_token>"
```

### Get assignments with filtering
```bash
curl -X GET "http://localhost:3000/api/v1/assignments/student/student_id/active?assignmentType=Homework&difficulty=Medium" \
  -H "Authorization: Bearer <admin_token>"
```

### Get assignments with search and pagination
```bash
curl -X GET "http://localhost:3000/api/v1/assignments/student/student_id/active?search=programming&page=1&limit=5" \
  -H "Authorization: Bearer <admin_token>"
```

### Get assignments by date range
```bash
curl -X GET "http://localhost:3000/api/v1/assignments/student/student_id/active?dueDateFrom=2024-01-01&dueDateTo=2024-01-31" \
  -H "Authorization: Bearer <admin_token>"
```

## Testing

Run the aggregation tests:
```bash
npm test src/tests/student-assignments-aggregation.test.js
```

The test suite covers:
- Aggregation pipeline functionality
- Active assignment filtering
- Permission checks
- Pagination and sorting
- Search and filtering
- Performance with multiple courses
- Computed fields (isOverdue, daysUntilDue)

## Error Handling

The aggregation pipeline handles various error scenarios:

- **404**: Student not found
- **403**: Insufficient permissions
- **400**: Invalid query parameters
- **500**: Aggregation pipeline errors

## Performance Considerations

### 1. **Indexing Strategy**
```javascript
// Recommended indexes for optimal performance
db.assignments.createIndex({ "course": 1, "status": 1, "isVisible": 1 });
db.assignments.createIndex({ "dueDate": 1 });
db.assignments.createIndex({ "title": "text", "description": "text" });
db.enrollments.createIndex({ "student": 1, "status": 1 });
```

### 2. **Pipeline Optimization**
- Early filtering reduces data processing
- Efficient lookup operations
- Proper field projection to reduce data transfer

### 3. **Caching Strategy**
- Consider Redis caching for frequently accessed data
- Cache student enrollment data
- Cache assignment metadata

### 4. **Monitoring**
- Monitor aggregation execution time
- Track memory usage
- Monitor index usage

## Comparison with Traditional Approach

| Aspect | Traditional Approach | Aggregation Approach |
|--------|---------------------|---------------------|
| **Queries** | Multiple separate queries | Single pipeline |
| **Performance** | Slower with complex joins | Faster with native joins |
| **Memory Usage** | Higher (multiple result sets) | Lower (streaming processing) |
| **Scalability** | Limited by application logic | Better with large datasets |
| **Complexity** | Simpler to understand | More complex pipeline |
| **Flexibility** | Limited filtering options | Rich filtering capabilities |

## Future Enhancements

1. **Caching Layer**: Implement Redis caching for aggregation results
2. **Real-time Updates**: Use MongoDB change streams for live updates
3. **Advanced Analytics**: Add aggregation stages for assignment analytics
4. **Performance Monitoring**: Add metrics collection for pipeline performance
5. **Dynamic Pipeline**: Support for user-defined aggregation stages 