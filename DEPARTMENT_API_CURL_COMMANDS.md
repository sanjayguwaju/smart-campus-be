# Department API - Curl Commands

This document contains curl commands for testing all department-related APIs.

## Prerequisites

1. **Base URL**: Replace `YOUR_BASE_URL` with your actual server URL (e.g., `http://localhost:3000`)
2. **Authentication**: Replace `YOUR_ACCESS_TOKEN` with a valid JWT access token
3. **Admin Token**: Some endpoints require admin privileges - use an admin user's token

## Authentication

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

## 1. Get All Departments (with pagination and filters)

### Basic request
```bash
curl -X GET "YOUR_BASE_URL/api/v1/departments" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### With pagination
```bash
curl -X GET "YOUR_BASE_URL/api/v1/departments?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### With search filter
```bash
curl -X GET "YOUR_BASE_URL/api/v1/departments?search=computer" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### With active status filter
```bash
curl -X GET "YOUR_BASE_URL/api/v1/departments?isActive=true" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### With sorting
```bash
curl -X GET "YOUR_BASE_URL/api/v1/departments?sortBy=name&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Combined filters
```bash
curl -X GET "YOUR_BASE_URL/api/v1/departments?page=1&limit=10&search=engineering&isActive=true&sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 2. Create Department (Admin Only)

### Basic department creation
```bash
curl -X POST "YOUR_BASE_URL/api/v1/departments" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Computer Science",
    "code": "CS",
    "description": "Department of Computer Science and Engineering",
    "contactEmail": "cs@university.edu",
    "contactPhone": "+1-555-0123",
    "location": "Engineering Building, Room 101",
    "isActive": true
  }'
```

### Minimal department creation (only name required)
```bash
curl -X POST "YOUR_BASE_URL/api/v1/departments" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mathematics"
  }'
```

### Department with all optional fields
```bash
curl -X POST "YOUR_BASE_URL/api/v1/departments" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electrical Engineering",
    "code": "EE",
    "description": "Department specializing in electrical engineering, electronics, and power systems",
    "contactEmail": "ee@university.edu",
    "contactPhone": "+1-555-0456",
    "location": "Engineering Building, Room 205",
    "isActive": true
  }'
```

## 3. Get Department by ID

```bash
curl -X GET "YOUR_BASE_URL/api/v1/departments/DEPARTMENT_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Example with actual ID
```bash
curl -X GET "YOUR_BASE_URL/api/v1/departments/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 4. Update Department (Admin Only)

### Update all fields
```bash
curl -X PUT "YOUR_BASE_URL/api/v1/departments/DEPARTMENT_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Computer Science & Engineering",
    "code": "CSE",
    "description": "Updated description for Computer Science and Engineering Department",
    "contactEmail": "cse@university.edu",
    "contactPhone": "+1-555-0789",
    "location": "Engineering Building, Room 102",
    "isActive": true
  }'
```

### Partial update (only specific fields)
```bash
curl -X PUT "YOUR_BASE_URL/api/v1/departments/DEPARTMENT_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contactEmail": "newemail@university.edu"
  }'
```

### Deactivate department
```bash
curl -X PUT "YOUR_BASE_URL/api/v1/departments/DEPARTMENT_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'
```

## 5. Delete Department (Admin Only)

```bash
curl -X DELETE "YOUR_BASE_URL/api/v1/departments/DEPARTMENT_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN"
```

### Example with actual ID
```bash
curl -X DELETE "YOUR_BASE_URL/api/v1/departments/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN"
```

## 6. Get Active Departments Only

```bash
curl -X GET "YOUR_BASE_URL/api/v1/departments/active" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 7. Search Departments

### Basic search
```bash
curl -X GET "YOUR_BASE_URL/api/v1/departments/search?q=computer" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Search with limit
```bash
curl -X GET "YOUR_BASE_URL/api/v1/departments/search?q=engineering&limit=5" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Search by code
```bash
curl -X GET "YOUR_BASE_URL/api/v1/departments/search?q=CS" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 8. Get Department Statistics (Admin Only)

```bash
curl -X GET "YOUR_BASE_URL/api/v1/departments/stats" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN"
```

## 9. Check Department Deletion Eligibility (Admin Only)

```bash
curl -X GET "YOUR_BASE_URL/api/v1/departments/DEPARTMENT_ID/check-deletion" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN"
```

### Example with actual ID
```bash
curl -X GET "YOUR_BASE_URL/api/v1/departments/507f1f77bcf86cd799439011/check-deletion" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN"
```

## Complete Testing Workflow

Here's a complete workflow to test all department APIs:

### 1. Login and get token
```bash
# Login as admin
curl -X POST "YOUR_BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

### 2. Create a test department
```bash
curl -X POST "YOUR_BASE_URL/api/v1/departments" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Department",
    "code": "TEST",
    "description": "A test department for API testing",
    "contactEmail": "test@university.edu",
    "contactPhone": "+1-555-0000",
    "location": "Test Building",
    "isActive": true
  }'
```

### 3. Get all departments
```bash
curl -X GET "YOUR_BASE_URL/api/v1/departments" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Get the created department by ID (use ID from step 2)
```bash
curl -X GET "YOUR_BASE_URL/api/v1/departments/DEPARTMENT_ID_FROM_STEP_2" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Update the department
```bash
curl -X PUT "YOUR_BASE_URL/api/v1/departments/DEPARTMENT_ID_FROM_STEP_2" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated test department description"
  }'
```

### 6. Check deletion eligibility
```bash
curl -X GET "YOUR_BASE_URL/api/v1/departments/DEPARTMENT_ID_FROM_STEP_2/check-deletion" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN"
```

### 7. Search for the department
```bash
curl -X GET "YOUR_BASE_URL/api/v1/departments/search?q=test" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 8. Get active departments
```bash
curl -X GET "YOUR_BASE_URL/api/v1/departments/active" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 9. Get department statistics
```bash
curl -X GET "YOUR_BASE_URL/api/v1/departments/stats" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN"
```

### 10. Delete the test department (if eligible)
```bash
curl -X DELETE "YOUR_BASE_URL/api/v1/departments/DEPARTMENT_ID_FROM_STEP_2" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN"
```

## Error Testing

### Test with invalid token
```bash
curl -X GET "YOUR_BASE_URL/api/v1/departments" \
  -H "Authorization: Bearer invalid_token"
```

### Test with missing required fields
```bash
curl -X POST "YOUR_BASE_URL/api/v1/departments" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TEST"
  }'
```

### Test with invalid department ID
```bash
curl -X GET "YOUR_BASE_URL/api/v1/departments/invalid_id" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Test search without query parameter
```bash
curl -X GET "YOUR_BASE_URL/api/v1/departments/search" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Notes

- Replace `YOUR_BASE_URL` with your actual server URL
- Replace `YOUR_ACCESS_TOKEN` with a valid user token
- Replace `YOUR_ADMIN_ACCESS_TOKEN` with a valid admin token
- Replace `DEPARTMENT_ID` with actual department IDs from your database
- All admin-only endpoints require admin privileges
- The search endpoint requires a query parameter (`q`)
- Department codes are automatically converted to uppercase
- Department names are case-insensitive for duplicate checking 