# Admin Password Reset Functionality

This document describes the admin password reset functionality implemented in the Smart Campus Backend.

## Overview

The admin password reset feature allows administrators to reset passwords for any user in the system. This is a secure, role-based operation that only admin users can perform.

## Security Features

- **Role-based Access Control**: Only users with `admin` role can reset passwords
- **Authentication Required**: Admin must be authenticated with valid JWT token
- **Password Validation**: New passwords must meet security requirements
- **Audit Logging**: All password reset operations are logged
- **Input Validation**: Comprehensive validation of all input parameters

## API Endpoint

### Admin Reset User Password

**POST** `/api/v1/auth/reset-password`

Reset a user's password (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "newPassword": "NewSecurePass123",
  "confirmPassword": "NewSecurePass123"
}
```

**Parameters:**
- `userId` (required): MongoDB ObjectId of the user whose password to reset
- `newPassword` (required): New password for the user
- `confirmPassword` (required): Password confirmation (must match newPassword)

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "student",
    "department": "Computer Science",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Target user not found"
}
```

**Response (Error - 403):**
```json
{
  "success": false,
  "message": "Only admin users can reset passwords"
}
```

## Password Requirements

The new password must meet the following requirements:

- Minimum 6 characters long
- Contains at least one uppercase letter (A-Z)
- Contains at least one lowercase letter (a-z)
- Contains at least one number (0-9)

## Usage Examples

### Frontend Integration

```javascript
// Admin password reset
const resetPassword = async (userId, newPassword) => {
  try {
    const response = await fetch('/api/v1/auth/reset-password', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId,
        newPassword: newPassword,
        confirmPassword: newPassword
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Password reset successfully');
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Password reset failed:', error.message);
    throw error;
  }
};
```

### cURL Example

```bash
curl -X POST http://localhost:5000/api/v1/auth/reset-password \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "newPassword": "NewSecurePass123",
    "confirmPassword": "NewSecurePass123"
  }'
```

## Error Handling

### Common Error Responses

1. **Invalid User ID (400)**
   ```json
   {
     "success": false,
     "message": "Invalid user ID format"
   }
   ```

2. **User Not Found (400)**
   ```json
   {
     "success": false,
     "message": "Target user not found"
   }
   ```

3. **Unauthorized (401)**
   ```json
   {
     "success": false,
     "message": "Access token is required"
   }
   ```

4. **Forbidden (403)**
   ```json
   {
     "success": false,
     "message": "Only admin users can reset passwords"
   }
   ```

5. **Password Validation Error (400)**
   ```json
   {
     "success": false,
     "message": "New password must contain at least one uppercase letter, one lowercase letter, and one number"
   }
   ```

6. **Password Confirmation Error (400)**
   ```json
   {
     "success": false,
     "message": "Password confirmation does not match password"
   }
   ```

## Security Considerations

### Access Control
- Only authenticated admin users can access this endpoint
- Role verification is performed at both middleware and service levels
- Admin token must be valid and not expired

### Password Security
- Passwords are automatically hashed using bcrypt
- Password requirements enforce strong password policy
- No password history is maintained (consider implementing if needed)

### Audit Trail
- All password reset operations are logged with admin and target user information
- Logs include timestamp and operation details
- Failed attempts are also logged for security monitoring

### Best Practices
1. **Use HTTPS**: Always use HTTPS in production
2. **Token Management**: Implement proper token refresh and expiration
3. **Rate Limiting**: Consider implementing rate limiting for this endpoint
4. **Monitoring**: Monitor for unusual password reset patterns
5. **Notification**: Consider notifying users when their password is reset

## Testing

Run the admin password reset tests:

```bash
npm test src/tests/admin-password-reset.test.js
```

The test suite covers:
- Successful password reset by admin
- Access control (non-admin users cannot reset passwords)
- Input validation (user ID format, password requirements)
- Error handling (non-existent users, invalid input)

## Implementation Details

### Service Layer (`userService.adminResetPassword`)
- Verifies admin user exists and has admin role
- Finds target user by ID
- Updates password with automatic hashing
- Logs the operation
- Returns user data without sensitive information

### Controller Layer (`authController.resetPassword`)
- Extracts request parameters
- Calls service method
- Handles errors and responses
- Returns appropriate HTTP status codes

### Validation Layer (`validateResetPassword`)
- Validates user ID format (MongoDB ObjectId)
- Validates password requirements
- Validates password confirmation match
- Returns validation errors if any

### Middleware Layer
- `authenticate`: Verifies JWT token and sets user in request
- `authorize(['admin'])`: Verifies user has admin role
- `validateResetPassword`: Validates request body

## Database Impact

- Updates the `password` field in the User collection
- Automatically updates the `updatedAt` timestamp
- No additional database tables or fields required
- Password is hashed before storage

## Future Enhancements

Consider implementing these features for enhanced security:

1. **Password History**: Prevent reuse of recent passwords
2. **Email Notification**: Notify users when their password is reset
3. **Temporary Passwords**: Generate secure temporary passwords
4. **Password Expiration**: Force password change on next login
5. **Two-Factor Authentication**: Require additional verification for admin operations 