# Program API - Complete Curl Commands

This document contains curl commands for testing all program-related APIs with the improved implementation.

## 📊 API Overview

### ✅ What's Now Implemented
- ✅ Authentication & Authorization (Admin/User roles)
- ✅ Input validation for all endpoints
- ✅ Swagger documentation
- ✅ Comprehensive service layer
- ✅ Proper error handling and logging
- ✅ Pagination and filtering
- ✅ Search functionality
- ✅ Program statistics
- ✅ Advanced features (publish/unpublish, by department, by level)

### 📝 API Endpoints

| Method | Endpoint | Description | Auth Required | Admin Required |
|--------|----------|-------------|---------------|----------------|
| GET | `/` | Get all programs with filters | ✅ | ❌ |
| GET | `/published` | Get published programs only | ✅ | ❌ |
| GET | `/search` | Search programs | ✅ | ❌ |
| GET | `/stats` | Get program statistics | ✅ | ✅ |
| GET | `/department/:id` | Get programs by department | ✅ | ❌ |
| GET | `/level/:level` | Get programs by level | ✅ | ❌ |
| GET | `/:id` | Get program by ID | ✅ | ❌ |
| POST | `/` | Create new program | ✅ | ✅ |
| PUT | `/:id` | Update program | ✅ | ✅ |
| PUT | `/:id/publish` | Publish/unpublish program | ✅ | ✅ |
| DELETE | `/:id` | Delete program | ✅ | ✅ |

## 🚀 Curl Commands

### Prerequisites
- **Base URL**: Replace `YOUR_BASE_URL` with your actual server URL (e.g., `http://localhost:3000`)
- **Authentication**: Replace `YOUR_ACCESS_TOKEN` with a valid JWT access token
- **Admin Token**: Replace `YOUR_ADMIN_ACCESS_TOKEN` with a valid admin JWT token

### Authentication

First, you need to get an access token by logging in:

```bash
# Login to get access token
curl -X POST "YOUR_BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

---

### 1. Get All Programs (with pagination and filters)

#### Basic request
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### With pagination
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### With search filter
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs?search=computer" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### With department filter
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs?department=507f1f77bcf86cd799439012" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### With level filter
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs?level=Undergraduate" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### With status filter
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs?status=published" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### With published filter
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs?isPublished=true" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### With sorting
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs?sortBy=name&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Combined filters
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs?page=1&limit=10&search=engineering&level=Undergraduate&isPublished=true&sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Programs retrieved successfully",
  "data": {
    "data": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Computer Science",
        "department": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Computer Science Department",
          "code": "CS"
        },
        "level": "Undergraduate",
        "duration": "4 years",
        "semesters": 8,
        "description": "A comprehensive program in computer science",
        "prerequisites": ["Mathematics", "Physics"],
        "image": "https://example.com/cs-image.jpg",
        "brochureUrl": "https://example.com/cs-brochure.pdf",
        "isPublished": true,
        "status": "published",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
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

---

### 2. Get Published Programs Only

```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs/published" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 3. Search Programs

#### Basic search
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs/search?q=computer" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Search with limit
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs/search?q=engineering&limit=5" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 4. Get Program Statistics (Admin Only)

```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs/stats" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Program statistics retrieved successfully",
  "data": {
    "total": 25,
    "published": 18,
    "draft": 7,
    "undergraduate": 15,
    "postgraduate": 10,
    "publishedPercentage": 72
  }
}
```

---

### 5. Get Programs by Department

```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs/department/DEPARTMENT_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Example:**
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs/department/507f1f77bcf86cd799439012" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 6. Get Programs by Level

```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs/level/LEVEL" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Examples:**
```bash
# Undergraduate programs
curl -X GET "YOUR_BASE_URL/api/v1/programs/level/Undergraduate" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Postgraduate programs
curl -X GET "YOUR_BASE_URL/api/v1/programs/level/Postgraduate" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 7. Get Program by ID

```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs/PROGRAM_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Example:**
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 8. Create New Program (Admin Only)

#### Basic program creation
```bash
curl -X POST "YOUR_BASE_URL/api/v1/programs" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Computer Science",
    "department": "507f1f77bcf86cd799439012",
    "level": "Undergraduate",
    "duration": "4 years",
    "semesters": 8,
    "description": "A comprehensive program in computer science and engineering",
    "prerequisites": ["Mathematics", "Physics"],
    "image": "https://example.com/cs-image.jpg",
    "brochureUrl": "https://example.com/cs-brochure.pdf",
    "isPublished": false,
    "status": "draft"
  }'
```

#### Minimal program creation
```bash
curl -X POST "YOUR_BASE_URL/api/v1/programs" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mathematics",
    "department": "507f1f77bcf86cd799439012",
    "level": "Undergraduate",
    "duration": "3 years",
    "semesters": 6,
    "description": "Bachelor of Mathematics program"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Program created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Computer Science",
    "department": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Computer Science Department",
      "code": "CS"
    },
    "level": "Undergraduate",
    "duration": "4 years",
    "semesters": 8,
    "description": "A comprehensive program in computer science and engineering",
    "prerequisites": ["Mathematics", "Physics"],
    "image": "https://example.com/cs-image.jpg",
    "brochureUrl": "https://example.com/cs-brochure.pdf",
    "isPublished": false,
    "status": "draft",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 9. Update Program (Admin Only)

#### Update all fields
```bash
curl -X PUT "YOUR_BASE_URL/api/v1/programs/PROGRAM_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Computer Science & Engineering",
    "description": "Updated description for the program",
    "semesters": 9,
    "prerequisites": ["Mathematics", "Physics", "Chemistry"]
  }'
```

#### Partial update
```bash
curl -X PUT "YOUR_BASE_URL/api/v1/programs/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description for the program"
  }'
```

---

### 10. Publish/Unpublish Program (Admin Only)

#### Publish program
```bash
curl -X PUT "YOUR_BASE_URL/api/v1/programs/PROGRAM_ID/publish" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isPublished": true
  }'
```

#### Unpublish program
```bash
curl -X PUT "YOUR_BASE_URL/api/v1/programs/PROGRAM_ID/publish" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isPublished": false
  }'
```

**Example:**
```bash
curl -X PUT "YOUR_BASE_URL/api/v1/programs/507f1f77bcf86cd799439011/publish" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isPublished": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Program published successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Computer Science",
    "department": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Computer Science Department",
      "code": "CS"
    },
    "level": "Undergraduate",
    "duration": "4 years",
    "semesters": 8,
    "description": "A comprehensive program in computer science",
    "prerequisites": ["Mathematics", "Physics"],
    "image": "https://example.com/cs-image.jpg",
    "brochureUrl": "https://example.com/cs-brochure.pdf",
    "isPublished": true,
    "status": "published",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 11. Delete Program (Admin Only)

```bash
curl -X DELETE "YOUR_BASE_URL/api/v1/programs/PROGRAM_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN"
```

**Example:**
```bash
curl -X DELETE "YOUR_BASE_URL/api/v1/programs/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Program deleted successfully"
}
```

---

## 🔄 Complete Testing Workflow

### 1. Login and get admin token
```bash
curl -X POST "YOUR_BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

### 2. Create a test program
```bash
curl -X POST "YOUR_BASE_URL/api/v1/programs" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Program",
    "department": "507f1f77bcf86cd799439012",
    "level": "Undergraduate",
    "duration": "3 years",
    "semesters": 6,
    "description": "A test program for API testing",
    "prerequisites": ["Test Prerequisite"],
    "isPublished": false,
    "status": "draft"
  }'
```

### 3. Get all programs
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Get the created program by ID (use ID from step 2)
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs/PROGRAM_ID_FROM_STEP_2" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Update the program
```bash
curl -X PUT "YOUR_BASE_URL/api/v1/programs/PROGRAM_ID_FROM_STEP_2" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated test program description"
  }'
```

### 6. Publish the program
```bash
curl -X PUT "YOUR_BASE_URL/api/v1/programs/PROGRAM_ID_FROM_STEP_2/publish" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isPublished": true
  }'
```

### 7. Search for the program
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs/search?q=test" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 8. Get published programs
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs/published" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 9. Get program statistics
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs/stats" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN"
```

### 10. Get programs by level
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs/level/Undergraduate" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 11. Get programs by department
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs/department/507f1f77bcf86cd799439012" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 12. Unpublish the program (required before deletion)
```bash
curl -X PUT "YOUR_BASE_URL/api/v1/programs/PROGRAM_ID_FROM_STEP_2/publish" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isPublished": false
  }'
```

### 13. Delete the test program
```bash
curl -X DELETE "YOUR_BASE_URL/api/v1/programs/PROGRAM_ID_FROM_STEP_2" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN"
```

---

## ❌ Error Testing

### Test with invalid token
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs" \
  -H "Authorization: Bearer invalid_token"
```

### Test with missing required fields
```bash
curl -X POST "YOUR_BASE_URL/api/v1/programs" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Program"
  }'
```

### Test with invalid level enum
```bash
curl -X POST "YOUR_BASE_URL/api/v1/programs" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Program",
    "department": "507f1f77bcf86cd799439012",
    "level": "InvalidLevel",
    "duration": "3 years",
    "semesters": 6,
    "description": "Test description"
  }'
```

### Test with invalid department ID
```bash
curl -X POST "YOUR_BASE_URL/api/v1/programs" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Program",
    "department": "invalid_id",
    "level": "Undergraduate",
    "duration": "3 years",
    "semesters": 6,
    "description": "Test description"
  }'
```

### Test publish with invalid boolean
```bash
curl -X PUT "YOUR_BASE_URL/api/v1/programs/507f1f77bcf86cd799439011/publish" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isPublished": "not_a_boolean"
  }'
```

### Test search without query parameter
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs/search" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Test delete published program (should fail)
```bash
curl -X DELETE "YOUR_BASE_URL/api/v1/programs/PROGRAM_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN"
```

---

## 📋 Program Model Schema

```javascript
{
  name: { type: String, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  level: { type: String, enum: ['Undergraduate', 'Postgraduate'], required: true },
  duration: { type: String, required: true },
  semesters: { type: Number, required: true },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  prerequisites: [{ type: String, trim: true, maxlength: 100 }],
  image: { type: String, trim: true },
  brochureUrl: { type: String, trim: true },
  isPublished: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' }
}
```

---

## 🔐 Security Features

1. **Authentication Required**: All endpoints require valid JWT tokens
2. **Role-Based Access**: Admin-only endpoints are protected
3. **Input Validation**: All request data is validated
4. **Business Logic Validation**: Prevents duplicate programs, validates department existence
5. **Safe Deletion**: Prevents deletion of published programs

---

## 🎯 Key Features

### Business Logic
- **Duplicate Prevention**: Cannot create programs with same name in same department
- **Department Validation**: Ensures department exists before creating/updating programs
- **Safe Deletion**: Cannot delete published programs (must unpublish first)
- **Status Management**: Automatic status updates when publishing/unpublishing

### Advanced Features
- **Pagination**: All list endpoints support pagination
- **Search**: Full-text search across name and description
- **Filtering**: Filter by department, level, status, published state
- **Sorting**: Sort by any field in ascending/descending order
- **Statistics**: Comprehensive program statistics for admins
- **Department Programs**: Get all programs for a specific department
- **Level Programs**: Get all programs for a specific level

---

## 📝 Notes

- Replace `YOUR_BASE_URL` with your actual server URL
- Replace `YOUR_ACCESS_TOKEN` with a valid user token
- Replace `YOUR_ADMIN_ACCESS_TOKEN` with a valid admin token
- Replace `PROGRAM_ID` with actual program IDs from your database
- Replace `DEPARTMENT_ID` with actual department IDs from your database
- All endpoints require authentication
- Admin endpoints require admin privileges
- Published programs cannot be deleted (must unpublish first)
- Department must exist before creating/updating programs
- Program names are case-insensitive for duplicate checking within departments 