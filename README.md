# Smart Campus Backend API

A comprehensive Node.js backend API for a Smart Campus management system built with Express, Mongoose, and JWT authentication.

## Features

- 🔐 **JWT Authentication & Authorization** - Secure user authentication with role-based access control
- 👥 **User Management** - Complete CRUD operations for users with different roles (Admin, Faculty, Student)
- 📚 **Course Management** - Comprehensive course management with enrollment, materials, and assignments
- 🛡️ **Security** - Rate limiting, CORS, Helmet, input validation, and error handling
- 📊 **Statistics & Analytics** - User and course statistics for admin dashboard
- 🔍 **Search & Filtering** - Advanced search and filtering capabilities
- 📄 **File Management** - Course materials and assignment file handling
- 🧪 **Testing** - Comprehensive test suite with Jest
- 📝 **API Documentation** - Swagger/OpenAPI documentation
- 🚀 **Performance** - Redis caching support and optimized database queries

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express-validator
- **Logging**: Winston
- **Testing**: Jest with Supertest
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, Rate Limiting
- **Caching**: Redis (optional)

## Project Structure

```
smart-campus-be/
├── src/
│   ├── config/           # Configuration files
│   │   ├── db.config.js  # Database configuration
│   │   └── redis.config.js # Redis configuration
│   ├── controllers/      # Route controllers
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   └── course.controller.js
│   ├── middleware/       # Custom middleware
│   │   ├── auth.middleware.js
│   │   └── error.middleware.js
│   ├── models/          # Mongoose models
│   │   ├── user.model.js
│   │   └── course.model.js
│   ├── routes/          # API routes
│   │   ├── auth.route.js
│   │   ├── user.route.js
│   │   └── course.route.js
│   ├── services/        # Business logic
│   │   ├── user.service.js
│   │   └── course.service.js
│   ├── utils/           # Utility functions
│   │   ├── logger.js
│   │   ├── responseHandler.js
│   │   └── jwt.js
│   ├── validation/      # Input validation
│   │   ├── user.validation.js
│   │   └── course.validation.js
│   └── tests/           # Test files
│       └── setup.js
├── logs/                # Application logs
├── .env.example         # Environment variables template
├── .gitignore
├── jest.config.js       # Jest configuration
├── package.json
├── README.md
└── server.js           # Main application file
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-campus-be
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/smart-campus
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system or use MongoDB Atlas.

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/profile` - Get user profile
- `PUT /api/v1/auth/profile` - Update user profile
- `POST /api/v1/auth/change-password` - Change password

### Users
- `GET /api/v1/users` - Get all users (Admin only)
- `GET /api/v1/users/:userId` - Get user by ID
- `POST /api/v1/users` - Create new user (Admin only)
- `PUT /api/v1/users/:userId` - Update user
- `DELETE /api/v1/users/:userId` - Delete user (Admin only)
- `GET /api/v1/users/role/:role` - Get users by role
- `GET /api/v1/users/stats` - Get user statistics

### Courses
- `GET /api/v1/courses` - Get all courses
- `GET /api/v1/courses/:courseId` - Get course by ID
- `POST /api/v1/courses` - Create new course (Faculty/Admin)
- `PUT /api/v1/courses/:courseId` - Update course
- `DELETE /api/v1/courses/:courseId` - Delete course
- `POST /api/v1/courses/:courseId/enroll` - Enroll student
- `POST /api/v1/courses/:courseId/remove-student` - Remove student
- `POST /api/v1/courses/:courseId/materials` - Add course material
- `POST /api/v1/courses/:courseId/assignments` - Add assignment
- `POST /api/v1/courses/:courseId/assignments/:assignmentId/submit` - Submit assignment

## User Roles

### Admin
- Full access to all features
- User management (CRUD operations)
- Course management
- System statistics and analytics

### Faculty
- Create and manage their own courses
- Add course materials and assignments
- Grade student assignments
- View enrolled students

### Student
- View available courses
- Enroll in courses
- Submit assignments
- View grades and feedback

## Database Models

### User Model
- Basic info (name, email, password)
- Role-based access (admin, faculty, student)
- Department and contact information
- Account status and verification

### Course Model
- Course details (title, code, description)
- Instructor assignment
- Student enrollment
- Course materials and assignments
- Schedule and capacity management

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-based Access Control** - Different permissions for different user roles
- **Input Validation** - Comprehensive request validation using express-validator
- **Rate Limiting** - Protection against API abuse
- **CORS Configuration** - Cross-origin resource sharing setup
- **Helmet** - Security headers for Express
- **Password Hashing** - Bcrypt for secure password storage
- **Error Handling** - Centralized error handling middleware

## Testing

Run the test suite:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/smart-campus` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `JWT_REFRESH_SECRET` | JWT refresh secret | Required |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `30d` |
| `REDIS_URL` | Redis connection URL | Optional |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## API Documentation

Once the server is running, you can access the API documentation at:
```
http://localhost:5000/api-docs
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository. 