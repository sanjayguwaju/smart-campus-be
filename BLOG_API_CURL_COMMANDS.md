# Blog API - Complete cURL Commands Guide

This document provides comprehensive cURL commands for testing all Blog API endpoints with proper authentication, validation, and error handling.

## Table of Contents
1. [Authentication Setup](#authentication-setup)
2. [Basic CRUD Operations](#basic-crud-operations)
3. [Advanced Queries and Filters](#advanced-queries-and-filters)
4. [Search and Discovery](#search-and-discovery)
5. [Statistics and Analytics](#statistics-and-analytics)
6. [Publishing and Status Management](#publishing-and-status-management)
7. [Error Testing](#error-testing)
8. [Complete Testing Workflow](#complete-testing-workflow)

---

## Authentication Setup

### 1. Login to get JWT token
```bash
# Login as admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'

# Login as moderator
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "moderator@example.com",
    "password": "moderator123"
  }'

# Login as author
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "author@example.com",
    "password": "author123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

**Set token variable:**
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Basic CRUD Operations

### 2. Create a Blog (Admin/Moderator/Author)
```bash
# Create a draft blog
curl -X POST http://localhost:3000/api/blogs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "title=Introduction to Smart Campus Technology" \
  -F "author=Dr. John Smith" \
  -F "content=Smart campus technology is revolutionizing how educational institutions operate. This comprehensive guide explores the latest innovations in IoT, AI, and automation that are transforming campus life. From smart lighting systems to automated attendance tracking, these technologies are creating more efficient, sustainable, and engaging learning environments. We'll examine real-world implementations and discuss the benefits and challenges of adopting smart campus solutions." \
  -F "summary=A comprehensive guide to smart campus technology and its impact on modern education" \
  -F "tags[]=technology" \
  -F "tags[]=education" \
  -F "tags[]=IoT" \
  -F "isPublished=false" \
  -F "status=draft" \
  -F "credits=Special thanks to the Smart Campus Research Team"

# Create a published blog
curl -X POST http://localhost:3000/api/blogs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "title=The Future of Digital Learning Platforms" \
  -F "author=Prof. Sarah Johnson" \
  -F "content=Digital learning platforms have evolved significantly over the past decade. This article explores the latest trends in e-learning, including adaptive learning algorithms, virtual reality classrooms, and AI-powered tutoring systems. We'll analyze how these technologies are personalizing education and improving student outcomes. The future of education lies in creating immersive, interactive learning experiences that adapt to individual student needs and learning styles." \
  -F "summary=Exploring the latest trends and innovations in digital learning platforms" \
  -F "tags[]=e-learning" \
  -F "tags[]=AI" \
  -F "tags[]=education" \
  -F "isPublished=true" \
  -F "status=published"

# Create blog with cover image
curl -X POST http://localhost:3000/api/blogs \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Sustainable Campus Design Principles" \
  -F "author=Architect Michael Chen" \
  -F "content=Sustainable campus design is becoming increasingly important as institutions strive to reduce their environmental impact. This article discusses key principles of sustainable architecture, including energy-efficient buildings, renewable energy integration, green spaces, and water conservation systems. We'll showcase successful sustainable campus projects and provide practical guidelines for implementing eco-friendly design strategies." \
  -F "summary=Key principles and best practices for sustainable campus design" \
  -F "tags[]=sustainability" \
  -F "tags[]=architecture" \
  -F "tags[]=green-building" \
  -F "coverImage=@/path/to/cover-image.jpg" \
  -F "isPublished=true"
```

### 3. Get All Blogs (with pagination)
```bash
# Get first page of blogs
curl -X GET "http://localhost:3000/api/blogs?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Get blogs with sorting
curl -X GET "http://localhost:3000/api/blogs?page=1&limit=5&sortBy=title&sortOrder=asc" \
  -H "Authorization: Bearer $TOKEN"

# Get blogs with filters
curl -X GET "http://localhost:3000/api/blogs?page=1&limit=10&status=published&isPublished=true" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Get Blog by ID
```bash
# Replace BLOG_ID with actual blog ID from create response
curl -X GET http://localhost:3000/api/blogs/BLOG_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Get Blog by Slug
```bash
curl -X GET http://localhost:3000/api/blogs/slug/introduction-to-smart-campus-technology \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Update Blog
```bash
# Update blog content
curl -X PUT http://localhost:3000/api/blogs/BLOG_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "title=Updated: Introduction to Smart Campus Technology" \
  -F "content=This updated article provides even more comprehensive coverage of smart campus technology... [updated content]" \
  -F "tags[]=technology" \
  -F "tags[]=education" \
  -F "tags[]=IoT" \
  -F "tags[]=innovation"

# Update blog status
curl -X PUT http://localhost:3000/api/blogs/BLOG_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "status=archived"
```

### 7. Delete Blog
```bash
# Delete a blog (only draft blogs can be deleted)
curl -X DELETE http://localhost:3000/api/blogs/BLOG_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## Advanced Queries and Filters

### 8. Filter Blogs by Author
```bash
curl -X GET "http://localhost:3000/api/blogs?author=Dr.%20John%20Smith" \
  -H "Authorization: Bearer $TOKEN"
```

### 9. Filter Blogs by Tags
```bash
curl -X GET "http://localhost:3000/api/blogs?tags[]=technology&tags[]=education" \
  -H "Authorization: Bearer $TOKEN"
```

### 10. Search Blogs
```bash
# Search by term
curl -X GET "http://localhost:3000/api/blogs/search?q=smart%20campus&limit=5" \
  -H "Authorization: Bearer $TOKEN"

# Search with different terms
curl -X GET "http://localhost:3000/api/blogs/search?q=digital%20learning&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 11. Get Blogs by Specific Author
```bash
curl -X GET http://localhost:3000/api/blogs/author/Dr.%20John%20Smith \
  -H "Authorization: Bearer $TOKEN"
```

---

## Search and Discovery

### 12. Get Published Blogs Only
```bash
curl -X GET http://localhost:3000/api/blogs/published \
  -H "Authorization: Bearer $TOKEN"
```

### 13. Get Recent Blogs
```bash
# Get 5 recent blogs
curl -X GET "http://localhost:3000/api/blogs/recent?limit=5" \
  -H "Authorization: Bearer $TOKEN"

# Get 10 recent blogs
curl -X GET "http://localhost:3000/api/blogs/recent?limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 14. Get Popular Tags
```bash
# Get top 10 popular tags
curl -X GET "http://localhost:3000/api/blogs/popular-tags?limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Get top 20 popular tags
curl -X GET "http://localhost:3000/api/blogs/popular-tags?limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### 15. Get Blogs by Tags
```bash
curl -X GET "http://localhost:3000/api/blogs/tags?tags[]=technology&tags[]=AI" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Statistics and Analytics

### 16. Get Blog Statistics (Admin/Moderator only)
```bash
curl -X GET http://localhost:3000/api/blogs/stats \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Blog statistics retrieved successfully",
  "data": {
    "total": 15,
    "published": 10,
    "draft": 3,
    "archived": 2,
    "totalAuthors": 5,
    "publishedPercentage": 67
  }
}
```

---

## Publishing and Status Management

### 17. Publish a Blog
```bash
curl -X PUT http://localhost:3000/api/blogs/BLOG_ID/publish \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isPublished": true
  }'
```

### 18. Unpublish a Blog
```bash
curl -X PUT http://localhost:3000/api/blogs/BLOG_ID/publish \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isPublished": false
  }'
```

---

## Error Testing

### 19. Test Authentication Errors
```bash
# Try to access without token
curl -X GET http://localhost:3000/api/blogs

# Try with invalid token
curl -X GET http://localhost:3000/api/blogs \
  -H "Authorization: Bearer invalid_token"
```

### 20. Test Authorization Errors
```bash
# Try to access admin-only endpoint with author role
curl -X GET http://localhost:3000/api/blogs/stats \
  -H "Authorization: Bearer AUTHOR_TOKEN"

# Try to delete blog with insufficient permissions
curl -X DELETE http://localhost:3000/api/blogs/BLOG_ID \
  -H "Authorization: Bearer AUTHOR_TOKEN"
```

### 21. Test Validation Errors
```bash
# Create blog with missing required fields
curl -X POST http://localhost:3000/api/blogs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "title=Short" \
  -F "author=A"

# Create blog with invalid data
curl -X POST http://localhost:3000/api/blogs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "title=Valid Title" \
  -F "author=Valid Author" \
  -F "content=Too short" \
  -F "summary=Too short" \
  -F "status=invalid_status"

# Update with invalid ID
curl -X PUT http://localhost:3000/api/blogs/invalid_id \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "title=Updated Title"
```

### 22. Test Business Logic Errors
```bash
# Try to delete a published blog
curl -X DELETE http://localhost:3000/api/blogs/PUBLISHED_BLOG_ID \
  -H "Authorization: Bearer $TOKEN"

# Try to create blog with duplicate slug
curl -X POST http://localhost:3000/api/blogs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "title=Introduction to Smart Campus Technology" \
  -F "slug=introduction-to-smart-campus-technology" \
  -F "author=Different Author" \
  -F "content=Different content..." \
  -F "summary=Different summary"
```

---

## Complete Testing Workflow

### 23. Full Blog Lifecycle Test
```bash
# 1. Create a blog
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/blogs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "title=Test Blog for Lifecycle" \
  -F "author=Test Author" \
  -F "content=This is a test blog for demonstrating the complete lifecycle..." \
  -F "summary=Test blog summary" \
  -F "tags[]=test" \
  -F "tags[]=lifecycle" \
  -F "isPublished=false")

echo "Create Response: $CREATE_RESPONSE"

# Extract blog ID from response
BLOG_ID=$(echo $CREATE_RESPONSE | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)
echo "Blog ID: $BLOG_ID"

# 2. Get the created blog
curl -X GET http://localhost:3000/api/blogs/$BLOG_ID \
  -H "Authorization: Bearer $TOKEN"

# 3. Update the blog
curl -X PUT http://localhost:3000/api/blogs/$BLOG_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "title=Updated Test Blog" \
  -F "content=This is the updated content..."

# 4. Publish the blog
curl -X PUT http://localhost:3000/api/blogs/$BLOG_ID/publish \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isPublished": true}'

# 5. Verify it appears in published blogs
curl -X GET http://localhost:3000/api/blogs/published \
  -H "Authorization: Bearer $TOKEN"

# 6. Unpublish the blog
curl -X PUT http://localhost:3000/api/blogs/$BLOG_ID/publish \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isPublished": false}'

# 7. Delete the blog
curl -X DELETE http://localhost:3000/api/blogs/$BLOG_ID \
  -H "Authorization: Bearer $TOKEN"

# 8. Verify deletion
curl -X GET http://localhost:3000/api/blogs/$BLOG_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 24. Bulk Operations Test
```bash
# Create multiple blogs for testing
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/blogs \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: multipart/form-data" \
    -F "title=Test Blog $i" \
    -F "author=Test Author $i" \
    -F "content=Content for test blog $i..." \
    -F "summary=Summary for test blog $i" \
    -F "tags[]=test" \
    -F "tags[]=bulk" \
    -F "isPublished=true"
done

# Test pagination
curl -X GET "http://localhost:3000/api/blogs?page=1&limit=3" \
  -H "Authorization: Bearer $TOKEN"

curl -X GET "http://localhost:3000/api/blogs?page=2&limit=3" \
  -H "Authorization: Bearer $TOKEN"

# Test search across all blogs
curl -X GET "http://localhost:3000/api/blogs/search?q=test&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Test filtering by tags
curl -X GET "http://localhost:3000/api/blogs/tags?tags[]=test" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Performance Testing

### 25. Load Testing
```bash
# Test with large number of blogs
for i in {1..50}; do
  curl -X POST http://localhost:3000/api/blogs \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: multipart/form-data" \
    -F "title=Load Test Blog $i" \
    -F "author=Load Test Author" \
    -F "content=Content for load test blog $i..." \
    -F "summary=Summary for load test blog $i" \
    -F "tags[]=load-test" \
    -F "isPublished=true" &
done

# Test pagination with large dataset
curl -X GET "http://localhost:3000/api/blogs?page=1&limit=100" \
  -H "Authorization: Bearer $TOKEN"

# Test search performance
curl -X GET "http://localhost:3000/api/blogs/search?q=load&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Notes

1. **Authentication**: All endpoints require a valid JWT token in the Authorization header
2. **Role-based Access**: 
   - Admin/Moderator: Full access to all endpoints
   - Author: Can create, update, and view blogs
   - Regular users: Can only view published blogs
3. **File Uploads**: Cover images are handled via multipart/form-data
4. **Validation**: All inputs are validated according to the schema
5. **Error Handling**: Proper error responses with meaningful messages
6. **Pagination**: All list endpoints support pagination with page and limit parameters
7. **Search**: Full-text search across title, content, and summary
8. **Business Logic**: Published blogs cannot be deleted directly

This comprehensive guide covers all aspects of the Blog API, from basic CRUD operations to advanced features like search, statistics, and publishing workflows. 