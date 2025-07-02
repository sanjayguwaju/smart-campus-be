# User Deactivation Functionality

This document describes the user deactivation functionality implemented in the Smart Campus Backend.

## Overview

The user deactivation feature allows administrators to deactivate and activate user accounts. This provides a way to temporarily disable user access without permanently deleting their accounts and data.

## Security Features

- **Role-based Access Control**: Only users with `admin` role can deactivate/activate users
- **Authentication Required**: Admin must be authenticated with valid JWT token
- **Self-Protection**: Admins cannot deactivate their own accounts
- **Admin Protection**: Admins cannot deactivate other admin accounts
- **Audit Logging**: All deactivation/activation operations are logged
- **Input Validation**: Comprehensive validation of all input parameters

## API Endpoints

### Deactivate User

**PATCH** `/api/v1/users/{userId}/deactivate`

Deactivate a user account (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Parameters:**
- `userId` (path parameter): MongoDB ObjectId of the user to deactivate

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "User deactivated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "student",
    "department": "Computer Science",
    "isActive": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Activate User

**PATCH** `/api/v1/users/{userId}/activate`

Activate a previously deactivated user account (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Parameters:**
- `userId` (path parameter): MongoDB ObjectId of the user to activate

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "User activated successfully",
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

### Toggle User Status

**PATCH** `/api/v1/users/{userId}/toggle-status`

Toggle user status between active and inactive (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "isActive": false
}
```

**Parameters:**
- `userId` (path parameter): MongoDB ObjectId of the user
- `isActive` (body parameter): Boolean value to set user status

## Usage Examples

### Frontend Integration

```javascript
// Deactivate a user
const deactivateUser = async (userId) => {
  try {
    const response = await fetch(`/api/v1/users/${userId}/deactivate`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('User deactivated successfully');
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('User deactivation failed:', error.message);
    throw error;
  }
};

// Activate a user
const activateUser = async (userId) => {
  try {
    const response = await fetch(`/api/v1/users/${userId}/activate`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('User activated successfully');
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('User activation failed:', error.message);
    throw error;
  }
};

// Toggle user status
const toggleUserStatus = async (userId, isActive) => {
  try {
    const response = await fetch(`/api/v1/users/${userId}/toggle-status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isActive })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('User status toggle failed:', error.message);
    throw error;
  }
};
```

### cURL Examples

```bash
# Deactivate a user
curl -X PATCH http://localhost:5000/api/v1/users/507f1f77bcf86cd799439011/deactivate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Activate a user
curl -X PATCH http://localhost:5000/api/v1/users/507f1f77bcf86cd799439011/activate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Toggle user status
curl -X PATCH http://localhost:5000/api/v1/users/507f1f77bcf86cd799439011/toggle-status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
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
     "message": "Only admin users can deactivate users"
   }
   ```

5. **Self-Deactivation Prevention (400)**
   ```json
   {
     "success": false,
     "message": "Admin cannot deactivate their own account"
   }
   ```

6. **Admin Protection (400)**
   ```json
   {
     "success": false,
     "message": "Cannot deactivate admin accounts"
   }
   ```

## Security Considerations

### Access Control
- Only authenticated admin users can access these endpoints
- Role verification is performed at both middleware and service levels
- Admin token must be valid and not expired

### Protection Mechanisms
- **Self-Protection**: Admins cannot deactivate their own accounts
- **Admin Protection**: Admins cannot deactivate other admin accounts
- **Data Preservation**: Deactivated users retain all their data and relationships

### Audit Trail
- All deactivation/activation operations are logged with admin and target user information
- Logs include timestamp and operation details
- Failed attempts are also logged for security monitoring

### Impact on System
- Deactivated users cannot log in to the system
- Deactivated users are excluded from most queries by default
- User data and relationships are preserved
- Can be reactivated at any time

## Testing

Run the user deactivation tests:

```bash
npm test src/tests/user-deactivation.test.js
```

The test suite covers:
- Successful user deactivation by admin
- Successful user activation by admin
- Access control (non-admin users cannot deactivate/activate users)
- Self-protection (admin cannot deactivate themselves)
- Admin protection (admin cannot deactivate other admins)
- Input validation (user ID format)
- Error handling (non-existent users, invalid input)

## Implementation Details

### Service Layer
- `userService.deactivateUser()`: Deactivates a user with security checks
- `userService.activateUser()`: Activates a previously deactivated user
- Both methods verify admin permissions and perform security validations

### Controller Layer
- `userController.deactivateUser()`: Handles deactivation requests
- `userController.activateUser()`: Handles activation requests
- `userController.toggleUserStatus()`: Handles status toggle requests

### Middleware Layer
- `authenticate`: Verifies JWT token and sets user in request
- `requireAdmin`: Verifies user has admin role
- `validateUserId`: Validates user ID format

## Database Impact

- Updates the `isActive` field in the User collection
- Automatically updates the `updatedAt` timestamp
- No data is deleted or permanently removed
- All user relationships and data are preserved

## Best Practices

1. **Use Deactivation Instead of Deletion**: Preserve user data and relationships
2. **Monitor Deactivation Patterns**: Track unusual deactivation activity
3. **Communicate Changes**: Notify users when their accounts are deactivated
4. **Regular Review**: Periodically review deactivated accounts
5. **Backup Before Bulk Operations**: Always backup before bulk deactivations

## Future Enhancements

Consider implementing these features for enhanced functionality:

1. **Bulk Deactivation**: Deactivate multiple users at once
2. **Deactivation Reasons**: Track why users were deactivated
3. **Automatic Reactivation**: Schedule automatic reactivation after a period
4. **Deactivation Notifications**: Email users when their accounts are deactivated
5. **Deactivation History**: Track deactivation/activation history
6. **Conditional Deactivation**: Deactivate users based on specific conditions 