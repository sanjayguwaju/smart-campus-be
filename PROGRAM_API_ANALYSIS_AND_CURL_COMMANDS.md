# Program API - Current State Analysis & Curl Commands

## 📊 Current State Analysis

### ✅ What's Currently Working
- Basic CRUD operations (Create, Read, Update, Delete)
- Program model with proper schema
- Basic service layer structure
- Basic controller functions
- Basic routing

### ❌ What's Missing (Compared to Department API)

#### 1. **Authentication & Authorization**
- ❌ No authentication middleware
- ❌ No role-based access control
- ❌ No admin-only endpoints protection

#### 2. **Validation**
- ❌ No input validation middleware
- ❌ No request body validation
- ❌ No parameter validation

#### 3. **Swagger Documentation**
- ❌ No API documentation
- ❌ No OpenAPI/Swagger specs
- ❌ No endpoint descriptions

#### 4. **Service Layer Improvements**
- ❌ No proper error handling
- ❌ No logging
- ❌ No business logic validation
- ❌ No pagination support
- ❌ No search functionality
- ❌ No filtering options

#### 5. **Controller Improvements**
- ❌ No consistent response format
- ❌ No proper error handling
- ❌ No logging
- ❌ No input sanitization

#### 6. **Additional Features Missing**
- ❌ No pagination
- ❌ No search functionality
- ❌ No filtering by department, level, status
- ❌ No program statistics
- ❌ No bulk operations
- ❌ No program enrollment tracking

## 🔧 Recommended Improvements

### Phase 1: Core Infrastructure
1. **Add Authentication & Authorization**
   - Implement `authenticate` middleware
   - Add `requireAdmin` for admin-only operations
   - Add role-based access control

2. **Add Validation**
   - Create `program.validation.js`
   - Add request body validation
   - Add parameter validation
   - Add query parameter validation

3. **Improve Service Layer**
   - Add proper error handling
   - Add logging
   - Add business logic validation
   - Add pagination support
   - Add search functionality

### Phase 2: Enhanced Features
1. **Add Swagger Documentation**
   - Document all endpoints
   - Add request/response schemas
   - Add authentication requirements

2. **Add Advanced Features**
   - Program statistics
   - Bulk operations
   - Advanced filtering
   - Program enrollment tracking

## 📝 Current API Endpoints

### Base URL: `YOUR_BASE_URL/api/v1/programs`

| Method | Endpoint | Description | Auth Required | Admin Required |
|--------|----------|-------------|---------------|----------------|
| GET | `/` | Get all programs | ❌ | ❌ |
| GET | `/:id` | Get program by ID | ❌ | ❌ |
| POST | `/` | Create new program | ❌ | ❌ |
| PUT | `/:id` | Update program | ❌ | ❌ |
| PUT | `/:id/publish` | Publish/unpublish program | ❌ | ❌ |
| DELETE | `/:id` | Delete program | ❌ | ❌ |

## 🚀 Current Curl Commands

### Prerequisites
- **Base URL**: Replace `YOUR_BASE_URL` with your actual server URL (e.g., `http://localhost:3000`)
- **Note**: Currently no authentication is required (this is a security issue that needs to be fixed)

---

### 1. Get All Programs

```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Computer Science",
      "department": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Computer Science Department"
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
  ]
}
```

---

### 2. Get Program by ID

```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs/PROGRAM_ID"
```

**Example:**
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs/507f1f77bcf86cd799439011"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Computer Science",
    "department": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Computer Science Department"
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

### 3. Create New Program

```bash
curl -X POST "YOUR_BASE_URL/api/v1/programs" \
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

**Minimal Program Creation:**
```bash
curl -X POST "YOUR_BASE_URL/api/v1/programs" \
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
  "data": {
    "_id": "507f1f77bcf86cd799439013",
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
    "status": "draft",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 4. Update Program

```bash
curl -X PUT "YOUR_BASE_URL/api/v1/programs/PROGRAM_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Computer Science & Engineering",
    "description": "Updated description for the program",
    "semesters": 9,
    "prerequisites": ["Mathematics", "Physics", "Chemistry"]
  }'
```

**Example:**
```bash
curl -X PUT "YOUR_BASE_URL/api/v1/programs/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Computer Science & Engineering",
    "description": "Updated description for the program"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Computer Science & Engineering",
    "department": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Computer Science Department"
    },
    "level": "Undergraduate",
    "duration": "4 years",
    "semesters": 8,
    "description": "Updated description for the program",
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

### 5. Publish/Unpublish Program

```bash
curl -X PUT "YOUR_BASE_URL/api/v1/programs/PROGRAM_ID/publish" \
  -H "Content-Type: application/json" \
  -d '{
    "isPublished": true
  }'
```

**Publish Program:**
```bash
curl -X PUT "YOUR_BASE_URL/api/v1/programs/507f1f77bcf86cd799439011/publish" \
  -H "Content-Type: application/json" \
  -d '{
    "isPublished": true
  }'
```

**Unpublish Program:**
```bash
curl -X PUT "YOUR_BASE_URL/api/v1/programs/507f1f77bcf86cd799439011/publish" \
  -H "Content-Type: application/json" \
  -d '{
    "isPublished": false
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Computer Science",
    "department": "507f1f77bcf86cd799439012",
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

### 6. Delete Program

```bash
curl -X DELETE "YOUR_BASE_URL/api/v1/programs/PROGRAM_ID"
```

**Example:**
```bash
curl -X DELETE "YOUR_BASE_URL/api/v1/programs/507f1f77bcf86cd799439011"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Program deleted"
}
```

---

## 🔄 Complete Testing Workflow

### 1. Create a test program
```bash
curl -X POST "YOUR_BASE_URL/api/v1/programs" \
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

### 2. Get all programs
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs"
```

### 3. Get the created program by ID (use ID from step 1)
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs/PROGRAM_ID_FROM_STEP_1"
```

### 4. Update the program
```bash
curl -X PUT "YOUR_BASE_URL/api/v1/programs/PROGRAM_ID_FROM_STEP_1" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated test program description"
  }'
```

### 5. Publish the program
```bash
curl -X PUT "YOUR_BASE_URL/api/v1/programs/PROGRAM_ID_FROM_STEP_1/publish" \
  -H "Content-Type: application/json" \
  -d '{
    "isPublished": true
  }'
```

### 6. Delete the test program
```bash
curl -X DELETE "YOUR_BASE_URL/api/v1/programs/PROGRAM_ID_FROM_STEP_1"
```

---

## ❌ Error Testing

### Test with invalid program ID
```bash
curl -X GET "YOUR_BASE_URL/api/v1/programs/invalid_id"
```

### Test with missing required fields
```bash
curl -X POST "YOUR_BASE_URL/api/v1/programs" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Program"
  }'
```

### Test with invalid level enum
```bash
curl -X POST "YOUR_BASE_URL/api/v1/programs" \
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

### Test publish with invalid boolean
```bash
curl -X PUT "YOUR_BASE_URL/api/v1/programs/507f1f77bcf86cd799439011/publish" \
  -H "Content-Type: application/json" \
  -d '{
    "isPublished": "not_a_boolean"
  }'
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

## 🚨 Security Issues

1. **No Authentication**: All endpoints are publicly accessible
2. **No Authorization**: No role-based access control
3. **No Input Validation**: No validation of request data
4. **No Rate Limiting**: No protection against abuse
5. **No CORS Configuration**: May have CORS issues

---

## 🎯 Priority Improvements

### High Priority
1. Add authentication middleware
2. Add input validation
3. Add proper error handling
4. Add logging

### Medium Priority
1. Add pagination support
2. Add search functionality
3. Add filtering options
4. Add Swagger documentation

### Low Priority
1. Add program statistics
2. Add bulk operations
3. Add advanced features

---

## 📝 Notes

- Replace `YOUR_BASE_URL` with your actual server URL
- Replace `PROGRAM_ID` with actual program IDs from your database
- Replace `DEPARTMENT_ID` with actual department IDs from your database
- Currently no authentication is required (security issue)
- All endpoints return JSON responses
- The API follows RESTful conventions
- Department information is populated in responses 