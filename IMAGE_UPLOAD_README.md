# Image Upload with Cloudinary Integration

This document describes the image upload functionality implemented in the Smart Campus Backend using Cloudinary.

## Overview

The image upload system allows users to upload images for events, with automatic optimization and storage in Cloudinary. The system includes:

- Image upload with validation
- Automatic optimization and format conversion
- Secure URL generation
- Image management (update, delete)
- Permission-based access control

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Getting Cloudinary Credentials

1. Sign up for a free Cloudinary account at [cloudinary.com](https://cloudinary.com)
2. Go to your Dashboard
3. Copy your Cloud Name, API Key, and API Secret
4. Add them to your environment variables

## API Endpoints

### Upload Event Image

**POST** `/api/events/{eventId}/images`

Upload an image for a specific event.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:**
```
image: <file> (required)
caption: <string> (optional)
isPrimary: <boolean> (optional)
```

**Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "image": {
      "url": "https://res.cloudinary.com/...",
      "public_id": "smart-campus/events/event-123-456789",
      "width": 1920,
      "height": 1080,
      "format": "jpg",
      "size": 245760,
      "caption": "Event banner",
      "isPrimary": true
    }
  }
}
```

### Get Event Images

**GET** `/api/events/{eventId}/images`

Retrieve all images for a specific event.

**Response:**
```json
{
  "success": true,
  "message": "Event images retrieved successfully",
  "data": {
    "images": [
      {
        "_id": "image-id",
        "url": "https://res.cloudinary.com/...",
        "public_id": "smart-campus/events/event-123-456789",
        "caption": "Event banner",
        "isPrimary": true,
        "width": 1920,
        "height": 1080,
        "format": "jpg",
        "size": 245760
      }
    ],
    "count": 1
  }
}
```

### Update Event Image

**PUT** `/api/events/{eventId}/images/{imageId}`

Update image caption or primary status.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "caption": "Updated caption",
  "isPrimary": true
}
```

### Delete Event Image

**DELETE** `/api/events/{eventId}/images/{imageId}`

Delete an image from an event.

**Headers:**
```
Authorization: Bearer <token>
```

## File Validation

The system validates uploaded files based on:

- **File Type**: Only images (jpg, jpeg, png, gif, webp) are allowed
- **File Size**: Maximum 5MB per file
- **MIME Type**: Validates both file extension and MIME type

## Image Optimization

Cloudinary automatically optimizes uploaded images:

- **Quality**: Auto-optimized for good quality
- **Format**: Automatically converted to the best format (WebP for supported browsers)
- **Compression**: Efficient compression applied
- **Responsive**: URLs support responsive transformations

## Security Features

### Permission Control

- Only event organizers, creators, admins, and faculty can upload images
- Users can only manage images for events they have permission to modify
- Authentication required for all upload operations

### File Validation

- File type validation prevents malicious uploads
- File size limits prevent abuse
- Secure file naming prevents path traversal attacks

### Cloudinary Security

- Images are stored with secure URLs
- Public IDs are generated with unique timestamps
- Automatic cleanup of temporary files

## Usage Examples

### Frontend Integration

```javascript
// Upload image
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('caption', 'Event banner');
formData.append('isPrimary', 'true');

const response = await fetch(`/api/events/${eventId}/images`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result.data.image.url);
```

### Node.js/Express Integration

```javascript
const multer = require('multer');
const { handleImageUpload } = require('./middleware/upload.middleware');

// Route with image upload
app.post('/api/events/:eventId/images', 
  authenticate, 
  handleImageUpload('image', { folder: 'smart-campus/events' }), 
  eventController.uploadEventImage
);
```

## Error Handling

Common error responses:

```json
{
  "success": false,
  "message": "File size exceeds maximum limit of 5MB"
}
```

```json
{
  "success": false,
  "message": "File format not allowed. Allowed formats: jpg, jpeg, png, gif, webp"
}
```

```json
{
  "success": false,
  "message": "You do not have permission to upload images for this event"
}
```

## Testing

Run the Cloudinary configuration tests:

```bash
npm test src/tests/cloudinary.test.js
```

## Troubleshooting

### Common Issues

1. **Environment Variables Not Set**
   - Ensure all Cloudinary environment variables are properly set
   - Check that the `.env` file is loaded correctly

2. **Upload Fails**
   - Verify Cloudinary credentials are correct
   - Check file size and format restrictions
   - Ensure user has proper permissions

3. **Images Not Displaying**
   - Verify the image URL is accessible
   - Check if the public_id exists in Cloudinary
   - Ensure proper CORS configuration

### Debug Mode

Enable debug logging by setting:

```env
LOG_LEVEL=debug
```

This will provide detailed information about upload processes and errors.

## Best Practices

1. **Image Optimization**: Use appropriate image sizes and formats
2. **Naming**: Use descriptive captions for better organization
3. **Primary Images**: Set one image as primary for better display
4. **Cleanup**: Regularly clean up unused images to save storage
5. **Backup**: Consider backing up important images locally

## Cost Considerations

- Cloudinary offers a generous free tier
- Monitor usage to avoid unexpected charges
- Consider implementing image cleanup for deleted events
- Use appropriate transformation parameters to optimize bandwidth 