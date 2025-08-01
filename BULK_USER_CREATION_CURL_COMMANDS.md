# Bulk User Creation API - cURL Commands

This file contains cURL commands to test the bulk user creation API with different scenarios.

## Prerequisites

1. Make sure the server is running on `http://localhost:3000`
2. Get an admin token by logging in as an admin user
3. Replace `YOUR_ADMIN_TOKEN` with the actual admin token

## Basic Bulk User Creation

### Create Multiple Users Successfully

```bash
curl -X POST \
  http://localhost:3000/api/v1/users/bulk \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  -d '{
    "users": [
      {
        "firstName": "Krishna",
        "lastName": "Lama",
        "role": "student",
        "department": "Computer Science",
        "studentId": "CS2024001"
      },
      {
        "firstName": "John",
        "lastName": "Doe",
        "role": "faculty",
        "department": "Mathematics",
        "facultyId": "MATH001"
      },
      {
        "firstName": "Jane",
        "lastName": "Smith",
        "role": "student",
        "department": "Physics"
      }
    ]
  }'
```

### Create Students Only

```bash
curl -X POST \
  http://localhost:3000/api/v1/users/bulk \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  -d '{
    "users": [
      {
        "firstName": "Alice",
        "lastName": "Johnson",
        "role": "student",
        "department": "Computer Science"
      },
      {
        "firstName": "Bob",
        "lastName": "Wilson",
        "role": "student",
        "department": "Engineering"
      },
      {
        "firstName": "Charlie",
        "lastName": "Brown",
        "role": "student",
        "department": "Business"
      }
    ]
  }'
```

### Create Faculty Members

```bash
curl -X POST \
  http://localhost:3000/api/v1/users/bulk \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  -d '{
    "users": [
      {
        "firstName": "Dr. Sarah",
        "lastName": "Miller",
        "role": "faculty",
        "department": "Computer Science",
        "facultyId": "CS001"
      },
      {
        "firstName": "Prof. Michael",
        "lastName": "Davis",
        "role": "faculty",
        "department": "Mathematics",
        "facultyId": "MATH002"
      },
      {
        "firstName": "Dr. Emily",
        "lastName": "Taylor",
        "role": "faculty",
        "department": "Physics",
        "facultyId": "PHY001"
      }
    ]
  }'
```

## Error Testing

### Test Validation - Missing Required Fields

```bash
curl -X POST \
  http://localhost:3000/api/v1/users/bulk \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  -d '{
    "users": [
      {
        "firstName": "",
        "lastName": "Lama",
        "role": "student"
      },
      {
        "firstName": "John",
        "lastName": "",
        "role": "faculty"
      }
    ]
  }'
```

### Test Validation - Invalid Role

```bash
curl -X POST \
  http://localhost:3000/api/v1/users/bulk \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  -d '{
    "users": [
      {
        "firstName": "John",
        "lastName": "Doe",
        "role": "invalid_role"
      }
    ]
  }'
```

### Test Validation - Empty Array

```bash
curl -X POST \
  http://localhost:3000/api/v1/users/bulk \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  -d '{
    "users": []
  }'
```

### Test Authentication - No Token

```bash
curl -X POST \
  http://localhost:3000/api/v1/users/bulk \
  -H 'Content-Type: application/json' \
  -d '{
    "users": [
      {
        "firstName": "John",
        "lastName": "Doe",
        "role": "student"
      }
    ]
  }'
```

### Test Authorization - Non-Admin Token

```bash
# First, get a non-admin token by logging in as a regular user
# Then use that token in the request
curl -X POST \
  http://localhost:3000/api/v1/users/bulk \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer NON_ADMIN_TOKEN' \
  -d '{
    "users": [
      {
        "firstName": "John",
        "lastName": "Doe",
        "role": "student"
      }
    ]
  }'
```

## Large Batch Testing

### Create 50 Users

```bash
curl -X POST \
  http://localhost:3000/api/v1/users/bulk \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  -d '{
    "users": [
      {
        "firstName": "Student1",
        "lastName": "Test",
        "role": "student",
        "department": "Computer Science"
      },
      {
        "firstName": "Student2",
        "lastName": "Test",
        "role": "student",
        "department": "Engineering"
      }
      # ... Add more users up to 50
    ]
  }'
```

## Mixed Role Testing

### Create Users with Different Roles

```bash
curl -X POST \
  http://localhost:3000/api/v1/users/bulk \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  -d '{
    "users": [
      {
        "firstName": "Admin",
        "lastName": "User",
        "role": "admin"
      },
      {
        "firstName": "Faculty",
        "lastName": "Member",
        "role": "faculty",
        "department": "Computer Science"
      },
      {
        "firstName": "Student",
        "lastName": "User",
        "role": "student",
        "department": "Engineering"
      }
    ]
  }'
```

## Expected Responses

### Successful Response (201)
```json
{
  "success": true,
  "message": "Bulk user creation completed",
  "data": {
    "created": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "firstName": "Krishna",
        "lastName": "Lama",
        "email": "krishna.lama@smartcampus.com",
        "phone": "9812345678",
        "role": "student",
        "department": "Computer Science",
        "studentId": "CS2024001",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "failed": [],
    "summary": {
      "total": 1,
      "created": 1,
      "failed": 0
    }
  }
}
```

### Validation Error Response (400)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "users.0.firstName",
      "message": "First name is required for all users",
      "value": ""
    }
  ]
}
```

### Authentication Error Response (401)
```json
{
  "success": false,
  "message": "Access token is required"
}
```

### Authorization Error Response (403)
```json
{
  "success": false,
  "message": "Admin access required"
}
```

## Notes

- Replace `YOUR_ADMIN_TOKEN` with an actual admin token
- The API automatically generates:
  - Email: `firstname.lastname@smartcampus.com` (with 3-digit suffix if needed for uniqueness)
  - Phone: `98` + 8 random digits
  - Password: `FirstName@123`
- Users are created with `isActive: true` by default
- The API processes up to 100 users per request
- Failed users are reported with their original data and error messages
- Email uniqueness is guaranteed by adding 001, 002, etc. suffixes when duplicates are found 