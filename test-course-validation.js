const mongoose = require('mongoose');
const Course = require('./src/models/course.model');

// Connect to MongoDB (update with your connection string)
mongoose.connect('mongodb://localhost:27017/smart-campus', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

/**
 * Test script to validate course IDs
 * Usage: node test-course-validation.js
 */
async function testCourseValidation() {
  try {
    console.log('🔍 Testing Course Validation...\n');

    // Test 1: Get all available courses
    console.log('📚 Available Courses:');
    const allCourses = await Course.find({ status: 'active' })
      .select('_id name code program semester semesterTerm')
      .populate('program', 'name code');

    if (allCourses.length === 0) {
      console.log('❌ No active courses found in the database.');
      console.log('💡 Please create some courses first before creating enrollments.');
      return;
    }

    allCourses.forEach(course => {
      console.log(`  • ${course.code} - ${course.name} (ID: ${course._id})`);
      console.log(`    Program: ${course.program?.name || 'N/A'} | Semester: ${course.semester} ${course.semesterTerm}`);
    });

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 2: Validate specific course IDs
    const testCourseIds = [
      allCourses[0]?._id, // Valid course ID
      new mongoose.Types.ObjectId(), // Invalid course ID
      'invalid-id-format' // Invalid format
    ].filter(Boolean);

    console.log('🧪 Testing Course ID Validation:');
    
    for (const courseId of testCourseIds) {
      try {
        const course = await Course.findById(courseId);
        if (course) {
          console.log(`✅ Course ID ${courseId} is VALID - ${course.code} - ${course.name}`);
        } else {
          console.log(`❌ Course ID ${courseId} is INVALID - Course not found`);
        }
      } catch (error) {
        console.log(`❌ Course ID ${courseId} is INVALID - ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 3: Sample enrollment data
    if (allCourses.length > 0) {
      const sampleCourse = allCourses[0];
      console.log('📝 Sample Enrollment Request:');
      console.log(JSON.stringify({
        student: "YOUR_STUDENT_ID_HERE",
        program: sampleCourse.program?._id || "YOUR_PROGRAM_ID_HERE",
        semester: sampleCourse.semester,
        semesterTerm: sampleCourse.semesterTerm,
        academicYear: "2024-2025",
        courses: [sampleCourse._id.toString()],
        status: "active",
        enrollmentType: "full_time"
      }, null, 2));
    }

    console.log('\n' + '='.repeat(60) + '\n');
    console.log('💡 Tips for fixing enrollment issues:');
    console.log('1. Make sure all course IDs exist in the database');
    console.log('2. Verify course IDs are valid MongoDB ObjectIds');
    console.log('3. Ensure courses are active (status: "active")');
    console.log('4. Check that courses belong to the specified program');
    console.log('5. Use the /api/enrollments/available-courses endpoint to get valid course IDs');

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the test
testCourseValidation(); 