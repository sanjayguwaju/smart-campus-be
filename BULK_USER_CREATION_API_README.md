# Bulk User Creation API

This API allows administrators to create multiple users in bulk with automatically generated email addresses and phone numbers.

## Endpoint

```
POST /api/v1/users/bulk
```

## Authentication

- **Required**: Bearer token with admin privileges
- **Header**: `Authorization: Bearer <token>`

## Request Body

The API accepts an array of user objects. For each user, you only need to provide:
- `firstName` (required)
- `lastName` (required) 
- `role` (required: admin, faculty, or student)
- `department` (optional)
- `studentId` (optional, for students)
- `facultyId` (optional, for faculty)

### Example Request

```json
{
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
      "role": "student"
    }
  ]
}
```

## Auto-Generated Fields

The API automatically generates the following fields for each user:

1. **Email**: `firstname.lastname@smartcampus.com` (with 3-digit suffix if needed)
   - Example: `krishna.lama@smartcampus.com`
   - If duplicate: `krishna.lama001@smartcampus.com`
   - If multiple duplicates: `krishna.lama002@smartcampus.com`

2. **Phone**: `98` + 8 random digits
   - Example: `9812345678`

3. **Password**: `FirstName@123`
   - Example: `Krishna@123`

4. **isActive**: `true`

## Response Format

### Success Response (201)

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
    "failed": [
      {
        "userData": {
          "firstName": "John",
          "lastName": "Doe",
          "role": "faculty"
        },
        "error": "User with this email already exists",
        "generatedEmail": "john.doe@smartcampus.com"
      }
    ],
    "summary": {
      "total": 3,
      "created": 2,
      "failed": 1
    }
  }
}
```

### Error Response (400)

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

## Validation Rules

1. **Array Size**: 1-100 users per request
2. **firstName**: 2-50 characters, letters and spaces only
3. **lastName**: 2-50 characters, letters and spaces only
4. **role**: Must be one of: admin, faculty, student
5. **department**: Optional, max 100 characters
6. **studentId**: Optional, 3-20 characters, uppercase letters and numbers only
7. **facultyId**: Optional, 3-20 characters, uppercase letters and numbers only

## cURL Example

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
        "department": "Computer Science"
      },
      {
        "firstName": "John",
        "lastName": "Doe",
        "role": "faculty",
        "department": "Mathematics"
      }
    ]
  }'
```

## Features

- **Bulk Processing**: Create up to 100 users in a single request
- **Auto-Generation**: Email and phone numbers are automatically generated
- **Duplicate Detection**: Checks for existing users before creation
- **Partial Success**: Continues processing even if some users fail
- **Detailed Reporting**: Returns both successful and failed creations
- **Summary Statistics**: Provides overview of the operation

## Notes

- Users are created with `isActive: true` by default
- Passwords are generated as `FirstName@123` (users should change them on first login)
- Email format is `firstname.lastname@smartcampus.com` with 3-digit suffix if needed for uniqueness
- Phone numbers start with `98` followed by 8 random digits
- The API processes users sequentially to avoid conflicts
- Failed users are reported with their original data and error messages
- Email uniqueness is guaranteed by adding 001, 002, etc. suffixes when duplicates are found 