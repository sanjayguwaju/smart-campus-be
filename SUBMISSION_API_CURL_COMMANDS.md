# Submission API - Curl Commands Documentation

This document provides comprehensive curl commands for testing all Submission API endpoints. The API includes authentication, validation, file management, grading, plagiarism checking, and bulk operations.

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
All endpoints require a Bearer token. Replace `YOUR_JWT_TOKEN` with your actual JWT token.

```bash
# Example authentication header
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 1. Create Submission

### Create a new submission (Students only)
```bash
curl -X POST http://localhost:3000/api/v1/submissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "assignment": "507f1f77bcf86cd799439011",
    "student": "507f1f77bcf86cd799439012",
    "files": [
      {
        "fileName": "assignment.pdf",
        "fileUrl": "https://example.com/file.pdf",
        "fileSize": 1024000,
        "fileType": "application/pdf"
      }
    ],
    "studentComments": "This is my submission for the assignment."
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Submission created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "assignment": "507f1f77bcf86cd799439011",
    "student": "507f1f77bcf86cd799439012",
    "status": "submitted",
    "submissionNumber": 1,
    "submittedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## 2. Get Submissions

### Get all submissions with filtering and pagination
```bash
curl -X GET "http://localhost:3000/api/v1/submissions?page=1&limit=10&status=submitted&sortBy=submittedAt&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get submissions by assignment
```bash
curl -X GET http://localhost:3000/api/v1/submissions/assignment/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get submissions by student
```bash
curl -X GET http://localhost:3000/api/v1/submissions/student/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get my submissions (for students)
```bash
curl -X GET "http://localhost:3000/api/v1/submissions/my?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get my graded submissions (for students)
```bash
curl -X GET "http://localhost:3000/api/v1/submissions/my/graded?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get my late submissions (for students)
```bash
curl -X GET "http://localhost:3000/api/v1/submissions/my/late?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 3. Get Submission by ID

### Get specific submission
```bash
curl -X GET http://localhost:3000/api/v1/submissions/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get submission history
```bash
curl -X GET http://localhost:3000/api/v1/submissions/507f1f77bcf86cd799439013/history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get submission summary
```bash
curl -X GET http://localhost:3000/api/v1/submissions/507f1f77bcf86cd799439013/summary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Calculate final score
```bash
curl -X GET http://localhost:3000/api/v1/submissions/507f1f77bcf86cd799439013/final-score \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 4. Update Submission

### Update submission details
```bash
curl -X PUT http://localhost:3000/api/v1/submissions/507f1f77bcf86cd799439013 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "under_review",
    "studentComments": "Updated submission comments"
  }'
```

## 5. File Management

### Add file to submission
```bash
curl -X POST http://localhost:3000/api/v1/submissions/507f1f77bcf86cd799439013/files \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "fileName": "additional_file.pdf",
    "fileUrl": "https://example.com/additional_file.pdf",
    "fileSize": 2048000,
    "fileType": "application/pdf"
  }'
```

### Remove file from submission
```bash
curl -X DELETE http://localhost:3000/api/v1/submissions/507f1f77bcf86cd799439013/files \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "fileUrl": "https://example.com/file.pdf"
  }'
```

## 6. Grading Operations

### Grade submission (Faculty/Admin only)
```bash
curl -X POST http://localhost:3000/api/v1/submissions/507f1f77bcf86cd799439013/grade \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "grade": "A",
    "numericalScore": 85,
    "criteriaScores": [
      {
        "criterion": "Content Quality",
        "maxPoints": 40,
        "earnedPoints": 35,
        "feedback": "Good content but could be more detailed"
      },
      {
        "criterion": "Technical Accuracy",
        "maxPoints": 30,
        "earnedPoints": 28,
        "feedback": "Technically sound with minor errors"
      },
      {
        "criterion": "Presentation",
        "maxPoints": 30,
        "earnedPoints": 22,
        "feedback": "Well presented and organized"
      }
    ],
    "feedback": {
      "general": "Overall good work. Pay attention to detail in future assignments.",
      "strengths": ["Clear structure", "Good research"],
      "improvements": ["More detailed analysis", "Better citations"],
      "rubric": "Met most criteria satisfactorily"
    }
  }'
```

### Return submission for revision (Faculty/Admin only)
```bash
curl -X POST http://localhost:3000/api/v1/submissions/507f1f77bcf86cd799439013/return \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "feedback": {
      "general": "Please revise the following sections:",
      "strengths": ["Good initial approach"],
      "improvements": ["Section 2 needs more detail", "Add more examples"],
      "rubric": "Please address the feedback before resubmitting"
    }
  }'
```

### Mark submission as late (Faculty/Admin only)
```bash
curl -X POST http://localhost:3000/api/v1/submissions/507f1f77bcf86cd799439013/late \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "penalty": 10
  }'
```

## 7. Plagiarism and Verification

### Check plagiarism (Faculty/Admin only)
```bash
curl -X POST http://localhost:3000/api/v1/submissions/507f1f77bcf86cd799439013/plagiarism \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "similarityScore": 15.5,
    "reportUrl": "https://example.com/plagiarism_report.pdf"
  }'
```

### Verify submission (Faculty/Admin only)
```bash
curl -X POST http://localhost:3000/api/v1/submissions/507f1f77bcf86cd799439013/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "notes": "Submission verified and approved"
  }'
```

## 8. Special Queries

### Get late submissions
```bash
curl -X GET http://localhost:3000/api/v1/submissions/late \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get ungraded submissions
```bash
curl -X GET http://localhost:3000/api/v1/submissions/ungraded \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get plagiarism flagged submissions
```bash
curl -X GET http://localhost:3000/api/v1/submissions/plagiarism-flagged \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Search submissions
```bash
curl -X GET "http://localhost:3000/api/v1/submissions/search?search=assignment&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get submissions by status
```bash
curl -X GET "http://localhost:3000/api/v1/submissions/status/graded?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get submissions by grade
```bash
curl -X GET "http://localhost:3000/api/v1/submissions/grade/A?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 9. Statistics

### Get submission statistics
```bash
curl -X GET http://localhost:3000/api/v1/submissions/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Submission statistics retrieved successfully",
  "data": {
    "totalSubmissions": 150,
    "gradedSubmissions": 120,
    "lateSubmissions": 15,
    "plagiarismFlagged": 3,
    "averageScore": 78.5,
    "verifiedSubmissions": 95,
    "pendingSubmissions": 30
  }
}
```

## 10. Bulk Operations

### Bulk grade submissions (Faculty/Admin only)
```bash
curl -X POST http://localhost:3000/api/v1/submissions/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "operation": "grade",
    "submissionIds": [
      "507f1f77bcf86cd799439013",
      "507f1f77bcf86cd799439014",
      "507f1f77bcf86cd799439015"
    ],
    "data": {
      "grade": "B+",
      "numericalScore": 82,
      "feedback": {
        "general": "Good work overall"
      }
    }
  }'
```

### Bulk mark submissions as late (Faculty/Admin only)
```bash
curl -X POST http://localhost:3000/api/v1/submissions/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "operation": "markLate",
    "submissionIds": [
      "507f1f77bcf86cd799439013",
      "507f1f77bcf86cd799439014"
    ],
    "data": {
      "penalty": 15
    }
  }'
```

### Bulk check plagiarism (Faculty/Admin only)
```bash
curl -X POST http://localhost:3000/api/v1/submissions/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "operation": "checkPlagiarism",
    "submissionIds": [
      "507f1f77bcf86cd799439013",
      "507f1f77bcf86cd799439014"
    ],
    "data": {
      "similarityScore": 12.5,
      "reportUrl": "https://example.com/bulk_report.pdf"
    }
  }'
```

### Bulk delete submissions (Faculty/Admin only)
```bash
curl -X POST http://localhost:3000/api/v1/submissions/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "operation": "delete",
    "submissionIds": [
      "507f1f77bcf86cd799439013",
      "507f1f77bcf86cd799439014"
    ]
  }'
```

## 11. Delete Submission

### Delete a submission (Faculty/Admin only)
```bash
curl -X DELETE http://localhost:3000/api/v1/submissions/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "assignment",
      "message": "Assignment ID must be a valid MongoDB ObjectId",
      "value": "invalid-id"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Unauthorized - No token provided"
}
```

### Forbidden (403)
```json
{
  "success": false,
  "message": "Forbidden - insufficient permissions"
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Submission not found"
}
```

## Testing Scenarios

### 1. Student Workflow
1. Create submission
2. Add files to submission
3. View my submissions
4. Check submission status
5. View graded submissions

### 2. Faculty Workflow
1. View submissions for assignments
2. Grade submissions
3. Return submissions for revision
4. Check plagiarism
5. Mark late submissions
6. View statistics

### 3. Admin Workflow
1. View all submissions
2. Perform bulk operations
3. Verify submissions
4. Manage submission lifecycle
5. Generate reports

## Notes

- All timestamps are in ISO 8601 format
- File sizes are in bytes
- Grades follow standard academic grading (A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F, Incomplete, Pass, Fail)
- Late penalties are percentages (0-100)
- Plagiarism similarity scores are percentages (0-100)
- Pagination defaults: page=1, limit=10, max limit=100
- Search is case-insensitive and searches in file names, comments, and notes
- Role-based access control is enforced for all endpoints 