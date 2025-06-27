const attendanceRoutes = require('./routes/attendance.route');
const examRoutes = require('./routes/exam.route');
const feedbackRoutes = require('./routes/feedback.route');
const blogRoutes = require('./routes/blog.route');

app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/exams', examRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/blogs', blogRoutes); 